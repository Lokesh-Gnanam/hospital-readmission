from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

class PatientInput(BaseModel):
    time_in_hospital: int = Field(..., description="Length of stay in days", ge=1, le=14)
    n_lab_procedures: int = Field(..., description="Number of lab tests performed", ge=1, le=113)
    n_procedures: int = Field(..., description="Number of other procedures performed", ge=0, le=6)
    n_medications: int = Field(..., description="Number of distinct generic medications administered", ge=1, le=79)
    n_outpatient: int = Field(..., description="Number of outpatient visits in the prior year", ge=0, le=33)
    n_inpatient: int = Field(..., description="Number of inpatient visits in the prior year", ge=0, le=15)
    n_emergency: int = Field(..., description="Number of emergency visits in the prior year", ge=0, le=64)
    
    age: Literal['[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)'] = Field(..., description="Patient age bin")
    medical_specialty: Literal['Cardiology', 'Emergency/Trauma', 'Family/GeneralPractice', 'InternalMedicine', 'Missing', 'Other', 'Surgery'] = Field(..., description="Specialty of the admitting physician")
    diag_1: Literal['Circulatory', 'Diabetes', 'Digestive', 'Injury', 'Missing', 'Musculoskeletal', 'Other', 'Respiratory'] = Field(..., description="Primary diagnosis category")
    diag_2: Literal['Circulatory', 'Diabetes', 'Digestive', 'Injury', 'Missing', 'Musculoskeletal', 'Other', 'Respiratory'] = Field(..., description="Secondary diagnosis category")
    diag_3: Literal['Circulatory', 'Diabetes', 'Digestive', 'Injury', 'Missing', 'Musculoskeletal', 'Other', 'Respiratory'] = Field(..., description="Tertiary diagnosis category")
    glucose_test: Literal['no', 'normal', 'high'] = Field(..., description="Glucose test result status")
    A1Ctest: Literal['no', 'normal', 'high'] = Field(..., description="A1C test result status")
    change: Literal['no', 'yes'] = Field(..., description="Change in diabetic medication status")
    diabetes_med: Literal['no', 'yes'] = Field(..., description="Diabetic medication prescribed status")

    model_config = {
        "json_schema_extra": {
            "example": {
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
            }
        }
    }

class PatientResponse(PatientInput):
    id: int = Field(..., description="Database primary key")
    patient_reference: str = Field(..., description="Unique anonymized patient reference identifier")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record modification timestamp")

    model_config = {
        "from_attributes": True
    }
