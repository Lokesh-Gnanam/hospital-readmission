import logging
import pandas as pd
import numpy as np
import shap
from app.ml.model_loader import ModelLoader
from preprocessing import NUMERICAL_COLS, CATEGORICAL_COLS

logger = logging.getLogger(__name__)

# Human-friendly descriptions mapping
HUMAN_FEATURE_NAMES = {
    'time_in_hospital': 'Length of hospital stay',
    'n_lab_procedures': 'Number of lab procedures performed',
    'n_procedures': 'Number of other procedures performed',
    'n_medications': 'Medication complexity (count)',
    'n_outpatient': 'Previous outpatient visits (prior year)',
    'n_inpatient': 'Previous inpatient admissions (prior year)',
    'n_emergency': 'Previous emergency visits (prior year)',
    'age': 'Patient age group',
    'medical_specialty': 'Admitting medical specialty',
    'diag_1': 'Primary diagnosis category',
    'diag_2': 'Secondary diagnosis category',
    'diag_3': 'Tertiary diagnosis category',
    'glucose_test': 'Glucose test status',
    'A1Ctest': 'A1C test status',
    'change': 'Diabetic medication change',
    'diabetes_med': 'Diabetic medication prescribed'
}

class ExplanationService:
    @staticmethod
    def get_human_value(clean_feat_name: str, df_patient: pd.DataFrame) -> tuple:
        """
        Maps a clean preprocessed feature name back to its original column name and patient value.
        """
        for col in df_patient.columns:
            if clean_feat_name.startswith(col):
                val = df_patient[col].values[0]
                
                # Convert numpy types to native Python scalar types for serialization
                if hasattr(val, "item"):
                    val = val.item()
                    
                desc = HUMAN_FEATURE_NAMES.get(col, col)
                if clean_feat_name == col:
                    return desc, val
                else:
                    # Categorical feature level
                    level = clean_feat_name[len(col):].strip("_").replace("_", " ")
                    return f"{desc} ({level})", val
        return clean_feat_name, None

    @classmethod
    def explain_patient(cls, df_patient: pd.DataFrame) -> list:
        """
        Generates individual SHAP feature attributions for a single patient record.
        Returns a list of FeatureExplanation dictionaries.
        """
        try:
            model = ModelLoader.get_model()
            preprocessor = model.named_steps['preprocessor']
            classifier = model.named_steps['classifier']
            
            # 1. Transform patient to preprocessed 2D array
            patient_prep = preprocessor.transform(df_patient)
            
            # 2. Extract and clean feature names
            cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
            cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_COLS).tolist()
            all_feature_names = NUMERICAL_COLS + cat_feature_names
            clean_feature_names = [
                f.replace('[', '_')
                 .replace(']', '_')
                 .replace('<', '_')
                 .replace(' ', '_')
                 .replace('/', '_')
                 .replace('-', '_')
                for f in all_feature_names
            ]
            
            # 3. Fit TreeExplainer and predict SHAP values
            explainer = shap.TreeExplainer(classifier)
            shap_vals = explainer(patient_prep)
            shap_vals.feature_names = clean_feature_names
            
            # 4. Extract first patient's attributions
            p_shap = shap_vals[0]
            
            # 5. Build DataFrame for sorting
            shap_df = pd.DataFrame({
                'clean_feature': clean_feature_names,
                'shap_value': p_shap.values,
                'feature_value': p_shap.data
            })
            
            # Filter out features with virtually no impact
            shap_df = shap_df[shap_df['shap_value'].abs() > 0.01]
            
            # Sort by absolute contribution descending
            shap_df['abs_shap'] = shap_df['shap_value'].abs()
            shap_df = shap_df.sort_values(by='abs_shap', ascending=False)
            
            # 6. Take top 5 and map to human readable descriptions
            explanations = []
            for _, row in shap_df.head(5).iterrows():
                feat_desc, orig_val = cls.get_human_value(row['clean_feature'], df_patient)
                
                explanations.append({
                    "feature": feat_desc,
                    "value": orig_val,
                    "impact": "positive" if row['shap_value'] > 0 else "negative",
                    "importance": float(row['shap_value'])
                })
                
            return explanations
            
        except Exception as e:
            logger.error(f"Failed to generate SHAP explanations: {e}", exc_info=True)
            # Safe fallback: return empty explanations so inference request doesn't fail
            return []
