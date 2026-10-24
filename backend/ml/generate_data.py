import numpy as np, pandas as pd, pathlib
from datetime import datetime, timedelta
from backend.core.config import *
ROOT=pathlib.Path(__file__).resolve().parents[2]
def main():
    rng=np.random.default_rng(42); rows=[]; day0=datetime(2026,6,1)
    events={d:(int(rng.integers(0,N)),int(rng.integers(1,3))) for d in range(90) if rng.random()<0.06}
    for d in range(90):
        dayrain=rng.exponential(6) if rng.random()<0.6 else 0.0
        queue={dr:[0.0]*N for dr in DIRS}
        for s in range(68):
            ts=day0+timedelta(days=d,hours=6,minutes=15*s)
            rain=float(np.clip(dayrain*rng.uniform(0.2,1.8),0,40)) if dayrain>0 else 0.0
            for dr in DIRS:
                order=range(N) if dr=="southbound" else range(N-1,-1,-1); load=float(INIT_LOAD)
                for k,i in enumerate(order):
                    ev=events[d][1] if d in events and events[d][0]==i and 17<=ts.hour<20 else 0
                    lam=demand_rate(i,dr,ts,rain,ev)
                    arr=int(rng.poisson(lam*rng.gamma(20,1/20)))  # gamma-Poisson = negative binomial
                    delay=float(rng.exponential(2)) if rng.random()<0.15 else 0.0
                    n=15/(HEADWAY+0.8*delay); q=queue[dr][i]+arr
                    af=1.0 if k==N-1 else (0.08+0.2*(1-STATIONS[i][4])); alight=load*af; rem=load-alight
                    board=min(q,n*max(CAPACITY-rem,0)); queue[dr][i]=q-board; load=rem+board/n
                    ci=0.5*min(queue[dr][i]/400,1.5)+0.5*load/CAPACITY
                    rows.append((ts,STATIONS[i][0],STATIONS[i][1],dr,ts.weekday(),ts.hour,ts.minute,int(ts.weekday()>=5),
                      int(ts.date() in HOLIDAYS),round(rain,2),"Heavy" if rain>15 else "Moderate" if rain>5 else "None",ev,
                      STATIONS[i][5],arr,round(HEADWAY,1),round(delay,2),round(board,1),round(alight,1),round(queue[dr][i],1),
                      round(load,1),round(ci,3),category(ci),d))
    cols="timestamp station_id station_name direction day_of_week hour minute is_weekend is_holiday rainfall_mm weather_category event_intensity station_baseline_demand simulated_passenger_arrivals service_headway_minutes service_delay_minutes boarding_passengers alighting_passengers waiting_passengers onboard_train_load estimated_crowd_index crowd_category day_index".split()
    df=pd.DataFrame(rows,columns=cols); assert len(df)==134640 and (df.waiting_passengers>=0).all()
    df.to_csv(ROOT/"data/processed/crowd_dataset.csv",index=False); df.head(200).to_csv(ROOT/"data/sample_observations.csv",index=False)
    print("rows",len(df))
if __name__=="__main__": main()
