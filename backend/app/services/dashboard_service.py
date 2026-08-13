import logging
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.models import Prediction, Patient
from app.ml.model_loader import ModelLoader

logger = logging.getLogger(__name__)

class DashboardService:
    @staticmethod
    def get_summary(db: Session) -> dict:
        """
        Computes dashboard statistics from the database predictions history.
        """
        # Calculate counts and average probability
        total_preds = db.query(func.count(Prediction.id)).scalar() or 0
        
        low_count = db.query(func.count(Prediction.id)).filter(Prediction.risk_level == "LOW").scalar() or 0
        mod_count = db.query(func.count(Prediction.id)).filter(Prediction.risk_level == "MODERATE").scalar() or 0
        high_count = db.query(func.count(Prediction.id)).filter(Prediction.risk_level == "HIGH").scalar() or 0
        
        avg_prob = db.query(func.avg(Prediction.readmission_probability)).scalar() or 0.0
        
        # Retrieve recent 5 predictions joined with patient references
        recent_query = (
            db.query(Prediction, Patient.patient_reference)
            .join(Patient, Prediction.patient_id == Patient.id)
            .order_by(Prediction.created_at.desc())
            .limit(5)
            .all()
        )
        
        recent_list = []
        for pred, ref in recent_query:
            recent_list.append({
                "id": pred.id,
                "patient_id": pred.patient_id,
                "patient_reference": ref,
                "readmission_probability": pred.readmission_probability,
                "prediction": pred.prediction,
                "risk_level": pred.risk_level,
                "created_at": pred.created_at
            })
            
        logger.info(f"Dashboard summary requested. Total: {total_preds}, High Risk: {high_count}")
        
        return {
            "total_predictions": total_preds,
            "low_risk_patients": low_count,
            "moderate_risk_patients": mod_count,
            "high_risk_patients": high_count,
            "average_probability": float(avg_prob),
            "recent_predictions": recent_list
        }

    @staticmethod
    def get_model_performance() -> dict:
        """
        Retrieves training cross-validation metrics directly from metadata.
        """
        metadata = ModelLoader.get_metadata()
        cv_metrics = metadata.get("cross_validation_metrics", {})
        
        return {
            "accuracy": cv_metrics.get("mean_accuracy", 0.0),
            "precision": cv_metrics.get("mean_precision", 0.0),
            "recall": cv_metrics.get("mean_recall", 0.0),
            "f1": cv_metrics.get("mean_f1", 0.0),
            "roc_auc": cv_metrics.get("mean_roc_auc", 0.0),
            "pr_auc": cv_metrics.get("mean_pr_auc", 0.0)
        }
