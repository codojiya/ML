#!/usr/bin/env python3
"""
Mumbai CrowdPulse - Unified Startup & Orchestration Script
Starts both FastAPI backend (:8000) and Vite frontend (:5173), opens browser, and handles clean termination.
"""

import os
import sys
import time
import socket
import subprocess
import webbrowser
import signal
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def is_port_open(port, host="127.0.0.1"):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def wait_for_port(port, name, timeout=30):
    start = time.time()
    print(f"[*] Waiting for {name} to be ready on port {port}...")
    while time.time() - start < timeout:
        if is_port_open(port):
            print(f"[+] {name} is active on port {port}!")
            return True
        time.sleep(0.5)
    print(f"[-] Timeout waiting for {name} on port {port}.")
    return False

def ensure_dependencies():
    print("[*] Checking backend requirements...")
    try:
        import fastapi, uvicorn, catboost, pandas, scipy, sklearn, joblib
    except ImportError as e:
        print(f"[!] Missing Python dependency ({e}). Installing from requirements.txt...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(ROOT / "backend/requirements.txt")])

    frontend_dir = ROOT / "frontend"
    if not (frontend_dir / "node_modules").exists():
        print("[!] Missing frontend node_modules. Running npm install...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        subprocess.check_call([npm_cmd, "install"], cwd=str(frontend_dir))

def main():
    print("=" * 65)
    print("      MUMBAI CROWDPULSE - TRANSPORT CONTROL CENTER")
    print("        Western Line Crowd Forecasting & Simulation")
    print("=" * 65)

    ensure_dependencies()

    backend_proc = None
    frontend_proc = None

    try:
        # Start FastAPI backend
        print("[*] Launching FastAPI backend on http://127.0.0.1:8001...")
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8001"],
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        # Start Vite frontend
        print("[*] Launching Vite frontend on http://127.0.0.1:5173...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
            cwd=str(ROOT / "frontend"),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        backend_ready = wait_for_port(8001, "FastAPI Backend")
        frontend_ready = wait_for_port(5173, "Vite Frontend")

        if backend_ready and frontend_ready:
            print("\n" + "=" * 65)
            print("[✓] ALL SYSTEMS OPERATIONAL!")
            print("    Control Center UI: http://127.0.0.1:5173")
            print("    FastAPI API Docs:  http://127.0.0.1:8001/docs")
            print("=" * 65)
            print("[*] Opening default web browser...")
            webbrowser.open("http://127.0.0.1:5173")
            print("\n[*] Press Ctrl+C at any time to shut down both servers cleanly.\n")

            while True:
                time.sleep(1)
        else:
            print("[-] One or more services failed to initialize. Check logs.")

    except KeyboardInterrupt:
        print("\n[*] Initiating clean graceful shutdown...")
    finally:
        if backend_proc:
            print("[*] Stopping FastAPI backend...")
            backend_proc.terminate()
            try:
                backend_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                backend_proc.kill()

        if frontend_proc:
            print("[*] Stopping Vite frontend...")
            frontend_proc.terminate()
            try:
                frontend_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                frontend_proc.kill()

        print("[✓] Shutdown complete. Goodbye.")

if __name__ == "__main__":
    main()
