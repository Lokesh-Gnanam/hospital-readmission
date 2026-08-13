import type { PatientInput, PatientResponse, PredictionResponse, DashboardSummary, ModelInfo, HealthResponse } from '../types';

// Reads from Vite environment variable or defaults to local FastAPI port
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorDetail = 'API Request failed';
    try {
      const parsed = JSON.parse(errorText);
      errorDetail = parsed.detail || errorDetail;
    } catch {
      errorDetail = errorText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const apiService = {
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE_URL}/model/info`);
    return handleResponse<ModelInfo>(res);
  },

  async predictReadmission(patient: PatientInput): Promise<PredictionResponse> {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patient),
    });
    return handleResponse<PredictionResponse>(res);
  },

  async listPatients(skip = 0, limit = 50): Promise<PatientResponse[]> {
    const res = await fetch(`${API_BASE_URL}/patients?skip=${skip}&limit=${limit}`);
    return handleResponse<PatientResponse[]>(res);
  },

  async getPatient(id: number): Promise<PatientResponse> {
    const res = await fetch(`${API_BASE_URL}/patients/${id}`);
    return handleResponse<PatientResponse>(res);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE_URL}/dashboard/summary`);
    return handleResponse<DashboardSummary>(res);
  },

  async getModelPerformance(): Promise<Record<string, number>> {
    const res = await fetch(`${API_BASE_URL}/dashboard/model-performance`);
    return handleResponse<Record<string, number>>(res);
  }
};
