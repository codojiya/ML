from fastapi.testclient import TestClient
from backend.main import app

c = TestClient(app)

def test_overview_endpoint():
    r = c.get("/api/overview?timestamp=2026-08-03T08:00:00&direction=southbound")
    assert r.status_code == 200
    data = r.json()
    assert "stations" in data and len(data["stations"]) == 11
    assert "summary" in data
    assert "busiest_station" in data["summary"]
    assert "corridor_mean_crowd_index" in data["summary"]
    assert "top_congested" in data and len(data["top_congested"]) == 5
    assert all("trend_sparkline" in s for s in data["stations"])

def test_timeline_endpoint():
    r = c.get("/api/overview/timeline?date=2026-08-03&direction=southbound")
    assert r.status_code == 200
    data = r.json()
    assert len(data["slots"]) == 68
    assert "matrix" in data
    assert "ADH" in data["matrix"]
    assert len(data["matrix"]["ADH"]) == 68

def test_dataset_summary_and_records():
    r_sum = c.get("/api/dataset/summary")
    assert r_sum.status_code == 200
    data_sum = r_sum.json()
    assert data_sum["total_rows"] == 134640
    assert data_sum["stations_count"] == 11

    r_rec = c.get("/api/dataset/records?page=1&page_size=25&station_id=ADH&direction=southbound")
    assert r_rec.status_code == 200
    data_rec = r_rec.json()
    assert data_rec["page"] == 1
    assert len(data_rec["records"]) == 25
    assert all(rec["station_id"] == "ADH" for rec in data_rec["records"])

def test_dataset_export():
    r = c.get("/api/dataset/export?station_id=ADH&direction=southbound")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    assert "timestamp,station_id,station_name" in r.text

def test_simulate_sweep():
    payload = {
        "station_id": "ADH",
        "direction": "southbound",
        "timestamp": "2026-08-03T08:00:00",
        "rainfall_mm": 0.0,
        "event_intensity": 0,
        "demand_multiplier": 1.0
    }
    r = c.post("/api/simulate/sweep", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "sweep" in data and len(data["sweep"]) == 7
    delays = [item["delay_min"] for item in data["sweep"]]
    assert delays == [0, 5, 10, 15, 20, 25, 30]
    # Check nonlinearity / monotonic growth of station peak
    peaks = [item["station_peak_waiting"] for item in data["sweep"]]
    assert peaks[-1] >= peaks[0]

def test_extended_simulate():
    payload = {
        "station_id": "ADH",
        "direction": "southbound",
        "timestamp": "2026-08-03T08:00:00",
        "train_delay_min": 20,
        "rainfall_mm": 0.0,
        "event_intensity": 0,
        "demand_multiplier": 1.0
    }
    r = c.post("/api/simulate", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "waiting_by_minute" in data
    assert "ADH" in data["waiting_by_minute"]
    assert len(data["waiting_by_minute"]["ADH"]) == 120
    assert "trains" in data and len(data["trains"]) > 0
    assert "positions_by_minute" in data["trains"][0]
    assert len(data["trains"][0]["positions_by_minute"]) == 120
    assert "summary" in data
    assert data["summary"]["peak_station"] == "ADH"
    assert data["summary"]["total_extra_waiting"] > 0

def test_forecast_with_explanation():
    payload = {
        "station_id": "ADH",
        "direction": "southbound",
        "timestamp": "2026-08-03T08:00:00",
        "rainfall_mm": 5.0,
        "event_intensity": 1,
        "horizon_steps": 4
    }
    r = c.post("/api/forecast", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert len(data["forecast"]) == 4
    assert "explanation" in data and len(data["explanation"]) > 0
    top_factor = data["explanation"][0]
    assert "feature" in top_factor
    assert "shap_value" in top_factor
    assert "description" in top_factor
    assert "associated with" in top_factor["description"].lower()

def test_model_evaluation():
    r = c.get("/api/model/evaluation")
    assert r.status_code == 200
    data = r.json()
    assert "actual_vs_predicted" in data and len(data["actual_vs_predicted"]) > 0
    assert "error_by_hour" in data and len(data["error_by_hour"]) == 17
    assert "error_by_station" in data and len(data["error_by_station"]) == 11
    assert "residual_histogram" in data
