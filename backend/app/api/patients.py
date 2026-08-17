from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.patient import PatientInput, PatientResponse
from app.services.patient_service import PatientService

router = APIRouter()

@router.get("/patients", response_model=list[PatientResponse])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieves a list of de-identified patient records with offset pagination.
    """
    return PatientService.list_patients(db, skip, limit)


@router.get("/patients/{id}", response_model=PatientResponse)
def get_patient_by_id(id: int, db: Session = Depends(get_db)):
    """
    Retrieves a specific patient record by primary database ID.
    """
    db_patient = PatientService.get_patient_by_id(db, id)
    if not db_patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient record not found for database ID: {id}"
        )
    return db_patient


@router.post("/patients", response_model=PatientResponse)
def create_patient_record(patient_input: PatientInput, db: Session = Depends(get_db)):
    """
    Registers a new de-identified patient in the system without performing predictions.
    """
    return PatientService.create_patient(db, patient_input)


@router.delete("/patients/{id}")
def delete_patient_record(id: int, db: Session = Depends(get_db)):
    """
    Removes a patient record and its predictions from PostgreSQL.
    """
    success = PatientService.delete_patient(db, id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Patient record not found for database ID: {id}"
        )
    return {"status": "success", "message": f"Successfully deleted patient ID: {id}"}
