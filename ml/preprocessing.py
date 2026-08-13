import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

# Define columns
NUMERICAL_COLS = [
    'time_in_hospital',
    'n_lab_procedures',
    'n_procedures',
    'n_medications',
    'n_outpatient',
    'n_inpatient',
    'n_emergency'
]

CATEGORICAL_COLS = [
    'age',
    'medical_specialty',
    'diag_1',
    'diag_2',
    'diag_3',
    'glucose_test',
    'A1Ctest',
    'change',
    'diabetes_med'
]

TARGET_COL = 'readmitted'

def load_and_split_data(data_path=os.path.join("data", "hospital_readmissions.csv")):
    """
    Loads data, converts target to binary, and performs stratified 80/20 train/test split.
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at path: {data_path}")
        
    df = pd.read_csv(data_path)
    
    # Phase 3: Target Definition and Mapping
    # Verify target values
    unique_targets = df[TARGET_COL].unique()
    assert set(unique_targets) == {'no', 'yes'}, f"Unexpected target values: {unique_targets}"
    
    # Map Target
    df[TARGET_COL] = df[TARGET_COL].map({'no': 0, 'yes': 1})
    
    X = df[NUMERICAL_COLS + CATEGORICAL_COLS]
    y = df[TARGET_COL]
    
    # Phase 5: Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )
    
    return X_train, X_test, y_train, y_test

def get_preprocessing_pipeline():
    """
    Constructs and returns the unfitted ColumnTransformer preprocessing pipeline.
    """
    # Phase 6: Preprocessing Pipelines
    # Numerical pipeline: Imputation (optional fallback) + StandardScaler
    num_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    # Categorical pipeline: Imputation (optional fallback) + OneHotEncoder with handle_unknown='ignore'
    # We treat 'Missing' string as a regular category since it is present in raw data
    cat_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    # Preprocessor ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, NUMERICAL_COLS),
            ('cat', cat_pipeline, CATEGORICAL_COLS)
        ]
    )
    
    return preprocessor

if __name__ == '__main__':
    X_train, X_test, y_train, y_test = load_and_split_data()
    print("Preprocessing checks:")
    print(f"X_train shape: {X_train.shape}")
    print(f"X_test shape: {X_test.shape}")
    print(f"y_train distribution:\n{y_train.value_counts(normalize=True) * 100}")
    print(f"y_test distribution:\n{y_test.value_counts(normalize=True) * 100}")
    
    preprocessor = get_preprocessing_pipeline()
    X_train_preprocessed = preprocessor.fit_transform(X_train)
    print(f"Preprocessed X_train shape: {X_train_preprocessed.shape}")
    print("Preprocessing checks completed successfully.")
