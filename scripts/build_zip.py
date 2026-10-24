import os
import zipfile
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = ROOT / "Mumbai_CrowdPulse_Complete.zip"
VERIFY_DIR = ROOT / "dist_verification"

EXCLUDE_DIRS = {
    "node_modules",
    "venv",
    ".venv",
    "env",
    "__pycache__",
    ".pytest_cache",
    ".git",
    "dist_verification"
}

EXCLUDE_EXTS = {
    ".pyc",
    ".log"
}

def create_zip():
    print(f"[*] Packaging project into {ZIP_NAME.name}...")
    if ZIP_NAME.exists():
        ZIP_NAME.unlink()

    file_count = 0
    with zipfile.ZipFile(ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ROOT):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in EXCLUDE_EXTS:
                    continue
                if file == ZIP_NAME.name:
                    continue

                full_path = Path(root) / file
                rel_path = full_path.relative_to(ROOT)
                zf.write(full_path, rel_path)
                file_count += 1

    zip_size_mb = ZIP_NAME.stat().st_size / (1024 * 1024)
    print(f"[OK] Created {ZIP_NAME.name}: {file_count} files ({zip_size_mb:.2f} MB)")

def verify_zip():
    print(f"\n[*] Verifying extraction into clean directory {VERIFY_DIR.name}...")
    if VERIFY_DIR.exists():
        shutil.rmtree(VERIFY_DIR)
    VERIFY_DIR.mkdir()

    with zipfile.ZipFile(ZIP_NAME, "r") as zf:
        zf.extractall(VERIFY_DIR)

    essential_paths = [
        "backend/main.py",
        "backend/simulator/engine.py",
        "backend/core/config.py",
        "backend/ml/train.py",
        "backend/ml/models/production_model.joblib",
        "frontend/package.json",
        "frontend/src/App.jsx",
        "frontend/src/pages/OverviewPage.jsx",
        "frontend/src/pages/SimulationPage.jsx",
        "frontend/src/pages/ForecastPage.jsx",
        "frontend/src/pages/ModelInsightsPage.jsx",
        "frontend/src/pages/DataExplorerPage.jsx",
        "start.py",
        "START_WINDOWS.bat",
        "START_MAC_LINUX.sh",
        "README.md",
        "data/processed/crowd_dataset.csv"
    ]

    for p in essential_paths:
        target = VERIFY_DIR / p
        assert target.exists(), f"Missing essential file in extracted archive: {p}"
        print(f"  [+] Verified: {p}")

    print("\n[OK] ZIP extraction and verification passed 100%!")
    # Clean up verification folder
    shutil.rmtree(VERIFY_DIR)
    print("[*] Cleaned up temporary verification directory.")

if __name__ == "__main__":
    create_zip()
    verify_zip()
