import urllib.request
import json

def test_new_endpoints():
    print("Testing 1: GET /api/weather/live")
    w_req = urllib.request.urlopen("http://127.0.0.1:8001/api/weather/live")
    w_data = json.loads(w_req.read().decode())
    print("  Weather status:", w_data["status"], "| Station:", w_data["station"], "| Rain:", w_data["rainfall_mm_hr"], "mm/hr")

    print("\nTesting 2: GET /api/cctv/stream?station_id=ADH")
    c_req = urllib.request.urlopen("http://127.0.0.1:8001/api/cctv/stream?station_id=ADH")
    c_data = json.loads(c_req.read().decode())
    print("  CCTV camera:", c_data["camera_id"], "| Headcount:", c_data["live_headcount"], "| Density:", c_data["density_sqm"], "p/m²", "| LOS:", c_data["fruin_los"], "| BBoxes:", len(c_data["bounding_boxes"]))

    print("\nTesting 3: POST /api/mitigate (Andheri 20m delay)")
    m_payload = json.dumps({
        "station_id": "ADH",
        "direction": "southbound",
        "timestamp": "2026-06-01T08:30:00",
        "train_delay_min": 20,
        "rainfall_mm": 0.0,
        "event_intensity": 0,
        "demand_multiplier": 1.0
    }).encode()
    m_req = urllib.request.Request("http://127.0.0.1:8001/api/mitigate", data=m_payload, headers={"Content-Type": "application/json"})
    m_res = urllib.request.urlopen(m_req)
    m_data = json.loads(m_res.read().decode())
    print("  Station:", m_data["station_name"])
    print("  Unmitigated Peak:", m_data["unmitigated_peak"], "passengers | Density:", m_data["unmitigated_density"], "p/m²")
    for p in m_data["plans"]:
        print(f"  Plan [{p['id']}]: peak={p['peak_waiting']}p, relieved={p['waiting_relieved']}p (-{p['recovery_pct']}%), density={p['density_sqm']} p/m² -> {p['los']}")

if __name__ == "__main__":
    test_new_endpoints()
