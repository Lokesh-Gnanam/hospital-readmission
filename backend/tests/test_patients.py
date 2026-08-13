def test_patients_crud_endpoints(client):
    """
    Tests creating, listing, and retrieving patient records by ID.
    """
    valid_patient = {
        "time_in_hospital": 4,
        "n_lab_procedures": 35,
        "n_procedures": 1,
        "n_medications": 12,
        "n_outpatient": 0,
        "n_inpatient": 1,
        "n_emergency": 0,
        "age": "[50-60)",
        "medical_specialty": "InternalMedicine",
        "diag_1": "Circulatory",
        "diag_2": "Diabetes",
        "diag_3": "Other",
        "glucose_test": "no",
        "A1Ctest": "no",
        "change": "no",
        "diabetes_med": "yes"
    }

    # 1. Post to create patient
    response_post = client.post("/api/v1/patients", json=valid_patient)
    assert response_post.status_code == 200
    post_data = response_post.json()
    assert "id" in post_data
    assert "patient_reference" in post_data
    assert post_data["time_in_hospital"] == 4
    
    patient_id = post_data["id"]

    # 2. Get details by ID
    response_get = client.get(f"/api/v1/patients/{patient_id}")
    assert response_get.status_code == 200
    get_data = response_get.json()
    assert get_data["id"] == patient_id
    assert get_data["patient_reference"] == post_data["patient_reference"]
    assert get_data["time_in_hospital"] == 4

    # 3. List all patients - should contain the created patient
    response_list = client.get("/api/v1/patients")
    assert response_list.status_code == 200
    list_data = response_list.json()
    assert len(list_data) == 1
    assert list_data[0]["id"] == patient_id
