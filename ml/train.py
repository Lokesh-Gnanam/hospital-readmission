import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, auc, confusion_matrix
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from preprocessing import load_and_split_data, get_preprocessing_pipeline, NUMERICAL_COLS, CATEGORICAL_COLS

def calculate_pr_auc(y_true, y_prob):
    precision, recall, _ = precision_recall_curve(y_true, y_prob)
    return auc(recall, precision)

def cross_validate_model(model_name, get_model_func, X_train, y_train, use_smote=False):
    """
    Performs custom 5-Fold Stratified CV, preprocessing inside folds to prevent leakage.
    If use_smote is True, applies SMOTE to the preprocessed training fold.
    """
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    metrics = {
        'accuracy': [], 'precision': [], 'recall': [], 'f1': [],
        'roc_auc': [], 'pr_auc': []
    }
    
    oof_probs = np.zeros(len(X_train))
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train)):
        X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
        y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
        
        # Fit preprocessor on training fold
        preprocessor = get_preprocessing_pipeline()
        X_tr_prep = preprocessor.fit_transform(X_tr)
        X_val_prep = preprocessor.transform(X_val)
        
        # Instantiate model
        model = get_model_func()
        
        # Handle SMOTE if requested
        if use_smote:
            smote = SMOTE(random_state=42)
            X_tr_prep, y_tr_res = smote.fit_resample(X_tr_prep, y_tr)
        else:
            y_tr_res = y_tr
            
        # Fit model
        model.fit(X_tr_prep, y_tr_res)
        
        # Predict probabilities
        y_prob = model.predict_proba(X_val_prep)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        
        oof_probs[val_idx] = y_prob
        
        # Metrics
        metrics['accuracy'].append(accuracy_score(y_val, y_pred))
        metrics['precision'].append(precision_score(y_val, y_pred, zero_division=0))
        metrics['recall'].append(recall_score(y_val, y_pred))
        metrics['f1'].append(f1_score(y_val, y_pred))
        metrics['roc_auc'].append(roc_auc_score(y_val, y_prob))
        metrics['pr_auc'].append(calculate_pr_auc(y_val, y_prob))
        
    summary = {}
    for metric_name, values in metrics.items():
        summary[f'mean_{metric_name}'] = np.mean(values)
        summary[f'std_{metric_name}'] = np.std(values)
        
    return summary, oof_probs

def run_baseline_and_cv(X_train, y_train):
    print("\n--- PHASE 7 & 8: Baseline Models & Cross-Validation ---")
    
    # 1. Logistic Regression
    def get_lr():
        return LogisticRegression(max_iter=1000, random_state=42)
        
    # 2. Random Forest
    def get_rf():
        return RandomForestClassifier(n_estimators=100, random_state=42)
        
    # 3. XGBoost
    def get_xgb():
        return XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
        
    models = {
        'Logistic Regression': get_lr,
        'Random Forest': get_rf,
        'XGBoost': get_xgb
    }
    
    results = {}
    oof_predictions = {}
    
    for name, get_func in models.items():
        print(f"Running Cross-Validation for {name}...")
        summary, oof_probs = cross_validate_model(name, get_func, X_train, y_train)
        results[name] = summary
        oof_predictions[name] = oof_probs
        
        print(f"  Accuracy  : {summary['mean_accuracy']:.4f} (std: {summary['std_accuracy']:.4f})")
        print(f"  Precision : {summary['mean_precision']:.4f} (std: {summary['std_precision']:.4f})")
        print(f"  Recall    : {summary['mean_recall']:.4f} (std: {summary['std_recall']:.4f})")
        print(f"  F1-Score  : {summary['mean_f1']:.4f} (std: {summary['std_f1']:.4f})")
        print(f"  ROC-AUC   : {summary['mean_roc_auc']:.4f} (std: {summary['std_roc_auc']:.4f})")
        print(f"  PR-AUC    : {summary['mean_pr_auc']:.4f} (std: {summary['std_pr_auc']:.4f})")
        
    # Save baseline comparison
    os.makedirs("reports/model_results", exist_ok=True)
    with open("reports/model_results/baseline_comparison.txt", "w") as f:
        f.write("Baseline Models Cross-Validation Results\n")
        f.write("=========================================\n")
        for name, metrics in results.items():
            f.write(f"\nModel: {name}\n")
            for k, v in metrics.items():
                f.write(f"  {k}: {v:.4f}\n")
                
    print("Baseline comparison report saved to reports/model_results/baseline_comparison.txt")
    return results, oof_predictions

def run_class_imbalance_analysis(X_train, y_train):
    print("\n--- PHASE 9: Class Imbalance Analysis ---")
    print(f"Training Class distribution: {y_train.value_counts().to_dict()}")
    print("Imbalance check: The dataset is balanced (~53% vs ~47%). Handling imbalance is not strictly required, but we will run experiments to compare methods.")
    
    # Baseline XGBoost (No handling)
    def get_xgb_base():
        return XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
        
    # XGBoost with Class Weighting (scale_pos_weight = ratio of negative to positive class)
    neg_pos_ratio = (y_train == 0).sum() / (y_train == 1).sum()
    print(f"Computed scale_pos_weight: {neg_pos_ratio:.4f}")
    def get_xgb_weighted():
        return XGBClassifier(n_estimators=100, scale_pos_weight=neg_pos_ratio, random_state=42, eval_metric='logloss')
        
    # XGBoost with SMOTE
    print("Running XGBoost with SMOTE...")
    
    imb_results = {}
    
    print("Evaluating Baseline XGBoost (No Handling)...")
    imb_results['No Handling'], _ = cross_validate_model('XGBoost_Base', get_xgb_base, X_train, y_train)
    
    print("Evaluating XGBoost with Class Weighting...")
    imb_results['Class Weighting'], _ = cross_validate_model('XGBoost_Weighted', get_xgb_weighted, X_train, y_train)
    
    print("Evaluating XGBoost with SMOTE...")
    imb_results['SMOTE'], _ = cross_validate_model('XGBoost_SMOTE', get_xgb_base, X_train, y_train, use_smote=True)
    
    # Print results
    report_lines = []
    report_lines.append("Class Imbalance Handling Method Comparison")
    report_lines.append("==========================================")
    for method, metrics in imb_results.items():
        report_lines.append(f"\nMethod: {method}")
        report_lines.append(f"  Recall:    {metrics['mean_recall']:.4f} (std: {metrics['std_recall']:.4f})")
        report_lines.append(f"  Precision: {metrics['mean_precision']:.4f} (std: {metrics['std_precision']:.4f})")
        report_lines.append(f"  F1:        {metrics['mean_f1']:.4f} (std: {metrics['std_f1']:.4f})")
        report_lines.append(f"  PR-AUC:    {metrics['mean_pr_auc']:.4f} (std: {metrics['std_pr_auc']:.4f})")
        
    report_str = "\n".join(report_lines)
    print(report_str)
    
    with open("reports/model_results/imbalance_analysis.txt", "w") as f:
        f.write(report_str)
    print("Class imbalance comparison saved to reports/model_results/imbalance_analysis.txt")
    
    return imb_results

def run_hyperparameter_tuning(X_train, y_train):
    print("\n--- PHASE 10: Hyperparameter Tuning (XGBoost) ---")
    
    # Preprocess all training data first for hyperparameter search
    preprocessor = get_preprocessing_pipeline()
    X_train_prep = preprocessor.fit_transform(X_train)
    
    # Define a focused parameter grid
    param_grid = {
        'learning_rate': [0.05, 0.1],
        'max_depth': [3, 5],
        'n_estimators': [100, 150],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0]
    }
    
    print("Grid Search parameters:")
    print(param_grid)
    
    xgb = XGBClassifier(random_state=42, eval_metric='logloss')
    
    # Stratified 5-Fold Grid Search
    grid_search = GridSearchCV(
        estimator=xgb,
        param_grid=param_grid,
        scoring='f1', # Optimize for F1-score to balance Precision and Recall
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        n_jobs=-1,
        verbose=1
    )
    
    print("Running GridSearchCV...")
    grid_search.fit(X_train_prep, y_train)
    
    best_params = grid_search.best_params_
    best_score = grid_search.best_score_
    
    print(f"Best hyperparameters found: {best_params}")
    print(f"Best CV F1-Score: {best_score:.4f}")
    
    # Run CV with best estimator to collect metrics and out-of-fold probabilities
    def get_tuned_xgb():
        return XGBClassifier(**best_params, random_state=42, eval_metric='logloss')
        
    print("Re-evaluating Tuned XGBoost using cross-validation...")
    tuned_summary, oof_probs = cross_validate_model('Tuned_XGBoost', get_tuned_xgb, X_train, y_train)
    
    tuning_report = []
    tuning_report.append("Hyperparameter Tuning Results (XGBoost)")
    tuning_report.append("=======================================")
    tuning_report.append(f"Best Parameters: {json.dumps(best_params, indent=2)}")
    tuning_report.append("\nTuned Model CV Metrics:")
    for k, v in tuned_summary.items():
        tuning_report.append(f"  {k}: {v:.4f}")
        
    tuning_report_str = "\n".join(tuning_report)
    print(tuning_report_str)
    
    with open("reports/model_results/tuning_results.txt", "w") as f:
        f.write(tuning_report_str)
    print("Tuning report saved to reports/model_results/tuning_results.txt")
    
    return best_params, tuned_summary, oof_probs

def run_threshold_optimization(y_train, oof_probs):
    print("\n--- PHASE 11: Threshold Optimization ---")
    thresholds = np.arange(0.1, 1.0, 0.1)
    
    report_lines = []
    report_lines.append("Classification Threshold Tradeoff Analysis")
    report_lines.append("===========================================")
    report_lines.append(f"{'Threshold':<10} | {'Recall':<8} | {'Precision':<9} | {'F1':<6} | {'FP':<6} | {'FN':<6}")
    report_lines.append("-" * 55)
    
    best_threshold = 0.5
    best_f1 = -1.0
    
    for thresh in thresholds:
        y_pred = (oof_probs >= thresh).astype(int)
        rec = recall_score(y_train, y_pred)
        prec = precision_score(y_train, y_pred, zero_division=0)
        f1 = f1_score(y_train, y_pred)
        tn, fp, fn, tp = confusion_matrix(y_train, y_pred).ravel()
        
        report_lines.append(f"{thresh:<10.1f} | {rec:<8.4f} | {prec:<9.4f} | {f1:<6.4f} | {fp:<6} | {fn:<6}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = thresh
            
    report_lines.append("\nOptimization Selection:")
    report_lines.append(f"Selected Threshold: {best_threshold:.1f}")
    report_lines.append(f"Reason: Maximizes the F1-score ({best_f1:.4f}) to balance sensitivity (recall) and specificity (precision).")
    report_lines.append("Note: This is a hackathon prototype threshold and is not clinically validated.")
    
    report_str = "\n".join(report_lines)
    print(report_str)
    
    with open("reports/model_results/threshold_optimization.txt", "w") as f:
        f.write(report_str)
    print("Threshold optimization report saved to reports/model_results/threshold_optimization.txt")
    
    return best_threshold

def build_final_pipeline_and_export(X_train, y_train, best_params, selected_threshold, cv_metrics):
    print("\n--- PHASE 17: Model Export ---")
    
    # 1. Fit Preprocessor on full training set
    preprocessor = get_preprocessing_pipeline()
    X_train_prep = preprocessor.fit_transform(X_train)
    
    # 2. Fit Classifier on full preprocessed training set
    classifier = XGBClassifier(**best_params, random_state=42, eval_metric='logloss')
    classifier.fit(X_train_prep, y_train)
    
    # 3. Create full pipeline
    full_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', classifier)
    ])
    
    # Save the pipeline
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", "readmission_model.pkl")
    joblib.dump(full_pipeline, model_path)
    print(f"Successfully saved pipeline to {model_path}")
    
    # Extract feature names from preprocessing to save in metadata
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_COLS).tolist()
    all_feature_names = NUMERICAL_COLS + cat_feature_names
    
    # Create metadata JSON
    metadata = {
        'model_version': '1.0.0',
        'selected_threshold': float(selected_threshold),
        'best_hyperparameters': best_params,
        'cross_validation_metrics': cv_metrics,
        'feature_info': {
            'numerical_features': NUMERICAL_COLS,
            'categorical_features': CATEGORICAL_COLS,
            'preprocessed_features': all_feature_names
        },
        'training_config': {
            'train_size': len(X_train),
            'random_state': 42
        }
    }
    
    metadata_path = os.path.join("models", "readmission_model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
    print(f"Successfully saved model metadata to {metadata_path}")
    
    return full_pipeline, metadata

if __name__ == '__main__':
    # Load dataset splits
    X_train, X_test, y_train, y_test = load_and_split_data()
    
    # Phase 7 & 8: Baseline Models & CV
    baseline_results, oof_predictions = run_baseline_and_cv(X_train, y_train)
    
    # Phase 9: Class Imbalance Analysis
    run_class_imbalance_analysis(X_train, y_train)
    
    # Phase 10: Hyperparameter Tuning
    best_params, tuned_summary, oof_probs = run_hyperparameter_tuning(X_train, y_train)
    
    # Phase 11: Threshold Optimization
    selected_threshold = run_threshold_optimization(y_train, oof_probs)
    
    # Phase 17: Build and Export final model
    build_final_pipeline_and_export(X_train, y_train, best_params, selected_threshold, tuned_summary)
    
    print("\nML Training Pipeline executed and model exported successfully!")
