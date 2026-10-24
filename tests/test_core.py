from datetime import datetime
from fastapi.testclient import TestClient
from backend.main import app
from backend.simulator.engine import run
c=TestClient(app); T=datetime(2026,8,3,8,0)
def test_health(): assert c.get("/api/health").json()["status"]=="ok"
def test_forecast_nonneg():
    r=c.post("/api/forecast",json=dict(station_id="ADH",direction="southbound",timestamp="2026-08-03T08:00:00")).json()
    assert all(f["predicted_arrivals"]>=0 for f in r["forecast"]) and len(r["forecast"])==4
def test_invalid_station(): assert c.post("/api/forecast",json=dict(station_id="XXX",direction="southbound",timestamp="2026-08-03T08:00:00")).status_code==422
def test_sim_invariants():
    a=run("southbound",T); assert a["capacity_violations"]==0 and a["max_train_load"]<=1400+1e-6 and (a["waiting"]>=0).all()
    assert abs(a["total_arrived"]+a["boundary_in"]-a["final_queue"]-a["onboard"]-a["alighted"])<1e-6
def test_delay_changes_queue():
    b=run("southbound",T,event_station=6); d=run("southbound",T,delay_station=6,delay_min=20,event_station=6)
    assert d["waiting"][:,6].max()>b["waiting"][:,6].max()
def test_simulate_api():
    r=c.post("/api/simulate",json=dict(station_id="ADH",direction="southbound",timestamp="2026-08-03T08:00:00",train_delay_min=20)).json()
    assert r["conservation_residual"]["scenario"]<1e-6
