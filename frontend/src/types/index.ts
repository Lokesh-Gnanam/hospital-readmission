export interface PatientInput {
  time_in_hospital: number;
  n_lab_procedures: number;
  n_procedures: number;
  n_medications: number;
  n_outpatient: number;
  n_inpatient: number;
  n_emergency: number;
  age: '[40-50)' | '[50-60)' | '[60-70)' | '[70-80)' | '[80-90)' | '[90-100)';
  medical_specialty: 'Cardiology' | 'Emergency/Trauma' | 'Family/GeneralPractice' | 'InternalMedicine' | 'Missing' | 'Other' | 'Surgery';
  diag_1: 'Circulatory' | 'Diabetes' | 'Digestive' | 'Injury' | 'Missing' | 'Musculoskeletal' | 'Other' | 'Respiratory';
  diag_2: 'Circulatory' | 'Diabetes' | 'Digestive' | 'Injury' | 'Missing' | 'Musculoskeletal' | 'Other' | 'Respiratory';
  diag_3: 'Circulatory' | 'Diabetes' | 'Digestive' | 'Injury' | 'Missing' | 'Musculoskeletal' | 'Other' | 'Respiratory';
  glucose_test: 'no' | 'normal' | 'high';
  A1Ctest: 'no' | 'normal' | 'high';
  change: 'no' | 'yes';
  diabetes_med: 'no' | 'yes';
}

export interface PatientResponse extends PatientInput {
  id: number;
  patient_reference: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureExplanation {
  feature: string;
  value: any;
  impact: 'positive' | 'negative';
  importance: number;
}

export interface PredictionResponse {
  prediction: number;
  readmission_probability: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  threshold: number;
  top_contributing_features: FeatureExplanation[];
  model_version: string;
  disclaimer: string;
}

export interface PredictionHistory {
  id: number;
  patient_id: number;
  patient_reference?: string; // from joined aggregates
  readmission_probability: number;
  prediction: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  threshold: number;
  model_version: string;
  created_at: string;
  explanations?: FeatureExplanation[];
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  database_connected: boolean;
}

export interface ModelInfo {
  model_type: string;
  threshold: number;
  best_hyperparameters: Record<string, any>;
  cross_validation_metrics: {
    mean_accuracy: number;
    mean_precision: number;
    mean_recall: number;
    mean_f1: number;
    mean_roc_auc: number;
    mean_pr_auc: number;
    [key: string]: number;
  };
  feature_info: {
    numerical_features: string[];
    categorical_features: string[];
    [key: string]: string[];
  };
  model_version: string;
}

export interface DashboardSummary {
  total_predictions: number;
  high_risk_patients: number;
  moderate_risk_patients: number;
  low_risk_patients: number;
  average_probability: number;
  recent_predictions: Array<{
    id: number;
    patient_id: number;
    patient_reference: string;
    readmission_probability: number;
    prediction: number;
    risk_level: 'LOW' | 'MODERATE' | 'HIGH';
    created_at: string;
  }>;
}
