def test_predict_endpoint_success(client):
    """
    Verifies that predicting with a valid patient payload returns a 200 OK
    containing the probability, decision threshold, risk level, and SHAP features list.
    """
    valid_patient = {
        "time_in_hospital": 5,
        "n_lab_procedures": 40,
        "n_procedures": 2,
        "n_medications": 15,
        "n_outpatient": 0,
        "n_inpatient": 2,
        "n_emergency": 0,
        "age": "[60-70)",
        "medical_specialty": "InternalMedicine",
        "diag_1": "Circulatory",
        "diag_2": "Diabetes",
        "diag_3": "Other",
        "glucose_test": "no",
        "A1Ctest": "no",
        "change": "no",
        "diabetes_med": "yes"
    }
    
    response = client.post("/api/v1/predict", json=valid_patient)
    assert response.status_code == 200
    
    data = response.json()
    assert "prediction" in data
    assert "readmission_probability" in data
    assert "risk_level" in data
    assert "threshold" in data
    assert abs(data["threshold"] - 0.30) < 1e-5
    assert "top_contributing_features" in data
    assert "disclaimer" in data
    
    # Assert threshold logic holds
    prob = data["readmission_probability"]
    pred = data["prediction"]
    if prob >= 0.30:
        assert pred == 1
        assert data["risk_level"] == "HIGH"
    else:
        assert pred == 0
        assert data["risk_level"] in ["LOW", "MODERATE"]

    # Verify SHAP attributions are formatted properly
    features = data["top_contributing_features"]
    assert len(features) <= 5
    for item in features:
        assert "feature" in item
        assert "value" in item
        assert item["impact"] in ["positive", "negative"]
        assert "importance" in item


def test_prediction_database_persistence(client):
    """
    Verifies that executing a prediction creates Patient and Prediction rows
    in the database.
    """
    valid_patient = {
        "time_in_hospital": 3,
        "n_lab_procedures": 50,
        "n_procedures": 0,
        "n_medications": 10,
        "n_outpatient": 1,
        "n_inpatient": 0,
        "n_emergency": 0,
        "age": "[50-60)",
        "medical_specialty": "Emergency/Trauma",
        "diag_1": "Respiratory",
        "diag_2": "Diabetes",
        "diag_3": "Other",
        "glucose_test": "no",
        "A1Ctest": "no",
        "change": "yes",
        "diabetes_med": "yes"
    }
    
    # 1. Run prediction
    res_pred = client.post("/api/v1/predict", json=valid_patient)
    assert res_pred.status_code == 200
    
    # 2. Check patients list - should have 1 patient
    res_patients = client.get("/api/v1/patients")
    assert res_patients.status_code == 200
    patients_list = res_patients.json()
    assert len(patients_list) == 1
    assert patients_list[0]["time_in_hospital"] == 3
    assert "patient_reference" in patients_list[0]
    
    # 3. Check dashboard summary - should have 1 prediction
    res_dash = client.get("/api/v1/dashboard/summary")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["total_predictions"] == 1
    assert len(dash_data["recent_predictions"]) == 1
    assert dash_data["recent_predictions"][0]["patient_reference"] == patients_list[0]["patient_reference"]
