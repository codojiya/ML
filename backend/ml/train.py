import pandas as pd, numpy as np, json, joblib, pathlib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error as MAE, mean_squared_error, r2_score
from catboost import CatBoostRegressor
from backend.core.config import IDS
ROOT=pathlib.Path(__file__).resolve().parents[2]
FEATS=["station_idx","dir_int","hour","minute","day_of_week","is_weekend","is_holiday","rainfall_mm","event_intensity","lag4_arrivals"]
def build(df):
    df=df.sort_values(["station_id","direction","timestamp"]).copy()
    df["station_idx"]=df.station_id.map({s:i for i,s in enumerate(IDS)}); df["dir_int"]=(df.direction=="northbound").astype(int)
    # lag4 = arrivals one hour earlier: known at forecast origin for every horizon 1..4 (no leakage)
    df["lag4_arrivals"]=df.groupby(["station_id","direction"]).simulated_passenger_arrivals.shift(4)
    df["lag4_arrivals"]=df.lag4_arrivals.fillna(df.groupby(["station_id","direction","hour"]).simulated_passenger_arrivals.transform("mean"))
    return df
def main():
    df=build(pd.read_csv(ROOT/"data/processed/crowd_dataset.csv",parse_dates=["timestamp"])); y="simulated_passenger_arrivals"
    tr,va,te=df[df.day_index<60],df[(df.day_index>=60)&(df.day_index<75)],df[df.day_index>=75]
    key=["station_id","direction","hour","minute","is_weekend"]; hist=tr.groupby(key)[y].mean().rename("p").reset_index()
    base=lambda d: d.merge(hist,on=key,how="left").p.fillna(tr[y].mean()).values
    rf=RandomForestRegressor(200,min_samples_leaf=3,n_jobs=-1,random_state=42).fit(tr[FEATS],tr[y])
    cb=CatBoostRegressor(iterations=600,depth=6,learning_rate=0.08,random_seed=42,verbose=0).fit(tr[FEATS],tr[y])
    preds={"HistoricalAverage":base,"RandomForest":lambda d:rf.predict(d[FEATS]),"CatBoost":lambda d:cb.predict(d[FEATS])}
    res=[]
    for n,f in preds.items():
        for sp,d in (("validation",va),("test",te)):
            p=f(d); res.append(dict(model=n,split=sp,MAE=MAE(d[y],p),RMSE=mean_squared_error(d[y],p)**.5,R2=r2_score(d[y],p)))
    r=pd.DataFrame(res); r.to_csv(ROOT/"reports/model_comparison.csv",index=False)
    v=r[(r.split=="validation")&(r.model!="HistoricalAverage")].set_index("model").MAE
    win="CatBoost" if v["CatBoost"]<=v["RandomForest"]*1.02 else "RandomForest"; m={"CatBoost":cb,"RandomForest":rf}[win]
    imp=m.get_feature_importance() if win=="CatBoost" else m.feature_importances_
    json.dump({"winner":win,"rows":{"train":len(tr),"validation":len(va),"test":len(te)},"metrics":res,
      "feature_importance":dict(zip(FEATS,map(float,imp))),
      "note":"Synthetic data: test scores reflect learnability of the generator, NOT real-world accuracy."},open(ROOT/"reports/evaluation/metrics.json","w"),indent=2)
    pd.DataFrame({"actual":te[y].values[:500],"predicted":m.predict(te[FEATS])[:500]}).to_csv(ROOT/"reports/evaluation/actual_vs_predicted.csv",index=False)
    joblib.dump({"model":m,"name":win,"feats":FEATS},ROOT/"backend/ml/models/production_model.joblib")
    print(r.round(3).to_string(),"\nwinner:",win)
if __name__=="__main__": main()
