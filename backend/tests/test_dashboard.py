def test_dashboard_and_model_metadata_endpoints(client):
    """
    Tests dashboard summary, model-performance, and model/info endpoints.
    """
    # 1. Test model info metadata endpoint
    response_info = client.get("/api/v1/model/info")
    assert response_info.status_code == 200
    info_data = response_info.json()
    assert info_data["model_type"] == "Tuned XGBoost Classifier"
    assert abs(info_data["threshold"] - 0.30) < 1e-5
    assert "best_hyperparameters" in info_data
    assert "cross_validation_metrics" in info_data
    assert "feature_info" in info_data
    assert "model_version" in info_data

    # 2. Test dashboard model performance endpoint
    response_perf = client.get("/api/v1/dashboard/model-performance")
    assert response_perf.status_code == 200
    perf_data = response_perf.json()
    assert "accuracy" in perf_data
    assert "precision" in perf_data
    assert "recall" in perf_data
    assert "f1" in perf_data
    assert "roc_auc" in perf_data
    assert "pr_auc" in perf_data

    # 3. Test empty dashboard summary (prior to predictions)
    response_summary_empty = client.get("/api/v1/dashboard/summary")
    assert response_summary_empty.status_code == 200
    summary_empty = response_summary_empty.json()
    assert summary_empty["total_predictions"] == 0
    assert summary_empty["low_risk_patients"] == 0
    assert summary_empty["moderate_risk_patients"] == 0
    assert summary_empty["high_risk_patients"] == 0
    assert summary_empty["average_probability"] == 0.0
    assert len(summary_empty["recent_predictions"]) == 0

    # 4. Make a prediction to populate dashboard
    patient = {
        "time_in_hospital": 2,
        "n_lab_procedures": 40,
        "n_procedures": 1,
        "n_medications": 14,
        "n_outpatient": 0,
        "n_inpatient": 0,
        "n_emergency": 0,
        "age": "[40-50)",
        "medical_specialty": "InternalMedicine",
        "diag_1": "Diabetes",
        "diag_2": "Diabetes",
        "diag_3": "Other",
        "glucose_test": "no",
        "A1Ctest": "no",
        "change": "no",
        "diabetes_med": "yes"
    }
    client.post("/api/v1/predict", json=patient)

    # 5. Verify dashboard summary has been updated
    response_summary_filled = client.get("/api/v1/dashboard/summary")
    assert response_summary_filled.status_code == 200
    summary_filled = response_summary_filled.json()
    assert summary_filled["total_predictions"] == 1
    assert summary_filled["average_probability"] > 0.0
    assert len(summary_filled["recent_predictions"]) == 1
