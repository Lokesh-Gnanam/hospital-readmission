import urllib.request
import urllib.error
import json
import psycopg2
import time
import subprocess

BASE_URL = "http://localhost:8000/api/v1"
DB_CONN_STR = "postgresql://postgres:postgrespassword@localhost:5433/hospital_readmissions"

print("==================================================")
print("FINAL HACKATHON FULL-STACK INTEGRATION TEST")
print("==================================================")

# 1. Startup & Endpoint Health Verification
endpoints = [
    ("GET /api/v1/health", f"{BASE_URL}/health"),
    ("GET /api/v1/model/info", f"{BASE_URL}/model/info"),
    ("GET /api/v1/dataset/info", f"{BASE_URL}/dataset/info"),
    ("GET /api/v1/dashboard/summary", f"{BASE_URL}/dashboard/summary"),
    ("GET /api/v1/dashboard/model-performance", f"{BASE_URL}/dashboard/model-performance"),
    ("GET /api/v1/patients", f"{BASE_URL}/patients"),
    ("GET /api/v1/predictions", f"{BASE_URL}/predictions"),
]

for name, url in endpoints:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        print(f"[OK] {name} -> Status {resp.status}")
        assert resp.status == 200

# 2. Patient Creation Flow (Section 3 & 4)
test_patient_payload = {
    "age": "[70-80)",
    "time_in_hospital": 6,
    "n_lab_procedures": 52,
    "n_procedures": 1,
    "n_medications": 18,
    "n_outpatient": 0,
    "n_inpatient": 2,
    "n_emergency": 1,
    "medical_specialty": "InternalMedicine",
    "diag_1": "Circulatory",
    "diag_2": "Diabetes",
    "diag_3": "Other",
    "glucose_test": "no",
    "A1Ctest": "no",
    "change": "no",
    "diabetes_med": "yes"
}

print("\n--- STEP 1 & 2: POST /api/v1/patients ---")
req = urllib.request.Request(
    f"{BASE_URL}/patients",
    data=json.dumps(test_patient_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    status = resp.status
    created_patient = json.loads(resp.read().decode())
    patient_id = created_patient["id"]
    patient_ref = created_patient["patient_reference"]
    print(f"[PASS] Patient created. ID: {patient_id}, Ref: {patient_ref}, Status: {status}")
    assert status in [200, 201]

print("\n--- STEP 6: Direct PostgreSQL Query ---")
conn = psycopg2.connect(DB_CONN_STR)
cur = conn.cursor()
cur.execute("SELECT id, patient_reference, age, time_in_hospital FROM patients WHERE id = %s", (patient_id,))
db_row = cur.fetchone()
print(f"[PASS] PostgreSQL Row Found: {db_row}")
assert db_row is not None
assert db_row[1] == patient_ref
assert db_row[2] == "[70-80)"
assert db_row[3] == 6
conn.close()

print("\n--- STEP 7: GET /api/v1/patients ---")
req = urllib.request.Request(f"{BASE_URL}/patients")
with urllib.request.urlopen(req) as resp:
    all_patients = json.loads(resp.read().decode())
    matching = [p for p in all_patients if p["id"] == patient_id]
    print(f"[PASS] GET /patients returned created patient: {matching[0]['patient_reference']}")
    assert len(matching) == 1

# 3. Prediction & SHAP Storage Flow (Section 8)
print("\n--- STEP 8: POST /api/v1/predict (ML Model + SHAP) ---")
req = urllib.request.Request(
    f"{BASE_URL}/predict",
    data=json.dumps(test_patient_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    status = resp.status
    pred_res = json.loads(resp.read().decode())
    prob = pred_res["readmission_probability"]
    prediction_val = pred_res["prediction"]
    risk_level = pred_res["risk_level"]
    top_features = pred_res["top_contributing_features"]
    print(f"[PASS] Prediction executed: Prob={prob:.4f}, Prediction={prediction_val}, Risk={risk_level}, SHAP Features={len(top_features)}")
    assert status == 200
    assert risk_level in ["HIGH", "MODERATE", "LOW"]
    assert len(top_features) > 0

print("\n--- Direct PostgreSQL Query for Prediction & SHAP Explanations ---")
conn = psycopg2.connect(DB_CONN_STR)
cur = conn.cursor()
cur.execute("SELECT id, patient_id, readmission_probability, prediction, risk_level, threshold FROM predictions ORDER BY id DESC LIMIT 1")
pred_db_row = cur.fetchone()
pred_id = pred_db_row[0]
pred_patient_id = pred_db_row[1]
print(f"[PASS] PostgreSQL Prediction Row: {pred_db_row}")

cur.execute("SELECT COUNT(*) FROM prediction_explanations WHERE prediction_id = %s", (pred_id,))
expl_count = cur.fetchone()[0]
print(f"[PASS] PostgreSQL SHAP Explanations Count for Prediction #{pred_id}: {expl_count}")
assert expl_count > 0
conn.close()

# 4. Error Handling Test (Section 10)
print("\n--- STEP 10: API Error Test (Validation Failure) ---")
bad_payload = {"age": "INVALID_AGE"}
req = urllib.request.Request(
    f"{BASE_URL}/patients",
    data=json.dumps(bad_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as resp:
        pass
except urllib.error.HTTPError as e:
    print(f"[PASS] Validation Failure caught cleanly -> HTTP Status {e.code}")
    assert e.code == 422

# 5. Patient Cascade Delete Test (Section 6 & 11)
print("\n--- STEP 6 & 11: Patient Cascade Delete Test ---")
for pid in [patient_id, pred_patient_id]:
    req = urllib.request.Request(f"{BASE_URL}/patients/{pid}", method="DELETE")
    with urllib.request.urlopen(req) as resp:
        print(f"[PASS] DELETE /patients/{pid} -> Status {resp.status}")
        assert resp.status in [200, 204]

conn = psycopg2.connect(DB_CONN_STR)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM patients WHERE id IN (%s, %s)", (patient_id, pred_patient_id))
p_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM predictions WHERE id = %s", (pred_id,))
pr_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM prediction_explanations WHERE prediction_id = %s", (pred_id,))
ex_count = cur.fetchone()[0]
print(f"[PASS] Remaining Rows in PostgreSQL -> Patients: {p_count}, Predictions: {pr_count}, Explanations: {ex_count}")
assert p_count == 0
assert pr_count == 0
assert ex_count == 0
conn.close()

print("\n==================================================")
print("FINAL HACKATHON VERIFICATION PASSED SUCCESSFULLY!")
print("==================================================")
