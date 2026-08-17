import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_reference = Column(String(50), nullable=False, unique=True, index=True)
    
    # Clinical features expected by ML Pipeline
    time_in_hospital = Column(Integer, nullable=False)
    n_lab_procedures = Column(Integer, nullable=False)
    n_procedures = Column(Integer, nullable=False)
    n_medications = Column(Integer, nullable=False)
    n_outpatient = Column(Integer, nullable=False)
    n_inpatient = Column(Integer, nullable=False)
    n_emergency = Column(Integer, nullable=False)
    
    age = Column(String(20), nullable=False)
    medical_specialty = Column(String(50), nullable=False)
    diag_1 = Column(String(50), nullable=False)
    diag_2 = Column(String(50), nullable=False)
    diag_3 = Column(String(50), nullable=False)
    glucose_test = Column(String(20), nullable=False)
    A1Ctest = Column(String(20), nullable=False)
    change = Column(String(10), nullable=False)
    diabetes_med = Column(String(10), nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Cascade deletes predictions if patient is deleted
    predictions = relationship("Prediction", back_populates="patient", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    readmission_probability = Column(Float, nullable=False)
    prediction = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)
    threshold = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="predictions")
    explanations = relationship("PredictionExplanation", back_populates="prediction", cascade="all, delete-orphan")


class PredictionExplanation(Base):
    __tablename__ = "prediction_explanations"
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    
    feature_name = Column(String(100), nullable=False)
    feature_value = Column(String(100), nullable=True)  # string conversion handles ints, floats, categories
    impact = Column(String(20), nullable=False)          # 'positive' or 'negative'
    importance = Column(Float, nullable=False)           # SHAP value
    
    prediction = relationship("Prediction", back_populates="explanations")

    @property
    def feature(self):
        return self.feature_name

    @property
    def value(self):
        return self.feature_value

