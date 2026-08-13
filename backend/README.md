# Hospital 30-Day Readmission Prediction API

This is the FastAPI backend service for the Hospital 30-Day Readmission Prediction system. It serves inference requests by executing patient features through the serialized XGBoost classifier pipeline, applying the 0.30 decision boundary threshold, categorizing the patient's readmission risk level, and computing SHAP explanation attributions.

## Backend Structure

```text
backend/
├── app/
│   ├── main.py                         # Application configuration (Lifespan, CORS, Error Handlers)
│   ├── schemas.py                      # Pydantic schemas (Input validation & API output structures)
│   ├── dependencies.py                 # Dependency injections
│   │
│   ├── services/
│   │   ├── model_service.py            # Singleton model loader
│   │   ├── prediction_service.py       # Inference prediction wrapper
│   │   └── explanation_service.py      # Patient SHAP explanation generator
│   │
│   └── api/
│       ├── routes_health.py            # health status check (GET /api/v1/health)
│       ├── routes_prediction.py        # Predict readmission (POST /api/v1/predict)
│       └── routes_model.py             # Model metadata info (GET /api/v1/model/info)
│
├── tests/
│   ├── test_health.py                  # Pytest cases for health verification and singleton loading
│   ├── test_prediction.py              # Pytest cases for prediction boundaries and threshold consistency
│   ├── test_validation.py              # Pytest cases verifying 422 errors for out-of-bounds fields
│   └── verify_parity.py                # Script validating 100% exact parity between Python and API predictions
│
├── requirements.txt                    # Project package dependencies
└── README.md                           # Documentation
```

## Setup & Running Locally

### 1. Install Dependencies
Run the command inside the `backend/` directory:
```bash
pip install -r requirements.txt
```

### 2. Run the Server
Start the Uvicorn local server:
```bash
uvicorn app.main:app --reload
```
Once started, the API will be available at `http://localhost:8000`.
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`
* ReDoc Documentation: `http://localhost:8000/redoc`

---

## Running Tests

### 1. Execute Automated Tests (Pytest)
Run from the `backend/` directory:
```bash
python -m pytest
```

### 2. Run Parity Verification Check
Verifies that direct Python models and API predictions are mathematically identical:
```bash
python tests/verify_parity.py
```

---

## cURL Prediction Example

You can test the prediction endpoint directly using `curl`:

```bash
curl -X POST \
  http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "time_in_hospital": 6,
    "n_lab_procedures": 45,
    "n_procedures": 1,
    "n_medications": 18,
    "n_outpatient": 0,
    "n_inpatient": 2,
    "n_emergency": 1,
    "age": "[70-80)",
    "medical_specialty": "InternalMedicine",
    "diag_1": "Circulatory",
    "diag_2": "Diabetes",
    "diag_3": "Other",
    "glucose_test": "no",
    "A1Ctest": "no",
    "change": "no",
    "diabetes_med": "yes"
  }'
```

---

## Disclaimer
This inference service is a research/hackathon prototype. Predictions and risk labels are decision-support outputs and are **not clinically validated** nor constitute a medical diagnosis.
