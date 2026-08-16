export * from '../services/api';

import {
  getHealth as fetchHealth,
  getModelMetrics as fetchModelMetrics,
  getPatients as fetchPatients,
  predictPatient as predictSingle,
  predictBatch
} from '../services/api';

export {
  fetchHealth,
  fetchModelMetrics,
  fetchPatients,
  predictSingle,
  predictBatch
};
