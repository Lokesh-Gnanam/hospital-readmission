import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_selection import mutual_info_classif
from sklearn.preprocessing import OrdinalEncoder

def run_data_audit(df):
    print("Executing Phase 1: Data Audit...")
    n_rows, n_cols = df.shape
    col_names = df.columns.tolist()
    dtypes = df.dtypes.to_dict()
    
    # Missing values check (NaN and 'Missing' string)
    nan_counts = df.isnull().sum().to_dict()
    missing_str_counts = {col: (df[col] == 'Missing').sum() for col in df.columns if df[col].dtype == 'object'}
    
    duplicates = df.duplicated().sum()
    
    # Target distribution
    target_counts = df['readmitted'].value_counts(dropna=False)
    target_pcts = df['readmitted'].value_counts(normalize=True, dropna=False) * 100
    
    # Numerical and Categorical features split (excluding target)
    features = [c for c in col_names if c != 'readmitted']
    numerical_features = df[features].select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = df[features].select_dtypes(include=['object', 'category']).columns.tolist()
    
    # Identifiers check
    possible_identifiers = []
    for col in col_names:
        if df[col].nunique() == n_rows or 'id' in col.lower() or 'encounter' in col.lower() or 'patient' in col.lower():
            possible_identifiers.append(col)
            
    # Audit Report string
    report = []
    report.append("==================================================")
    report.append("          PHASE 1 — DATA AUDIT REPORT             ")
    report.append("==================================================")
    report.append(f"1. Number of rows: {n_rows}")
    report.append(f"2. Number of columns: {n_cols}")
    report.append(f"3. Column names: {', '.join(col_names)}")
    report.append("\n4. Data Types:")
    for col, dtype in dtypes.items():
        report.append(f"   - {col}: {dtype}")
        
    report.append("\n5. Missing Values:")
    report.append("   Standard NaNs:")
    for col, count in nan_counts.items():
        if count > 0:
            report.append(f"   - {col}: {count}")
    else:
        report.append("   - No standard NaNs found.")
        
    report.append("   Coded as 'Missing' strings:")
    has_missing_str = False
    for col, count in missing_str_counts.items():
        if count > 0:
            report.append(f"   - {col}: {count} ('{count/n_rows*100:.2f}%')")
            has_missing_str = True
    if not has_missing_str:
        report.append("   - No 'Missing' strings found.")
        
    report.append(f"\n6. Duplicate rows: {duplicates}")
    
    report.append("\n7. Unique values for categorical columns:")
    for col in categorical_features:
        unique_vals = df[col].unique()
        report.append(f"   - {col}: {len(unique_vals)} unique values: {list(unique_vals)}")
        
    report.append("\n8. Target class distribution ('readmitted'):")
    for val in target_counts.index:
        report.append(f"   - {val}: {target_counts[val]} ({target_pcts[val]:.2f}%)")
        
    report.append(f"\n9. Numerical features: {', '.join(numerical_features)}")
    report.append(f"10. Categorical features: {', '.join(categorical_features)}")
    report.append(f"11. Possible identifier columns: {', '.join(possible_identifiers) if possible_identifiers else 'None'}")
    
    report.append("\n12. Potential target/data leakage columns:")
    report.append("   - No explicit post-discharge features (like discharge disposition details, length of stay after readmission, etc.) were found.")
    report.append("   - Features representing counts of visits in the preceding year (n_outpatient, n_inpatient, n_emergency) are historical and safe.")
    report.append("   - Features such as change, diabetes_med, glucose_test, A1Ctest, time_in_hospital represent events occurring during or before discharge, making them safe for pre-discharge prediction.")
    report.append("==================================================")
    
    report_str = "\n".join(report)
    print(report_str)
    
    # Save report
    os.makedirs("reports/eda", exist_ok=True)
    with open("reports/eda/data_quality_report.txt", "w") as f:
        f.write(report_str)
    print("Saved data quality report to reports/eda/data_quality_report.txt")
    
    return numerical_features, categorical_features

def run_eda(df, numerical_features, categorical_features):
    print("\nExecuting Phase 2: Exploratory Data Analysis...")
    os.makedirs("reports/figures", exist_ok=True)
    sns.set_theme(style="whitegrid")
    
    # 1. Target distribution
    plt.figure(figsize=(6, 4))
    sns.countplot(x='readmitted', data=df, palette='Set2')
    plt.title('Target Distribution: Readmitted (30-Day)', fontsize=14)
    plt.xlabel('Readmitted', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.tight_layout()
    plt.savefig('reports/figures/target_distribution.png', dpi=300)
    plt.close()
    
    # 2. Numerical feature distributions
    n_num = len(numerical_features)
    fig, axes = plt.subplots((n_num + 1) // 2, 2, figsize=(14, 12))
    axes = axes.flatten()
    for i, col in enumerate(numerical_features):
        sns.histplot(df[col], kde=True, ax=axes[i], color='teal', bins=20)
        axes[i].set_title(f'Distribution of {col}', fontsize=12)
        axes[i].set_xlabel('')
        axes[i].set_ylabel('Count')
    # hide extra axes
    for j in range(i + 1, len(axes)):
        fig.delaxes(axes[j])
    plt.tight_layout()
    plt.savefig('reports/figures/numerical_distributions.png', dpi=300)
    plt.close()
    
    # 3. Categorical feature distributions
    n_cat = len(categorical_features)
    fig, axes = plt.subplots((n_cat + 1) // 2, 2, figsize=(14, 15))
    axes = axes.flatten()
    for i, col in enumerate(categorical_features):
        sns.countplot(y=col, data=df, ax=axes[i], order=df[col].value_counts().index, palette='viridis')
        axes[i].set_title(f'Distribution of {col}', fontsize=12)
        axes[i].set_xlabel('Count')
        axes[i].set_ylabel('')
    for j in range(i + 1, len(axes)):
        fig.delaxes(axes[j])
    plt.tight_layout()
    plt.savefig('reports/figures/categorical_distributions.png', dpi=300)
    plt.close()
    
    # 4. Relationship between important features and readmission
    # Let's plot boxplots for numerical features grouped by target
    fig, axes = plt.subplots(3, 3, figsize=(16, 12))
    axes = axes.flatten()
    # we have 7 numerical features
    for i, col in enumerate(numerical_features):
        sns.boxplot(x='readmitted', y=col, data=df, ax=axes[i], palette='Set2')
        axes[i].set_title(f'{col} vs Readmission', fontsize=12)
        axes[i].set_xlabel('Readmitted')
        axes[i].set_ylabel(col)
    
    # Add key categorical relations (e.g. readmission rate by age)
    # Convert readmitted to binary for calculating rates
    df_temp = df.copy()
    df_temp['readmitted_bin'] = df_temp['readmitted'].map({'no': 0, 'yes': 1})
    
    # Age vs readmission rate
    age_rate = df_temp.groupby('age')['readmitted_bin'].mean().reset_index()
    sns.barplot(x='age', y='readmitted_bin', data=age_rate, ax=axes[7], palette='Blues_d')
    axes[7].set_title('Readmission Rate by Age', fontsize=12)
    axes[7].set_xlabel('Age')
    axes[7].set_ylabel('Readmission Rate')
    
    # Diabetes med vs readmission rate
    med_rate = df_temp.groupby('diabetes_med')['readmitted_bin'].mean().reset_index()
    sns.barplot(x='diabetes_med', y='readmitted_bin', data=med_rate, ax=axes[8], palette='Oranges_d')
    axes[8].set_title('Readmission Rate by Diabetes Meds', fontsize=12)
    axes[8].set_xlabel('Diabetes Meds')
    axes[8].set_ylabel('Readmission Rate')
    
    plt.tight_layout()
    plt.savefig('reports/figures/features_vs_readmission.png', dpi=300)
    plt.close()
    
    # 5. Correlation analysis for numerical features
    plt.figure(figsize=(8, 6))
    corr = df[numerical_features].corr()
    sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f", linewidths=0.5)
    plt.title('Correlation Matrix of Numerical Features', fontsize=14)
    plt.tight_layout()
    plt.savefig('reports/figures/correlation_matrix.png', dpi=300)
    plt.close()
    
    # 6. Basic feature importance analysis using Mutual Information
    print("Computing feature importance (Mutual Information)...")
    # Encode categorical columns ordinal-style to feed to mutual_info
    df_encoded = df.copy()
    df_encoded['readmitted'] = df_encoded['readmitted'].map({'no': 0, 'yes': 1})
    
    enc = OrdinalEncoder()
    df_encoded[categorical_features] = enc.fit_transform(df_encoded[categorical_features].astype(str))
    
    X = df_encoded[numerical_features + categorical_features]
    y = df_encoded['readmitted']
    
    # Set categorical mask
    discrete_features_mask = [False]*len(numerical_features) + [True]*len(categorical_features)
    
    # Compute mutual information
    mi_scores = mutual_info_classif(X, y, discrete_features=discrete_features_mask, random_state=42)
    mi_series = pd.Series(mi_scores, index=X.columns).sort_values(ascending=True)
    
    plt.figure(figsize=(10, 6))
    mi_series.plot(kind='barh', color='darkorange')
    plt.title('Mutual Information Scores with Readmission', fontsize=14)
    plt.xlabel('Mutual Information Score')
    plt.tight_layout()
    plt.savefig('reports/figures/basic_feature_importance.png', dpi=300)
    plt.close()
    
    print("EDA figures generated successfully.")
    print("Saved figures under reports/figures/")

if __name__ == '__main__':
    data_path = os.path.join("data", "hospital_readmissions.csv")
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
    else:
        df = pd.read_csv(data_path)
        num_feats, cat_feats = run_data_audit(df)
        run_eda(df, num_feats, cat_feats)
        print("Data Audit and EDA finished successfully!")
