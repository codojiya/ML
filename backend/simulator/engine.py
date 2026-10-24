import numpy as np
from datetime import timedelta
from scipy.stats import poisson
from backend.core.config import *

def run(direction, start, delay_station=None, delay_min=0, rain=0.0, event=0, event_station=None, multiplier=1.0, duration=120, seed=7, mitigation=None, mitigation_time=15):
    """Minute-level corridor simulation. Same uniforms U drive baseline and scenario (common random numbers)."""
    order = list(range(N)) if direction == "southbound" else list(range(N-1, -1, -1))
    pos_of = {s: p for p, s in enumerate(order)}
    U = np.random.default_rng(seed).random((duration, N))
    lam = np.zeros((duration, N))
    dpos = pos_of.get(delay_station, -1)

    for t in range(duration):
        ts = start + timedelta(minutes=t)
        for i in range(N):
            base_lam = demand_rate(i, direction, ts, rain, event if i == event_station else 0) / 15 * multiplier
            if mitigation == "gate_metering" and i == delay_station and mitigation_time <= t <= mitigation_time + 50:
                base_lam *= 0.55
            lam[t, i] = base_lam

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
    relief_dispatched = False

    for t in range(duration):
        for i in range(N):
            p = pos_of[i]
            if p < N - 1:
                q[p, p + 1:] += arr[t, i] / (N - 1 - p)
                arrived += arr[t, i]
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

        # Tactical Relief Rake Injection
        if mitigation == "relief_rake" and not relief_dispatched and t >= mitigation_time and delay_min > 0 and dpos >= 0:
            relief_dispatched = True
            train_counter += 1
            relief_start_pos = max(0, dpos - 1)
            tr_relief = dict(
                id="R-RELIEF",
                num=train_counter,
                pos=relief_start_pos,
                ready=t,
                phase="arrive",
                load=np.zeros(N),
                dep_from=relief_start_pos,
                dep_time=t,
                enter_t=t,
                done=False,
                hold_until=-1,
                positions_by_minute=[None] * duration,
                loads_by_minute=[None] * duration,
                held_by_minute=[False] * duration
            )
            active_trains.append(tr_relief)
            all_train_records.append(tr_relief)

        # Process active trains in strict chronological/FIFO order
        station_occupied = [None] * N
        for other_tr in active_trains:
            if other_tr["phase"] in ("arrive", "depart", "terminal_hold") and not other_tr["done"]:
                station_occupied[other_tr["pos"]] = other_tr["id"]

        active_trains_sorted = sorted(active_trains, key=lambda x: x["num"])

        for tr in active_trains_sorted:
            if tr["ready"] > t:
                continue

            p = tr["pos"]

            if tr["phase"] == "arrive":
                a = tr["load"][p]
                tr["load"][p] = 0
                alighted += a

                hold = 0
                if p == dpos and not held and t >= 10 and delay_min > 0 and tr["id"] != "R-RELIEF":
                    hold = delay_min
                    held = True
                    tr["hold_until"] = t + hold

                if p == N - 1:
                    # Final terminus station
                    if hold > 0:
                        tr["phase"] = "terminal_hold"
                        tr["ready"] = t + hold
                    else:
                        tr["done"] = True
                        active_trains.remove(tr)
                    continue

                tr["phase"] = "depart"
                tr["ready"] = max(t + 1, last_dep[p] + 2) + hold

            elif tr["phase"] == "terminal_hold":
                tr["done"] = True
                active_trains.remove(tr)

            elif tr["phase"] == "depart":
                next_p = p + 1
                # Block signaling: next station must be clear of preceding trains
                if next_p < N:
                    occupant = station_occupied[next_p]
                    if occupant is not None and occupant != tr["id"]:
                        # Block occupied: wait at platform with red signal
                        tr["ready"] = t + 1
                        continue

                space = CAPACITY - tr["load"].sum()
                tot = q[p].sum()
                f = min(1.0, space / tot) if tot > 0 else 0
                b = q[p] * f
                q[p] -= b
                tr["load"] += b
                viol += int(tr["load"].sum() > CAPACITY + 1e-6)
                maxload = max(maxload, tr["load"].sum())
                last_dep[p] = t

                tr["pos"] = next_p
                tr["phase"] = "arrive"
                seg_time = SEG_MIN
                if mitigation == "skip_stop" and p in (3, 4, 7):
                    seg_time = max(1, SEG_MIN - 1)
                tr["ready"] = t + seg_time
                tr["dep_from"] = p
                tr["dep_time"] = t
                station_occupied[p] = None
                if next_p < N:
                    station_occupied[next_p] = tr["id"]

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
