import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_missing_required_fields(client):
    """
    Test that sending empty or partially complete JSON fails with HTTP 422.
    """
    payload = {
        "time_in_hospital": 5,
        "n_lab_procedures": 45
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    
    details = response.json()
    assert "detail" in details

def test_invalid_categorical_literal(client):
    """
    Test that sending a value outside of the constrained categorical Literals fails with HTTP 422.
    """
    payload = {
        "time_in_hospital": 6,
        "n_lab_procedures": 45,
        "n_procedures": 1,
        "n_medications": 18,
        "n_outpatient": 0,
        "n_inpatient": 2,
        "n_emergency": 1,
        "age": "85-years-old",  # Invalid age category
        "medical_specialty": "InternalMedicine",
        "diag_1": "Circulatory",
        "diag_2": "Diabetes",
        "diag_3": "Other",
        "glucose_test": "no",
        "A1Ctest": "no",
        "change": "no",
        "diabetes_med": "yes"
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    
    # Confirm it highlights the invalid age field
    details = response.json()
    assert "age" in str(details["detail"])

def test_numerical_out_of_bounds(client):
    """
    Test that sending numerical counts outside of standard bounds (e.g. time_in_hospital > 14) fails with HTTP 422.
    """
    payload = {
        "time_in_hospital": 15,  # Upper bound is 14
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
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    
    # Confirm it highlights time_in_hospital range check violation
    details = response.json()
    assert "time_in_hospital" in str(details["detail"])
