export * from '../services/api';

import {
  getHealth as fetchHealth,
  getModelMetrics as fetchModelMetrics,
  getPatients as fetchPatients,
  predictPatient as predictSingle,
  predictBatch,
  deletePatient,
  fetchPredictions,
  deletePrediction,
  fetchDatasetInfo,
  uploadDataset,
  deleteDataset
} from '../services/api';

export {
  fetchHealth,
  fetchModelMetrics,
  fetchPatients,
  predictSingle,
  predictBatch,
  deletePatient,
  fetchPredictions,
  deletePrediction,
  fetchDatasetInfo,
  uploadDataset,
  deleteDataset
};
