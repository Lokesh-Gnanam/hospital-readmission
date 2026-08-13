import os
import sys
import numpy as np
import pandas as pd
import joblib

# Setup system path to locate backend app and training modules
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)
sys.path.append(backend_dir)
sys.path.append(os.path.join(root_dir, "src"))

from fastapi.testclient import TestClient
from app.main import app

def run_parity_check():
    print("=== STARTING PREDICTION PARITY CHECK ===")
    
    # 1. Load data from the parent data folder
    csv_path = os.path.join(root_dir, "data", "hospital_readmissions.csv")
    if not os.path.exists(csv_path):
        print(f"Error: Dataset not found at {csv_path}")
        sys.exit(1)
        
    df = pd.read_csv(csv_path)
    print(f"Loaded dataset with {len(df)} records.")
    
    # Pick a sample of 10 records
    sample_df = df.sample(10, random_state=42)
    
    # 2. Load model directly using joblib
    model_path = os.path.join(root_dir, "models", "readmission_model.pkl")
    direct_model = joblib.load(model_path)
    
    # 3. Initialize FastAPI TestClient
    with TestClient(app) as client:
        mismatches = 0
        
        for idx, row in sample_df.iterrows():
            # Construct patient features dict
            patient_features = {
                "time_in_hospital": int(row["time_in_hospital"]),
                "n_lab_procedures": int(row["n_lab_procedures"]),
                "n_procedures": int(row["n_procedures"]),
                "n_medications": int(row["n_medications"]),
                "n_outpatient": int(row["n_outpatient"]),
                "n_inpatient": int(row["n_inpatient"]),
                "n_emergency": int(row["n_emergency"]),
                "age": row["age"],
                "medical_specialty": row["medical_specialty"],
                "diag_1": row["diag_1"],
                "diag_2": row["diag_2"],
                "diag_3": row["diag_3"],
                "glucose_test": row["glucose_test"],
                "A1Ctest": row["A1Ctest"],
                "change": row["change"],
                "diabetes_med": row["diabetes_med"]
            }
            
            # --- Direct Python Inference ---
            # Input DataFrame for direct model (must keep exact same column names)
            df_direct = pd.DataFrame([patient_features])
            direct_prob = float(direct_model.predict_proba(df_direct)[0, 1])
            
            # --- FastAPI API Inference ---
            response = client.post("/api/v1/predict", json=patient_features)
            if response.status_code != 200:
                print(f"Error: FastAPI prediction failed for row {idx} with status code {response.status_code}")
                mismatches += 1
                continue
                
            api_prob = response.json()["readmission_probability"]
            
            # --- Compare ---
            diff = abs(direct_prob - api_prob)
            print(f"Row {idx:5d} | Direct Prob: {direct_prob:.8f} | API Prob: {api_prob:.8f} | Diff: {diff:.8e}")
            
            if diff > 1e-7:
                print(f"  WARNING: Mismatch detected for row {idx}! Diff exceeds tolerance.")
                mismatches += 1
                
        if mismatches == 0:
            print("\nSUCCESS: All 10 sample predictions matched perfectly (difference <= 1e-7)!")
            print("MATCH / NO MISMATCHES")
        else:
            print(f"\nFAILURE: Detected {mismatches} mismatches during parity check.")
            sys.exit(1)

if __name__ == '__main__':
    run_parity_check()
