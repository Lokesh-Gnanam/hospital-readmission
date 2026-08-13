from pydantic import BaseModel, Field
from typing import Dict, List, Any
from datetime import datetime

class HealthResponse(BaseModel):
    status: str = Field(..., description="Application health status")
    model_loaded: bool = Field(..., description="ML Model availability status")
    database_connected: bool = Field(..., description="PostgreSQL/database availability status")

class ModelInfoResponse(BaseModel):
    model_type: str = Field(..., description="Name of the model classifier")
    threshold: float = Field(..., description="Operating threshold")
    best_hyperparameters: Dict[str, Any] = Field(..., description="Hyperparameters of the classifier")
    cross_validation_metrics: Dict[str, float] = Field(..., description="CV metrics recorded during training")
    feature_info: Dict[str, List[str]] = Field(..., description="Numerical and categorical feature names")
    model_version: str = Field(..., description="Version identifier")

class DashboardSummaryResponse(BaseModel):
    total_predictions: int = Field(..., description="Aggregate prediction count")
    high_risk_patients: int = Field(..., description="Count of patients flagged as high risk")
    moderate_risk_patients: int = Field(..., description="Count of patients flagged as moderate risk")
    low_risk_patients: int = Field(..., description="Count of patients flagged as low risk")
    average_probability: float = Field(..., description="Average prediction probability across all records")
    recent_predictions: List[Dict[str, Any]] = Field(..., description="Newest predictions list")
