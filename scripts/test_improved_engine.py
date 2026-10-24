import numpy as np
from datetime import datetime, timedelta
from scipy.stats import poisson
from backend.core.config import *

def simulate_corridor(direction, start, delay_station=None, delay_min=0, rain=0.0, event=0, event_station=None, multiplier=1.0, duration=120, seed=7):
    order = list(range(N)) if direction == "southbound" else list(range(N-1, -1, -1))
    pos_of = {s: p for p, s in enumerate(order)}
    U = np.random.default_rng(seed).random((duration, N))
    lam = np.zeros((duration, N))
    for t in range(duration):
        ts = start + timedelta(minutes=t)
        for i in range(N):
            lam[t, i] = demand_rate(i, direction, ts, rain, event if i == event_station else 0) / 15 * multiplier
    arr = poisson.ppf(U, lam)
    q = np.zeros((N, N))
    for p, s in enumerate(order):  # warm start: ~10 min of arrivals
        if p < N - 1:
            q[p, p + 1:] = demand_rate(s, direction, start) / 15 * 10 / (N - 1 - p)
    arrived = q.sum()
    active_trains = []
    all_train_records = []
    last_dep = [-99] * N
    wait = np.zeros((duration, N))
    alighted = 0.0
    boundary = 0.0
    dpos = pos_of.get(delay_station, -1)
    held = False
    maxload = 0.0
    viol = 0
    train_counter = 0

    # Block tracking: which train ID currently occupies station p
    station_occupied = [None] * N

    for t in range(duration):
        # 1. New passenger arrivals at stations
        for i in range(N):
            p = pos_of[i]
            if p < N - 1:
                q[p, p + 1:] += arr[t, i] / (N - 1 - p)
                arrived += arr[t, i]

        # 2. Dispatch new train into terminal (p=0) if scheduled and platform is clear
        if t % int(HEADWAY) == 0:
            train_counter += 1
            ld = np.zeros(N)
            ld[1:] = INIT_LOAD / (N - 1)
            boundary += INIT_LOAD
            tr = dict(
                id=f"T{train_counter}",
                num=train_counter,
                pos=0,
                ready=t,
                phase="arrive",
                load=ld,
                dep_from=0,
                dep_time=t,
                enter_t=t,
                done=False,
                hold_until=-1,
                positions_by_minute=[None] * duration,
                loads_by_minute=[None] * duration,
                held_by_minute=[False] * duration
            )
            active_trains.append(tr)
            all_train_records.append(tr)

        # 3. Process active trains in strict FIFO order (lowest train num first)
        active_trains_sorted = sorted(active_trains, key=lambda x: x["num"])

        for tr in active_trains_sorted:
            if tr["ready"] > t:
                continue

            p = tr["pos"]

            if tr["phase"] == "arrive":
                # Train arrived at station p
                station_occupied[p] = tr["id"]
                a = tr["load"][p]
                tr["load"][p] = 0
                alighted += a

                # Check if this station is the delayed station
                hold = 0
                if p == dpos and not held and t >= 10 and delay_min > 0:
                    hold = delay_min
                    held = True
                    tr["hold_until"] = t + hold

                if p == N - 1:
                    # Final terminus station
                    if hold > 0:
                        # Held at terminus platform/approach
                        tr["phase"] = "terminal_hold"
                        tr["ready"] = t + hold
                    else:
                        station_occupied[p] = None
                        tr["done"] = True
                        active_trains.remove(tr)
                    continue

                # Transition to depart phase
                tr["phase"] = "depart"
                # Minimum dwell: at least 1 min, headway from last departure, plus any hold
                tr["ready"] = max(t + 1, last_dep[p] + 2) + hold

            elif tr["phase"] == "terminal_hold":
                # Terminal hold completed
                station_occupied[p] = None
                tr["done"] = True
                active_trains.remove(tr)

            elif tr["phase"] == "depart":
                # Train wants to depart from p to p+1
                # Block signaling: can only depart if station p+1 is NOT occupied
                next_p = p + 1
                if next_p < N and station_occupied[next_p] is not None:
                    # Next station is occupied! Train must wait at p (red signal)
                    tr["ready"] = t + 1
                    continue

                # Can depart! Board waiting passengers from platform p
                space = CAPACITY - tr["load"].sum()
                tot = q[p].sum()
                f = min(1.0, space / tot) if tot > 0 else 0
                b = q[p] * f
                q[p] -= b
                tr["load"] += b
                viol += int(tr["load"].sum() > CAPACITY + 1e-6)
                maxload = max(maxload, tr["load"].sum())

                # Clear station p
                station_occupied[p] = None
                last_dep[p] = t

                # Advance to next station
                tr["pos"] = next_p
                tr["phase"] = "arrive"
                tr["ready"] = t + SEG_MIN
                tr["dep_from"] = p
                tr["dep_time"] = t

        # 4. Record positions and loads for visualization
        for tr in all_train_records:
            if tr["enter_t"] <= t and not tr["done"]:
                if tr["phase"] == "arrive" and tr.get("dep_time") is not None and tr["ready"] > tr["dep_time"]:
                    frac = min(1.0, max(0.0, (t - tr["dep_time"]) / (tr["ready"] - tr["dep_time"])))
                    r_pos = tr["dep_from"] + frac
                else:
                    r_pos = float(tr["pos"])
                c_pos = r_pos if direction == "southbound" else (N - 1 - r_pos)
                tr["positions_by_minute"][t] = round(float(c_pos), 3)
                tr["loads_by_minute"][t] = round(float(tr["load"].sum()), 1)
                tr["held_by_minute"][t] = bool(tr.get("hold_until", -1) > t)

        for i in range(N):
            wait[t, i] = q[pos_of[i]].sum()

    clean_trains = [
        dict(
            id=tr["id"],
            positions_by_minute=tr["positions_by_minute"],
            loads_by_minute=tr["loads_by_minute"],
            held_by_minute=tr["held_by_minute"]
        )
        for tr in all_train_records
    ]

    return dict(
        waiting=wait,
        total_arrived=float(arrived),
        boundary_in=float(boundary),
        final_queue=float(q.sum()),
        onboard=float(sum(tr["load"].sum() for tr in active_trains)),
        alighted=float(alighted),
        capacity_violations=viol,
        max_train_load=float(maxload),
        trains=clean_trains
    )

if __name__ == "__main__":
    start = datetime(2026, 6, 1, 8, 30)
    # Test 1: Andheri 20m delay southbound
    res = simulate_corridor("southbound", start, delay_station=6, delay_min=20)
    residual = abs(res["total_arrived"] + res["boundary_in"] - res["final_queue"] - res["onboard"] - res["alighted"])
    print(f"Test 1 (Andheri SB): Conservation residual: {residual:.14f}, Violations: {res['capacity_violations']}")
    assert residual < 1e-10, f"Residual too large: {residual}"

    # Verify no overtaking:
    trains = res["trains"]
    for t in range(120):
        positions = [tr["positions_by_minute"][t] for tr in trains if tr["positions_by_minute"][t] is not None]
        for a, b in zip(positions, positions[1:]):
            # In southbound, earlier train has LARGER or EQUAL position than later train
            assert a >= b - 1e-3, f"Overtaking detected at t={t}: {a} < {b}"
    print("Test 1 passed: Monotonic train order verified! No train ever overtakes another!")

    # Test 2: Bandra (terminus) 20m delay southbound
    res_ba = simulate_corridor("southbound", start, delay_station=10, delay_min=20)
    res_base = simulate_corridor("southbound", start, delay_station=None, delay_min=0)
    delta_ba = res_ba["waiting"][:, 10].max() - res_base["waiting"][:, 10].max()
    print(f"Test 2 (Bandra Terminus SB): Delta peak: {delta_ba:.1f}")

    # Test 3: Northbound with Andheri delay
    res_nb = simulate_corridor("northbound", start, delay_station=6, delay_min=20)
    res_nb_base = simulate_corridor("northbound", start, delay_station=None, delay_min=0)
    res_nb_resid = abs(res_nb["total_arrived"] + res_nb["boundary_in"] - res_nb["final_queue"] - res_nb["onboard"] - res_nb["alighted"])
    print(f"Test 3 (Andheri NB): Conservation residual: {res_nb_resid:.14f}")
    assert res_nb_resid < 1e-10
    print("ALL TESTS PASSED!")
