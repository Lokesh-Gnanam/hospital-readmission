import os
import shutil
import pytest
from fastapi.testclient import TestClient

# Locate real CSV path to backup and restore it
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
CSV_PATH = os.path.join(ROOT_DIR, "data", "hospital_readmissions.csv")
BACKUP_PATH = os.path.join(ROOT_DIR, "data", "hospital_readmissions_backup.csv.bak")

@pytest.fixture(scope="module", autouse=True)
def backup_dataset():
    """
    Backups the active dataset before running tests, and restores it afterwards.
    """
    has_backup = False
    if os.path.exists(CSV_PATH):
        shutil.copy(CSV_PATH, BACKUP_PATH)
        has_backup = True
    yield
    if has_backup and os.path.exists(BACKUP_PATH):
        shutil.copy(BACKUP_PATH, CSV_PATH)
        os.remove(BACKUP_PATH)


def test_get_dataset_info(client):
    """
    Verifies that retrieving dataset info returns 200 and valid metadata structure.
    """
    # If the CSV does not exist (e.g. if we are testing deletion first), skip or write one
    if not os.path.exists(CSV_PATH):
        # Create a tiny valid CSV
        with open(CSV_PATH, "w") as f:
            f.write("time_in_hospital,n_lab_procedures,n_procedures,n_medications,n_outpatient,n_inpatient,n_emergency,age,medical_specialty,diag_1,diag_2,diag_3,glucose_test,A1Ctest,change,diabetes_med,readmitted\n")
            f.write("1,1,1,1,1,1,1,[40-50),Other,Other,Other,Other,normal,normal,no,yes,no\n")

    response = client.get("/api/v1/dataset/info")
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "hospital_readmissions.csv"
    assert "rows" in data
    assert "columns" in data
    assert data["target"] == "readmitted"


def test_upload_dataset_invalid_extension(client):
    """
    Verifies that uploading a non-CSV file returns 400.
    """
    files = {"file": ("test.txt", b"some plain text data", "text/plain")}
    response = client.post("/api/v1/dataset/upload", files=files)
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]


def test_upload_dataset_empty(client):
    """
    Verifies that uploading an empty CSV file returns 400.
    """
    files = {"file": ("empty.csv", b"", "text/csv")}
    response = client.post("/api/v1/dataset/upload", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]


def test_upload_dataset_missing_target(client):
    """
    Verifies that uploading a CSV without 'readmitted' column returns 400.
    """
    invalid_csv_content = (
        "time_in_hospital,n_lab_procedures,n_procedures,n_medications,n_outpatient,n_inpatient,n_emergency,"
        "age,medical_specialty,diag_1,diag_2,diag_3,glucose_test,A1Ctest,change,diabetes_med\n"
        "1,1,1,1,1,1,1,[40-50),Other,Other,Other,Other,normal,normal,no,yes\n"
    )
    files = {"file": ("missing_target.csv", invalid_csv_content.encode("utf-8"), "text/csv")}
    response = client.post("/api/v1/dataset/upload", files=files)
    assert response.status_code == 400
    assert "readmitted" in response.json()["detail"]


def test_upload_dataset_missing_features(client):
    """
    Verifies that uploading a CSV missing required feature columns returns 400.
    """
    invalid_csv_content = (
        "time_in_hospital,n_lab_procedures,readmitted\n"
        "1,1,yes\n"
    )
    files = {"file": ("missing_features.csv", invalid_csv_content.encode("utf-8"), "text/csv")}
    response = client.post("/api/v1/dataset/upload", files=files)
    assert response.status_code == 400
    assert "missing required features" in response.json()["detail"].lower()


def test_upload_valid_csv_and_delete(client):
    """
    Verifies uploading a completely valid CSV, getting preview, then deleting it with confirmation.
    """
    valid_csv_content = (
        "time_in_hospital,n_lab_procedures,n_procedures,n_medications,n_outpatient,n_inpatient,n_emergency,"
        "age,medical_specialty,diag_1,diag_2,diag_3,glucose_test,A1Ctest,change,diabetes_med,readmitted\n"
        "4,35,1,12,0,1,0,[50-60),InternalMedicine,Circulatory,Diabetes,Other,no,no,no,yes,yes\n"
    )
    
    # 1. Upload valid CSV
    files = {"file": ("valid_new.csv", valid_csv_content.encode("utf-8"), "text/csv")}
    response = client.post("/api/v1/dataset/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["rows"] == 1
    assert data["columns"] == 17
    assert len(data["preview_rows"]) == 1
    assert data["preview_rows"][0]["medical_specialty"] == "InternalMedicine"

    # 2. Try to delete without confirm query parameter
    response_del_err = client.delete("/api/v1/dataset")
    assert response_del_err.status_code == 400
    assert "Accidental Deletion Blocked" in response_del_err.json()["detail"]

    # 3. Delete with confirm=true
    response_del = client.delete("/api/v1/dataset?confirm=true")
    assert response_del.status_code == 200
    assert response_del.json()["status"] == "success"
    
    # Verify file is deleted on disk
    assert not os.path.exists(CSV_PATH)
