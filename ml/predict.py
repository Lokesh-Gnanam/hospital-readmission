import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import joblib
import shap
from preprocessing import NUMERICAL_COLS, CATEGORICAL_COLS

# Human-readable mappings for features to make explanations clean
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

def get_human_feature_description(feat_name):
    # Find base feature name by matching against original features
    for base in HUMAN_FEATURE_NAMES.keys():
        if feat_name.startswith(base):
            desc = HUMAN_FEATURE_NAMES[base]
            # If it's a one-hot encoded category, extract the category level
            if len(feat_name) > len(base) and feat_name[len(base)] == '_':
                level = feat_name[len(base)+1:].replace('_', ' ')
                return f"{desc} ({level})"
            return desc
    return feat_name

def get_default_patient():
    return {
        'age': '[70-80)',
        'time_in_hospital': 6,
        'n_lab_procedures': 45,
        'n_procedures': 1,
        'n_medications': 18,
        'n_outpatient': 0,
        'n_inpatient': 2,
        'n_emergency': 1,
        'medical_specialty': 'InternalMedicine',
        'diag_1': 'Circulatory',
        'diag_2': 'Diabetes',
        'diag_3': 'Other',
        'glucose_test': 'no',
        'A1Ctest': 'no',
        'change': 'no',
        'diabetes_med': 'yes'
    }

def predict_patient(patient_dict):
    # Load model and metadata
    model_path = os.path.join("models", "readmission_model.pkl")
    metadata_path = os.path.join("models", "readmission_model_metadata.json")
    
    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        raise FileNotFoundError("Final model or metadata file not found. Please run src/train.py first.")
        
    full_pipeline = joblib.load(model_path)
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    threshold = metadata['selected_threshold']
    preprocessor = full_pipeline.named_steps['preprocessor']
    classifier = full_pipeline.named_steps['classifier']
    
    # 1. Convert patient dict to DataFrame
    df_patient = pd.DataFrame([patient_dict])
    
    # 2. Run prediction probability
    prob = full_pipeline.predict_proba(df_patient)[0, 1]
    
    # 3. Categorize Risk
    # Hackathon prototype thresholds:
    if prob < 0.2:
        risk_level = "LOW"
    elif prob < 0.3:
        risk_level = "MODERATE"
    else:
        risk_level = "HIGH"
        
    # 4. Preprocess patient record to calculate SHAP contributions
    patient_prep = preprocessor.transform(df_patient)
    
    # Get feature names
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
    
    # Fit SHAP explainer
    explainer = shap.TreeExplainer(classifier)
    shap_vals = explainer(patient_prep)
    shap_vals.feature_names = clean_feature_names
    
    p_shap = shap_vals[0]
    
    # Create DataFrame of SHAP values
    shap_df = pd.DataFrame({
        'feature': clean_feature_names,
        'shap_value': p_shap.values,
        'feature_value': p_shap.data
    })
    
    # Sort by absolute SHAP value to find top drivers
    shap_df['abs_shap'] = shap_df['shap_value'].abs()
    shap_df = shap_df.sort_values(by='abs_shap', ascending=False)
    
    # Filter features that have a significant contribution (non-zero log-odds impact)
    shap_df = shap_df[shap_df['shap_value'].abs() > 0.01]
    
    print("\n" + "=" * 50)
    print("        HOSPITAL READMISSION PREDICTION RESULT")
    print("=" * 50)
    print(f"30-Day Readmission Probability: {prob * 100:.1f}%")
    print(f"Risk Level:                     {risk_level}")
    print(f"Decision operating threshold:   {threshold:.2f} (decision mapping: PROBABILITY >= {threshold:.2f} -> Positive)")
    print("\nTop Contributing Factors:")
    
    if len(shap_df) == 0:
        print("  - No features have significant impact on the baseline prediction.")
    else:
        for idx, row in shap_df.head(5).iterrows():
            direction = "High Risk" if row['shap_value'] > 0 else "Low Risk"
            impact_desc = "High impact" if row['abs_shap'] > 0.1 else "Medium impact" if row['abs_shap'] > 0.03 else "Low impact"
            human_name = get_human_feature_description(row['feature'])
            
            # Print feature name and value
            print(f"  - {human_name} — {impact_desc} ({direction})")
            
    print("\nNote: This tool is a research/hackathon prototype and is NOT clinically validated.")
    print("=" * 50)

def prompt_interactive_patient():
    print("\n--- Interactive Patient Entry (press Enter to accept default demo values) ---")
    default = get_default_patient()
    patient = {}
    
    # Numerical prompts
    for col in NUMERICAL_COLS:
        val_str = input(f"{col} [default: {default[col]}]: ").strip()
        if val_str == "":
            patient[col] = default[col]
        else:
            try:
                patient[col] = int(val_str)
            except ValueError:
                print(f"Invalid integer. Using default value: {default[col]}")
                patient[col] = default[col]
                
    # Categorical prompts
    for col in CATEGORICAL_COLS:
        val_str = input(f"{col} [default: {default[col]}]: ").strip()
        if val_str == "":
            patient[col] = default[col]
        else:
            patient[col] = val_str
            
    return patient

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Predict hospital 30-day readmission risk.")
    parser.add_argument('--patient_json', type=str, help="Path to patient JSON file.")
    parser.add_argument('--interactive', action='store_true', help="Prompt user for patient features interactively.")
    args = parser.parse_args()
    
    if args.interactive:
        patient = prompt_interactive_patient()
    elif args.patient_json:
        if not os.path.exists(args.patient_json):
            print(f"Error: JSON file not found at {args.patient_json}")
            sys.exit(1)
        with open(args.patient_json, "r") as f:
            patient = json.load(f)
    else:
        print("No input provided. Running demonstration mode with a sample high-risk patient...")
        patient = get_default_patient()
        
    predict_patient(patient)
