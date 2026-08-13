import uuid
import logging
from sqlalchemy.orm import Session
from app.db.models import Patient
from app.db.repositories import PatientRepository
from app.schemas.patient import PatientInput, PatientResponse

logger = logging.getLogger(__name__)

class PatientService:
    @staticmethod
    def create_patient(db: Session, patient_input: PatientInput) -> Patient:
        """
        Creates a new patient record, auto-generating a unique anonymized reference ID.
        """
        patient_data = patient_input.model_dump()
        
        # Generate random unique patient reference (PII protection)
        ref_id = f"PT-{uuid.uuid4().hex[:8].upper()}"
        patient_data["patient_reference"] = ref_id
        
        db_patient = PatientRepository.create(db, patient_data)
        logger.info(f"Successfully created patient record with reference: {ref_id}")
        return db_patient

    @staticmethod
    def get_patient_by_id(db: Session, patient_id: int) -> Patient:
        """
        Retrieves a patient by primary key.
        """
        return PatientRepository.get_by_id(db, patient_id)

    @staticmethod
    def get_patient_by_reference(db: Session, reference: str) -> Patient:
        """
        Retrieves a patient by reference string.
        """
        return PatientRepository.get_by_reference(db, reference)

    @staticmethod
    def list_patients(db: Session, skip: int = 0, limit: int = 100) -> list:
        """
        Retrieves paginated list of patients.
        """
        return PatientRepository.list_all(db, skip, limit)
