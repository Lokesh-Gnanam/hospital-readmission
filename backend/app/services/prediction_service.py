import pandas as pd
import logging
from app.schemas.patient import PatientInput
from app.ml.model_loader import ModelLoader

logger = logging.getLogger(__name__)

class PredictionService:
    @staticmethod
    def predict(patient: PatientInput) -> dict:
        """
        Receives validated patient Pydantic input, performs prediction, and classifies risk.
        Returns a dictionary containing metrics, probabilities, and the patient DataFrame.
        """
        model = ModelLoader.get_model()
        threshold = ModelLoader.get_threshold()
        model_version = ModelLoader.get_version()
        
        # 1. Convert Pydantic object to Pandas DataFrame matching raw feature order
        patient_dict = patient.model_dump()
        df_patient = pd.DataFrame([patient_dict])
        
        # 2. Run prediction probability directly through the pipeline
        try:
            probs = model.predict_proba(df_patient)
            prob = float(probs[0, 1])
        except Exception as e:
            logger.error(f"Error during ML pipeline inference: {e}")
            raise RuntimeError(f"Model prediction failed: {e}")
            
        # 3. Apply decision threshold of 0.30
        prediction = 1 if prob >= threshold else 0
        
        # 4. Categorize patient risk level (low, moderate, high)
        if prob < 0.2:
            risk_level = "LOW"
        elif prob < 0.3:
            risk_level = "MODERATE"
        else:
            risk_level = "HIGH"
            
        disclaimer = (
            "These risk labels and probabilities are research prototype decision-support categories "
            "and are not clinically validated. They do not constitute a medical diagnosis. "
            "A 'HIGH' risk indicates that the model predicts an elevated likelihood of 30-day readmission."
        )
        
        logger.info(f"Prediction successful. Prob: {prob:.4f}, Prediction: {prediction}, Risk: {risk_level}")
        
        return {
            "prediction": prediction,
            "readmission_probability": prob,
            "risk_level": risk_level,
            "threshold": threshold,
            "model_version": model_version,
            "disclaimer": disclaimer,
            "df_patient": df_patient  # Returned to allow explanation service reuse
        }
