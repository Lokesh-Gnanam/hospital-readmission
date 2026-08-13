import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, roc_curve, auc, confusion_matrix, classification_report
)
from preprocessing import load_and_split_data

def calculate_pr_auc(y_true, y_prob):
    precision, recall, _ = precision_recall_curve(y_true, y_prob)
    return auc(recall, precision)

def run_evaluation():
    print("Executing Phase 13: Final Test Evaluation...")
    
    # 1. Load model and metadata
    model_path = os.path.join("models", "readmission_model.pkl")
    metadata_path = os.path.join("models", "readmission_model_metadata.json")
    
    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        raise FileNotFoundError("Model or metadata file not found. Please run training first.")
        
    model = joblib.load(model_path)
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    threshold = metadata['selected_threshold']
    print(f"Loaded model version: {metadata['model_version']}")
    print(f"Loaded operating threshold: {threshold}")
    
    # 2. Load held-out test data
    _, X_test, _, y_test = load_and_split_data()
    print(f"Loaded test set with {len(X_test)} samples.")
    
    # 3. Predict probabilities and apply threshold
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= threshold).astype(int)
    
    # 4. Compute metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc = calculate_pr_auc(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    # Print metrics
    print("\n==================================================")
    print("        FINAL HELD-OUT TEST SET EVALUATION        ")
    print("==================================================")
    print(f"Operating Threshold: {threshold:.2f}")
    print(f"Accuracy:            {acc:.4f}")
    print(f"Precision:           {prec:.4f}")
    print(f"Recall:              {rec:.4f}")
    print(f"F1-Score:            {f1:.4f}")
    print(f"ROC-AUC:             {roc_auc:.4f}")
    print(f"PR-AUC:              {pr_auc:.4f}")
    print("\nConfusion Matrix:")
    print(f"  True Negatives (TN):  {tn}")
    print(f"  False Positives (FP): {fp}")
    print(f"  False Negatives (FN): {fn}")
    print(f"  True Positives (TP):  {tp}")
    print("\nClassification Report:")
    report_str = classification_report(y_test, y_pred, target_names=['No Readmit', 'Readmit'])
    print(report_str)
    print("==================================================")
    
    # 5. Plot curves
    os.makedirs("reports/figures", exist_ok=True)
    sns.set_theme(style="whitegrid")
    
    # Plot ROC curve
    plt.figure(figsize=(6, 5))
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.4f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=12)
    plt.ylabel('True Positive Rate', fontsize=12)
    plt.title('Receiver Operating Characteristic (ROC) Curve', fontsize=14)
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig('reports/figures/roc_curve_test.png', dpi=300)
    plt.close()
    
    # Plot PR curve
    plt.figure(figsize=(6, 5))
    precision, recall, _ = precision_recall_curve(y_test, y_prob)
    plt.plot(recall, precision, color='blue', lw=2, label=f'PR curve (area = {pr_auc:.4f})')
    plt.axhline(y=y_test.mean(), color='red', linestyle='--', label=f'Baseline ({y_test.mean():.4f})')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('Recall', fontsize=12)
    plt.ylabel('Precision', fontsize=12)
    plt.title('Precision-Recall Curve', fontsize=14)
    plt.legend(loc="lower left")
    plt.tight_layout()
    plt.savefig('reports/figures/pr_curve_test.png', dpi=300)
    plt.close()
    
    # Plot Confusion Matrix
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['No Readmit', 'Readmit'], yticklabels=['No Readmit', 'Readmit'])
    plt.ylabel('True label', fontsize=12)
    plt.xlabel('Predicted label', fontsize=12)
    plt.title(f'Confusion Matrix (Threshold = {threshold:.2f})', fontsize=14)
    plt.tight_layout()
    plt.savefig('reports/figures/confusion_matrix_test.png', dpi=300)
    plt.close()
    
    # Executing Phase 15: Risk Stratification
    print("\nExecuting Phase 15: Risk Stratification...")
    
    # Assign risk categories
    risk_df = pd.DataFrame({
        'true_label': y_test,
        'probability': y_prob
    })
    
    def assign_risk_category(prob):
        if prob < 0.2:
            return 'LOW'
        elif prob < 0.3:
            return 'MODERATE'
        else:
            return 'HIGH'
            
    risk_df['risk_category'] = risk_df['probability'].apply(assign_risk_category)
    
    # Calculate stats per category
    risk_summary = risk_df.groupby('risk_category').agg(
        total_patients=('probability', 'count'),
        readmitted_patients=('true_label', 'sum'),
        average_probability=('probability', 'mean')
    ).reset_index()
    
    risk_summary['readmission_rate'] = (risk_summary['readmitted_patients'] / risk_summary['total_patients']) * 100
    risk_summary['percentage_of_total_patients'] = (risk_summary['total_patients'] / len(y_test)) * 100
    
    # Order risk levels
    category_order = {'LOW': 0, 'MODERATE': 1, 'HIGH': 2}
    risk_summary['order'] = risk_summary['risk_category'].map(category_order)
    risk_summary = risk_summary.sort_values('order').drop(columns='order')
    
    print("\nRisk Stratification Summary (Held-out Test Set):")
    print(risk_summary.to_string(index=False))
    
    # Save text report
    os.makedirs("reports/model_results", exist_ok=True)
    report_file_path = os.path.join("reports", "model_results", "final_test_evaluation.txt")
    with open(report_file_path, "w") as f:
        f.write("FINAL HELD-OUT TEST EVALUATION REPORT\n")
        f.write("=====================================\n")
        f.write(f"Model version: {metadata['model_version']}\n")
        f.write(f"Operating Threshold: {threshold:.2f}\n")
        f.write(f"Accuracy: {acc:.4f}\n")
        f.write(f"Precision: {prec:.4f}\n")
        f.write(f"Recall: {rec:.4f}\n")
        f.write(f"F1-Score: {f1:.4f}\n")
        f.write(f"ROC-AUC: {roc_auc:.4f}\n")
        f.write(f"PR-AUC: {pr_auc:.4f}\n")
        f.write("\nConfusion Matrix:\n")
        f.write(f"  True Negatives (TN):  {tn}\n")
        f.write(f"  False Positives (FP): {fp}\n")
        f.write(f"  False Negatives (FN): {fn}\n")
        f.write(f"  True Positives (TP):  {tp}\n")
        f.write("\nClassification Report:\n")
        f.write(report_str)
        f.write("\n\nPHASE 15: RISK STRATIFICATION PROTOTYPE\n")
        f.write("=======================================\n")
        f.write("Risk Category definitions (Hackathon Prototype thresholds, NOT clinically validated):\n")
        f.write("  - LOW:       probability < 0.20\n")
        f.write("  - MODERATE:  0.20 <= probability < 0.30\n")
        f.write("  - HIGH:      probability >= 0.30\n\n")
        f.write(risk_summary.to_string(index=False))
        
    print(f"\nSaved final evaluation report to {report_file_path}")
    print("Saved curves and confusion matrix heatmaps under reports/figures/")

if __name__ == '__main__':
    run_evaluation()
