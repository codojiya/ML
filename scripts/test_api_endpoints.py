import urllib.request
import json

def test_sim(station, direction, delay):
    req = urllib.request.Request('http://127.0.0.1:8000/api/simulate', data=json.dumps({
        'station_id': station,
        'direction': direction,
        'timestamp': '2026-06-01T08:30:00',
        'train_delay_min': delay,
        'rainfall_mm': 0.0,
        'event_intensity': 0,
        'demand_multiplier': 1.0
    }).encode(), headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    st = next(s for s in data['stations'] if s['station_id'] == station)
    resid = data['conservation_residual']['scenario']
    aff = data['affected_stations']
    dp = st['delta_peak']
    print(f"Station {station:4s} ({direction:10s}, {delay:2d}m delay): delta_peak = +{dp:5.1f}p, affected = {aff:2d}/11, residual = {resid:.12f}")

if __name__ == "__main__":
    print("Testing Simulation API across multiple stations & directions:")
    test_sim('ADH', 'southbound', 20)
    test_sim('MLD', 'southbound', 20)
    test_sim('BVI', 'southbound', 20)
    test_sim('BA',  'southbound', 20)
    test_sim('ADH', 'northbound', 20)
    test_sim('MLD', 'northbound', 20)
    test_sim('BA',  'northbound', 20)
