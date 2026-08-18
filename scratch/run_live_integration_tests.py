import urllib.request
import urllib.error
import json
import psycopg2

BASE_URL = "http://localhost:8000/api/v1"
DB_CONN_STR = "postgresql://postgres:postgrespassword@localhost:5433/hospital_readmissions"

print("==================================================")
print("RUNNING LIVE FULL-STACK INTEGRATION SUITE")
print("==================================================")

# 1. Health check
req = urllib.request.Request(f"{BASE_URL}/health")
with urllib.request.urlopen(req) as resp:
    status = resp.status
    data = json.loads(resp.read().decode())
    cors_hdr = resp.headers.get("Access-Control-Allow-Origin")
    print(f"[1/10] GET /health: Status {status}, Body: {data}, CORS Header: {cors_hdr}")
    assert status == 200
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert data["model_loaded"] is True

# 2. Model info check
req = urllib.request.Request(f"{BASE_URL}/model/info")
with urllib.request.urlopen(req) as resp:
    status = resp.status
    data = json.loads(resp.read().decode())
    print(f"[2/10] GET /model/info: Status {status}, Model Version: {data.get('model_version')}, Operating Threshold: {data.get('threshold')}")
    assert status == 200
    assert data["model_version"] == "1.0.0"
    assert abs(data["threshold"] - 0.30) < 1e-4

# 3. Dataset info check
req = urllib.request.Request(f"{BASE_URL}/dataset/info")
with urllib.request.urlopen(req) as resp:
    status = resp.status
    data = json.loads(resp.read().decode())
    print(f"[3/10] GET /dataset/info: Status {status}, Rows: {data.get('rows')}, Details: {list(data.keys())}")
    assert status == 200

# 4. Dashboard Summary & Performance
req = urllib.request.Request(f"{BASE_URL}/dashboard/summary")
with urllib.request.urlopen(req) as resp:
    status = resp.status
    data = json.loads(resp.read().decode())
    print(f"[4/10] GET /dashboard/summary: Status {status}, Details: {data}")
    assert status == 200

req = urllib.request.Request(f"{BASE_URL}/dashboard/model-performance")
with urllib.request.urlopen(req) as resp:
    status = resp.status
    data = json.loads(resp.read().decode())
    print(f"[4b/10] GET /dashboard/model-performance: Status {status}, Details: {list(data.keys())}")
    assert status == 200

# 5. Patient Creation End-to-End Test
patient_payload = {
    "age": "[60-70)",
    "time_in_hospital": 4,
    "n_lab_procedures": 45,
    "n_procedures": 2,
    "n_medications": 12,
    "n_outpatient": 0,
    "n_inpatient": 1,
    "n_emergency": 0,
    "medical_specialty": "InternalMedicine",
    "diag_1": "Circulatory",
    "diag_2": "Diabetes",
    "diag_3": "Other",
    "glucose_test": "no",
    "A1Ctest": "no",
    "change": "no",
    "diabetes_med": "yes"
}

req = urllib.request.Request(
    f"{BASE_URL}/patients",
    data=json.dumps(patient_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    status = resp.status
    created_patient = json.loads(resp.read().decode())
    patient_id = created_patient["id"]
    patient_ref = created_patient["patient_reference"]
    print(f"[5/10] POST /patients: Status {status}, Created Patient ID: {patient_id}, Ref: {patient_ref}")
    assert status == 201 or status == 200
    assert patient_ref.startswith("PT-")

# Verify directly in PostgreSQL DB
conn = psycopg2.connect(DB_CONN_STR)
cur = conn.cursor()
cur.execute("SELECT id, patient_reference, age FROM patients WHERE id = %s", (patient_id,))
row = cur.fetchone()
print(f"       DB Query Check -> Patient Row in PostgreSQL: {row}")
assert row is not None
assert row[1] == patient_ref
conn.close()

# 6. Prediction End-to-End Test (ML Model + SHAP + DB Persistence)
req = urllib.request.Request(
    f"{BASE_URL}/predict",
    data=json.dumps(patient_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    status = resp.status
    pred_res = json.loads(resp.read().decode())
    prob = pred_res["readmission_probability"]
    prediction_val = pred_res["prediction"]
    risk_level = pred_res["risk_level"]
    top_features = pred_res["top_contributing_features"]
    print(f"[6/10] POST /predict: Status {status}, Prob: {prob:.4f}, Prediction: {prediction_val}, Risk: {risk_level}, SHAP Features Count: {len(top_features)}")
    assert status == 200
    assert "readmission_probability" in pred_res
    assert risk_level in ["HIGH", "MODERATE", "LOW"]
    assert len(top_features) > 0

# Verify Prediction & Explanations directly in PostgreSQL DB
conn = psycopg2.connect(DB_CONN_STR)
cur = conn.cursor()
cur.execute("SELECT id, patient_id, readmission_probability, prediction, risk_level, threshold FROM predictions ORDER BY id DESC LIMIT 1")
pred_db_row = cur.fetchone()
pred_id = pred_db_row[0]
pred_patient_id = pred_db_row[1]
print(f"       DB Query Check -> Latest Prediction Row in PostgreSQL: {pred_db_row}")
assert pred_db_row is not None

cur.execute("SELECT COUNT(*) FROM prediction_explanations WHERE prediction_id = %s", (pred_id,))
expl_count = cur.fetchone()[0]
print(f"       DB Query Check -> Explanations Count in PostgreSQL for Prediction #{pred_id}: {expl_count}")
assert expl_count > 0
conn.close()

# 7. Get Patients & Predictions Lists
req = urllib.request.Request(f"{BASE_URL}/patients")
with urllib.request.urlopen(req) as resp:
    patients_list = json.loads(resp.read().decode())
    print(f"[7/10] GET /patients: Returned {len(patients_list)} patients.")
    assert len(patients_list) > 0

req = urllib.request.Request(f"{BASE_URL}/predictions")
with urllib.request.urlopen(req) as resp:
    preds_list = json.loads(resp.read().decode())
    print(f"[7b/10] GET /predictions: Returned {len(preds_list)} predictions.")
    assert len(preds_list) > 0

# 8. Error Handling Verification (Validation Failure)
bad_payload = {"patient_reference": "BAD-PATIENT", "age": "INVALID_AGE_RANGE"}
req = urllib.request.Request(
    f"{BASE_URL}/patients",
    data=json.dumps(bad_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as resp:
        pass
except urllib.error.HTTPError as e:
    print(f"[8/10] Validation Failure Test: Received Expected Status {e.code}")
    assert e.code == 422

# 9. Patient Cascade Delete Test
# Delete created patient and the prediction patient
for pid in [patient_id, pred_patient_id]:
    req = urllib.request.Request(f"{BASE_URL}/patients/{pid}", method="DELETE")
    with urllib.request.urlopen(req) as resp:
        del_status = resp.status
        print(f"[9/10] DELETE /patients/{pid}: Status {del_status}")
        assert del_status in [200, 204]

# Verify Cascade Deletion in PostgreSQL
conn = psycopg2.connect(DB_CONN_STR)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM patients WHERE id IN (%s, %s)", (patient_id, pred_patient_id))
p_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM predictions WHERE id = %s", (pred_id,))
pr_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM prediction_explanations WHERE prediction_id = %s", (pred_id,))
ex_count = cur.fetchone()[0]
print(f"       DB Query Check -> Remaining Patient Rows: {p_count}, Prediction Rows: {pr_count}, Explanations Count: {ex_count}")
assert p_count == 0
assert pr_count == 0
assert ex_count == 0
conn.close()

# 10. Frontend Static File & Proxy Verification
req = urllib.request.Request("http://localhost:80/")
with urllib.request.urlopen(req) as resp:
    fe_status = resp.status
    fe_html = resp.read().decode()
    print(f"[10/10] GET http://localhost:80/ (Frontend Container Nginx): Status {fe_status}, Root element present: {'<div id=\"root\">' in fe_html or 'Hospital' in fe_html}")
    assert fe_status == 200

print("==================================================")
print("ALL LIVE SUITE TESTS PASSED PERFECTLY!")
print("==================================================")
