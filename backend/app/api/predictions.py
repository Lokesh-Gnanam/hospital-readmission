import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.patient import PatientInput
from app.schemas.prediction import PredictionResponse, PredictionHistoryResponse
from app.services.patient_service import PatientService
from app.services.prediction_service import PredictionService
from app.services.explanation_service import ExplanationService
from app.db.repositories import PredictionRepository, ExplanationRepository

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
def create_prediction(patient_input: PatientInput, db: Session = Depends(get_db)):
    """
    Accepts clinical patient attributes, executes XGBoost readmission classifier,
    generates SHAP explanation metrics, saves history in the database, and returns the prediction payload.
    """
    # 1. Store de-identified patient record in database
    try:
        db_patient = PatientService.create_patient(db, patient_input)
    except Exception as e:
        logger.error(f"Failed to create patient record: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error during patient creation: {e}"
        )
        
    # 2. Compute prediction probability and risk category
    try:
        pred_res = PredictionService.predict(patient_input)
    except Exception as e:
        logger.error(f"Inference execution failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Model prediction execution failed: {e}"
        )
        
    # 3. Calculate SHAP attributions using prediction DataFrame
    try:
        explanations = ExplanationService.explain_patient(pred_res["df_patient"])
    except Exception as e:
        logger.warning(f"SHAP explanation calculation failed: {e}. Falling back to empty explanations.")
        explanations = []
        
    # 4. Save prediction instance in database
    try:
        db_pred_data = {
            "patient_id": db_patient.id,
            "readmission_probability": pred_res["readmission_probability"],
            "prediction": pred_res["prediction"],
            "risk_level": pred_res["risk_level"],
            "threshold": pred_res["threshold"],
            "model_version": pred_res["model_version"]
        }
        db_prediction = PredictionRepository.create(db, db_pred_data)
    except Exception as e:
        logger.error(f"Failed to save prediction record: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error during prediction record creation: {e}"
        )
        
    # 5. Save SHAP explanation drivers in database for auditing
    if explanations:
        try:
            db_exp_data = []
            for item in explanations:
                db_exp_data.append({
                    "prediction_id": db_prediction.id,
                    "feature_name": item["feature"],
                    "feature_value": str(item["value"]) if item["value"] is not None else "",
                    "impact": item["impact"],
                    "importance": item["importance"]
                })
            ExplanationRepository.create_bulk(db, db_exp_data)
        except Exception as e:
            logger.error(f"Failed to save prediction explanations: {e}. Continuing transaction.")
            # Do not raise exception here, as prediction has already run and been saved successfully.
            pass
            
    # 6. Return response matching PredictionResponse schema
    return PredictionResponse(
        prediction=pred_res["prediction"],
        readmission_probability=pred_res["readmission_probability"],
        risk_level=pred_res["risk_level"],
        threshold=pred_res["threshold"],
        top_contributing_features=explanations,
        model_version=pred_res["model_version"],
        disclaimer=pred_res["disclaimer"]
    )


@router.get("/predictions", response_model=list[PredictionHistoryResponse])
def get_predictions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieves prediction history with offset pagination.
    """
    return PredictionRepository.list_all(db, skip, limit)


@router.get("/predictions/{id}", response_model=PredictionHistoryResponse)
def get_prediction_by_id(id: int, db: Session = Depends(get_db)):
    """
    Retrieves a specific prediction run details.
    """
    db_pred = PredictionRepository.get_by_id(db, id)
    if not db_pred:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction record not found for database ID: {id}"
        )
    return db_pred


@router.delete("/predictions/{id}")
def delete_prediction_record(id: int, db: Session = Depends(get_db)):
    """
    Deletes a prediction run and its explanations from PostgreSQL.
    """
    success = PredictionRepository.delete(db, id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction record not found for database ID: {id}"
        )
    return {"status": "success", "message": f"Successfully deleted prediction ID: {id}"}
