from sqlalchemy.orm import Session
from app.db.models import Patient, Prediction, PredictionExplanation

class PatientRepository:
    @staticmethod
    def create(db: Session, patient_data: dict) -> Patient:
        """
        Inserts a new patient record.
        """
        db_patient = Patient(**patient_data)
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        return db_patient

    @staticmethod
    def get_by_id(db: Session, patient_id: int) -> Patient:
        """
        Retrieves a patient by primary key.
        """
        return db.query(Patient).filter(Patient.id == patient_id).first()

    @staticmethod
    def get_by_reference(db: Session, reference: str) -> Patient:
        """
        Retrieves a patient by unique patient_reference.
        """
        return db.query(Patient).filter(Patient.patient_reference == reference).first()

    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 100) -> list:
        """
        Lists all patient records with pagination.
        """
        return db.query(Patient).offset(skip).limit(limit).all()

    @staticmethod
    def delete(db: Session, patient_id: int) -> bool:
        """
        Deletes a patient record by database ID.
        """
        db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if db_patient:
            db.delete(db_patient)
            db.commit()
            return True
        return False


class PredictionRepository:
    @staticmethod
    def create(db: Session, prediction_data: dict) -> Prediction:
        """
        Saves a prediction run.
        """
        db_prediction = Prediction(**prediction_data)
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        return db_prediction

    @staticmethod
    def get_by_id(db: Session, prediction_id: int) -> Prediction:
        """
        Retrieves a specific prediction by primary key.
        """
        return db.query(Prediction).filter(Prediction.id == prediction_id).first()

    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 100) -> list:
        """
        Lists all prediction history ordered by newest.
        """
        return db.query(Prediction).order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_patient_id(db: Session, patient_id: int) -> list:
        """
        Retrieves prediction history for a specific patient.
        """
        return db.query(Prediction).filter(Prediction.patient_id == patient_id).order_by(Prediction.created_at.desc()).all()

    @staticmethod
    def delete(db: Session, prediction_id: int) -> bool:
        """
        Deletes a prediction record by database ID.
        """
        db_prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
        if db_prediction:
            db.delete(db_prediction)
            db.commit()
            return True
        return False


class ExplanationRepository:
    @staticmethod
    def create_bulk(db: Session, explanations_data: list) -> list:
        """
        Inserts a list of SHAP factor attributions for a prediction in bulk.
        """
        db_explanations = [PredictionExplanation(**item) for item in explanations_data]
        db.add_all(db_explanations)
        db.commit()
        return db_explanations
