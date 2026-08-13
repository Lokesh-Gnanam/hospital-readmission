from fastapi import APIRouter
from app.schemas.common import ModelInfoResponse
from app.ml.model_loader import ModelLoader

router = APIRouter()

@router.get("/model/info", response_model=ModelInfoResponse)
def get_model_info():
    """
    Exposes model metadata, hyperparameters, training CV metrics, and target features.
    """
    metadata = ModelLoader.get_metadata()
    
    return ModelInfoResponse(
        model_type="Tuned XGBoost Classifier",
        threshold=ModelLoader.get_threshold(),
        best_hyperparameters=metadata.get("best_hyperparameters", {}),
        cross_validation_metrics=metadata.get("cross_validation_metrics", {}),
        feature_info=metadata.get("feature_info", {}),
        model_version=ModelLoader.get_version()
    )
