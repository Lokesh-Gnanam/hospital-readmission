import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib
import shap
from preprocessing import load_and_split_data, NUMERICAL_COLS, CATEGORICAL_COLS

def explain_pipeline():
    print("Executing Phase 14: Model Explainability (SHAP)...")
    
    # 1. Load model and metadata
    model_path = os.path.join("models", "readmission_model.pkl")
    metadata_path = os.path.join("models", "readmission_model_metadata.json")
    
    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        raise FileNotFoundError("Model or metadata file not found. Please run training first.")
        
    full_pipeline = joblib.load(model_path)
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    threshold = metadata['selected_threshold']
    
    # Get component steps
    preprocessor = full_pipeline.named_steps['preprocessor']
    classifier = full_pipeline.named_steps['classifier']
    
    # 2. Load held-out test data
    _, X_test, _, y_test = load_and_split_data()
    
    # Transform test set to match classifier input
    X_test_prep = preprocessor.transform(X_test)
    
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_COLS).tolist()
    all_feature_names = NUMERICAL_COLS + cat_feature_names

    # Replace characters not allowed by XGBoost / SHAP
    clean_feature_names = [
        f.replace('[', '_')
         .replace(']', '_')
         .replace('<', '_')
         .replace(' ', '_')
         .replace('/', '_')
         .replace('-', '_')
        for f in all_feature_names
    ]
    
    X_test_prep_df = pd.DataFrame(X_test_prep, columns=clean_feature_names)
    
    # 3. Fit TreeExplainer
    print("Fitting SHAP TreeExplainer...")
    explainer = shap.TreeExplainer(classifier)
    shap_values = explainer(X_test_prep)
    shap_values.feature_names = clean_feature_names
    
    # 4. Generate and save global explanation plot
    os.makedirs("reports/figures", exist_ok=True)
    plt.figure(figsize=(12, 8))
    shap.summary_plot(shap_values, X_test_prep_df, show=False)
    plt.title("SHAP Global Feature Importance Summary", fontsize=14, pad=15)
    plt.tight_layout()
    global_plot_path = os.path.join("reports", "figures", "shap_global.png")
    plt.savefig(global_plot_path, dpi=300)
    plt.close()
    print(f"Saved global SHAP plot to {global_plot_path}")
    
    # 5. Local explanations for sample patients
    # We will pick a few representative patients:
    # - A high-risk patient (probability >= threshold)
    # - A low-risk patient (probability < threshold)
    
    probs = full_pipeline.predict_proba(X_test)[:, 1]
    
    # High-risk sample (highest probability in test set)
    high_risk_idx = np.argmax(probs)
    # Low-risk sample (lowest probability in test set)
    low_risk_idx = np.argmin(probs)
    
    print("\n--- SAMPLE LOCAL EXPLANATIONS ---")
    show_local_explanation(high_risk_idx, X_test, probs, shap_values, X_test_prep_df, threshold)
    show_local_explanation(low_risk_idx, X_test, probs, shap_values, X_test_prep_df, threshold)
    
    # Save a sample explanation to a report file
    report_file_path = os.path.join("reports", "model_results", "shap_local_explanations.txt")
    with open(report_file_path, "w") as f:
        f.write("SHAP LOCAL PATIENT EXPLANATIONS\n")
        f.write("===============================\n")
        f.write("Note: SHAP explanations are hackathon model feature attributions and are NOT medical diagnoses.\n\n")
        
        # Capture stdout for both samples
        import io
        import sys
        old_stdout = sys.stdout
        sys.stdout = buffer = io.StringIO()
        
        show_local_explanation(high_risk_idx, X_test, probs, shap_values, X_test_prep_df, threshold)
        show_local_explanation(low_risk_idx, X_test, probs, shap_values, X_test_prep_df, threshold)
        
        sys.stdout = old_stdout
        f.write(buffer.getvalue())
        
    print(f"Saved local patient SHAP explanations report to {report_file_path}")

def show_local_explanation(idx, X_original, probs, shap_values, X_prep_df, threshold):
    prob = probs[idx]
    patient_data = X_original.iloc[idx]
    
    # Determine risk category
    if prob < 0.2:
        risk_level = "LOW"
    elif prob < 0.3:
        risk_level = "MODERATE"
    else:
        risk_level = "HIGH"
        
    print(f"\nPatient Index: {idx}")
    print(f"30-Day Readmission Probability: {prob*100:.2f}%")
    print(f"Risk Level: {risk_level} (Operating Decision Threshold: {threshold:.2f})")
    print("\nOriginal Patient Features:")
    for col, val in patient_data.items():
         print(f"  - {col}: {val}")
         
    # Extract SHAP values
    p_shap = shap_values[idx]
    
    # Create DataFrame of non-zero SHAP values
    shap_df = pd.DataFrame({
        'feature': X_prep_df.columns,
        'shap_value': p_shap.values,
        'feature_value': p_shap.data
    })
    
    # Exclude features with minimal/zero contribution to keep it readable
    shap_df = shap_df[shap_df['shap_value'].abs() > 0.01]
    
    # Sort by absolute SHAP value
    shap_df['abs_shap'] = shap_df['shap_value'].abs()
    shap_df = shap_df.sort_values(by='abs_shap', ascending=False)
    
    print("\nTop Contributing Factors:")
    for i, row in shap_df.head(6).iterrows():
        direction = "UP" if row['shap_value'] > 0 else "DOWN"
        impact = "High" if row['abs_shap'] > 0.1 else "Medium" if row['abs_shap'] > 0.03 else "Low"
        
        # Clean feature name output
        feat_name = row['feature']
        feat_val = row['feature_value']
        
        print(f"  - {feat_name} (val: {feat_val}) — {impact} impact (pushes risk {direction} by {row['shap_value']:.4f} log-odds)")
    print("-" * 50)

if __name__ == '__main__':
    explain_pipeline()
