"""Shared ASSUMPTIONS (not verified Mumbai Railway measurements). Station coordinates are approximate."""
from datetime import datetime, date
import numpy as np
STATIONS = [  # id, name, lat, lon (approx), residential_share(0-1), base demand scale
 ("BVI","Borivali",19.2291,72.8573,0.9,140),("KILE","Kandivali",19.2043,72.8517,0.9,120),
 ("MLD","Malad",19.1872,72.8484,0.8,130),("GMN","Goregaon",19.1646,72.8493,0.7,110),
 ("RAM","Ram Mandir",19.1604,72.8503,0.6,70),("JOG","Jogeshwari",19.1361,72.8490,0.6,110),
 ("ADH","Andheri",19.1197,72.8464,0.3,170),("VLP","Vile Parle",19.1000,72.8440,0.5,90),
 ("STC","Santacruz",19.0817,72.8417,0.5,80),("KHR","Khar Road",19.0707,72.8395,0.5,70),
 ("BA","Bandra",19.0544,72.8402,0.2,120)]
N=len(STATIONS); IDS=[s[0] for s in STATIONS]; DIRS=["southbound","northbound"]  # southbound = Borivali->Bandra
CAPACITY=1400; HEADWAY=6.0; INIT_LOAD=150; SEG_MIN=3
HOLIDAYS={date(2026,7,6),date(2026,7,27),date(2026,8,15)}
def rain_factor(r):  # assumption: light rain slightly raises demand, heavy rain suppresses discretionary trips
    return float(np.clip(1+0.01*min(r,10)-0.012*max(r-10,0),0.6,1.2))
def demand_rate(i,direction,ts,rain=0.0,event=0):
    """Mean passenger arrivals per 15 min at station index i, direction."""
    r=STATIONS[i][4]; base=STATIONS[i][5]; h=ts.hour+ts.minute/60
    g=lambda m,s: np.exp(-0.5*((h-m)/s)**2)
    if direction=="southbound": a,b=0.5+0.9*r,0.3+0.3*(1-r)
    else: a,b=0.3+0.5*(1-r),0.5+0.9*(1-r)
    shape=a*g(8.75,1.5)+b*g(18.5,1.75)+0.15
    wk=ts.weekday()>=5; hol=ts.date() in HOLIDAYS
    f=(0.55 if wk else 1)*(0.7 if hol else 1)*rain_factor(rain)*(1+0.6*event)
    return base*shape*f
def category(ci): return "Low" if ci<0.35 else "Moderate" if ci<0.6 else "High" if ci<0.85 else "Severe"
