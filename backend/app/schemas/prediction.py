from pydantic import BaseModel, Field
from typing import Literal, List, Any
from datetime import datetime

class FeatureExplanation(BaseModel):
    feature: str = Field(..., description="Descriptive feature name")
    value: Any = Field(..., description="The value of this feature for the patient")
    impact: Literal['positive', 'negative'] = Field(..., description="Direction of contribution")
    importance: float = Field(..., description="SHAP attribution value (log-odds impact)")

    model_config = {
        "from_attributes": True
    }

class PredictionResponse(BaseModel):
    prediction: int = Field(..., description="Binary prediction output (0 -> No Readmit, 1 -> Readmit)")
    readmission_probability: float = Field(..., description="Calculated probability of 30-day readmission")
    risk_level: Literal['LOW', 'MODERATE', 'HIGH'] = Field(..., description="Risk category based on probability thresholds")
    threshold: float = Field(..., description="Decision boundary threshold")
    top_contributing_features: List[FeatureExplanation] = Field(..., description="SHAP explanations of most important features")
    model_version: str = Field(..., description="Version of the model used")
    disclaimer: str = Field(..., description="Standard prototype disclaimer")

class PredictionHistoryResponse(BaseModel):
    id: int
    patient_id: int
    readmission_probability: float
    prediction: int
    risk_level: str
    threshold: float
    model_version: str
    created_at: datetime
    explanations: List[FeatureExplanation] = []

    model_config = {
        "from_attributes": True
    }
