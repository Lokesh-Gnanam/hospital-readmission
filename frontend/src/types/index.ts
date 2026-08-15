export interface PatientInput {
  time_in_hospital: number;
  n_lab_procedures: number;
  n_procedures: number;
  n_medications: number;
  n_outpatient: number;
  n_inpatient: number;
  n_emergency: number;
  age: string;
  medical_specialty: string;
  diag_1: string;
  diag_2: string;
  diag_3: string;
  glucose_test: string;
  A1Ctest: string;
  change: string;
  diabetes_med: string;
}

export interface BackendShapDriver {
  feature: string;
  shap_value?: number;
  direction?: string;
  plain_language_driver?: string;
  plain_language?: string;
  impact_direction?: 'increase' | 'decrease';
  magnitude?: number;
}

export interface PreventiveAction {
  id?: string;
  title: string;
  reason: string;
  priority: 'High' | 'Medium' | 'Routine' | string;
  category?: string;
}

export interface PatientRecord extends PatientInput {
  id: string; // PT-10001+
  patient_id?: string;
  raw_id?: number;
  readmission_probability: number;
  clinical_risk_tier: 'High Risk' | 'Moderate Risk' | 'Low Risk' | string;
  primary_driver: string;
  top_3_shap_drivers?: BackendShapDriver[];
  preventive_actions?: PreventiveAction[];
}

export interface PatientsResponse {
  patients: PatientRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  model_name: string;
  version?: string;
  operating_threshold: number;
  database_connected?: boolean;
}

export interface PredictionResult {
  readmission_probability: number;
  predicted_readmitted?: string;
  clinical_risk_tier: 'High Risk' | 'Moderate Risk' | 'Low Risk' | string;
  top_3_shap_drivers: BackendShapDriver[];
  preventive_actions: PreventiveAction[];
  operating_threshold?: number;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface EvaluationMetricsOOF {
  threshold?: number;
  roc_auc: number;
  pr_auc: number;
  f1_score: number;
  recall_positive: number;
  precision_positive: number;
  avg_cost_per_patient: number;
  confusion_matrix: ConfusionMatrix;
  total_cost?: number;
}

export interface ROCCurvePoint {
  fpr: number;
  tpr: number;
  threshold?: number;
}

export interface CandidateModelResult {
  model_name: string;
  architecture: string;
  roc_auc: number;
  pr_auc: number;
  f1_score: number;
  recall_positive: number;
  precision_positive: number;
  cost_cutoff: number;
  avg_cost_per_patient: number;
  is_selected: boolean;
}

export interface ModelMetricsResponse {
  model_name?: string;
  version?: string;
  timestamp?: string;
  dataset_rows: number;
  optimal_threshold: number;
  cost_parameters?: { cost_fn: number; cost_fp: number };
  evaluation_metrics_oof: EvaluationMetricsOOF;
  roc_curve_points: ROCCurvePoint[];
  all_model_results_oof: Record<string, EvaluationMetricsOOF> | CandidateModelResult[];
  num_transformed_features?: number;
}
