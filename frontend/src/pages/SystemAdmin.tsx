import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Database,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Table,
  RefreshCw,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  fetchDatasetInfo,
  uploadDataset,
  fetchPatients,
  deletePatient,
  fetchPredictions,
  deletePrediction
} from '../api/client';
import type { DatasetInfoResponse, PatientRecord } from '../types';

export const SystemAdmin: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dataset' | 'database'>('dataset');

  // Dataset State
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfoResponse | null>(null);
  const [datasetLoading, setDatasetLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<{
    filename: string;
    rows: number;
    columns: number;
    columnNames: string[];
    targetExists: boolean;
    missingFeatures: string[];
    previewRows: Record<string, string>[];
    isValid: boolean;
  } | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Database Audit Log State
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load Active Dataset Info
  const loadDatasetMetadata = async () => {
    setDatasetLoading(true);
    try {
      const res = await fetchDatasetInfo();
      setDatasetInfo(res);
    } catch (err: any) {
      console.error('Error fetching dataset metadata:', err);
      setDatasetInfo(null);
    } finally {
      setDatasetLoading(false);
    }
  };

  // Load Database Records
  const loadDatabaseRecords = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const patientRes = await fetchPatients(1, 100);
      const predRes = await fetchPredictions();
      setPatients(patientRes.patients || []);
      setPredictions(predRes || []);
    } catch (err: any) {
      console.error('Error fetching database records:', err);
      setDbError('Failed to sync database audit log. Verify PostgreSQL container status.');
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'dataset') {
      loadDatasetMetadata();
    } else {
      loadDatabaseRecords();
    }
  }, [activeSubTab]);

  // Local File parsing for preview & validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadStatus({ type: 'error', message: 'Only CSV files (.csv) are supported.' });
      return;
    }

    setSelectedFile(file);
    setUploadStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) {
          throw new Error('CSV file is empty.');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Validation Checks
        const targetExists = headers.includes('readmitted');
        
        const requiredFeatures = [
          "time_in_hospital", "n_lab_procedures", "n_procedures", "n_medications",
          "n_outpatient", "n_inpatient", "n_emergency", "age", "medical_specialty",
          "diag_1", "diag_2", "diag_3", "glucose_test", "A1Ctest", "change", "diabetes_med"
        ];
        const missingFeatures = requiredFeatures.filter(f => !headers.includes(f));
        const isValid = targetExists && missingFeatures.length === 0;

        // Parse first 5 preview rows
        const previewRows: Record<string, string>[] = [];
        const maxPreview = Math.min(6, lines.length); // header + 5 rows
        for (let i = 1; i < maxPreview; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || '';
          });
          previewRows.push(rowObj);
        }

        // Estimate row count
        const rowsCount = lines.length - 1;

        setLocalPreview({
          filename: file.name,
          rows: rowsCount,
          columns: headers.length,
          columnNames: headers,
          targetExists,
          missingFeatures,
          previewRows,
          isValid
        });
      } catch (err: any) {
        setUploadStatus({ type: 'error', message: `Failed to parse file: ${err.message}` });
        setSelectedFile(null);
        setLocalPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Perform backend CSV Upload
  const handleUploadConfirm = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadStatus(null);
    try {
      await uploadDataset(selectedFile);
      setUploadStatus({ type: 'success', message: 'Active CSV dataset replaced successfully!' });
      setSelectedFile(null);
      setLocalPreview(null);
      loadDatasetMetadata();
    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to replace CSV dataset on the server.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete patient record
  const handleDeletePatient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this patient record? This will cascade delete all associated predictions and SHAP explanations from PostgreSQL.')) return;
    try {
      await deletePatient(id);
      loadDatabaseRecords();
    } catch (err: any) {
      alert('Error deleting patient record: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Delete prediction run
  const handleDeletePrediction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prediction history item? This will cascade delete all associated explanations from PostgreSQL.')) return;
    try {
      await deletePrediction(id);
      loadDatabaseRecords();
    } catch (err: any) {
      alert('Error deleting prediction record: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#12213A] tracking-tight flex items-center space-x-2">
            <span>System Administration Portal</span>
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Configure system CSV datasets and directly inspect and manage PostgreSQL databases.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 select-none shadow-inner">
          <button
            onClick={() => setActiveSubTab('dataset')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'dataset'
                ? 'bg-white text-[#12213A] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Dataset Management</span>
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'database'
                ? 'bg-white text-[#12213A] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Audit Log</span>
          </button>
        </div>
      </div>

      {/* CONTENT PANELS */}
      {activeSubTab === 'dataset' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Dataset Stats (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-sm text-[#12213A] uppercase tracking-wider">
                  Active Dataset Info
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              {datasetLoading ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-[10px] font-mono text-slate-400 mt-2">Loading dataset metadata...</p>
                </div>
              ) : datasetInfo ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 font-mono space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Filename:</span>
                      <strong className="text-[#12213A] font-bold">{datasetInfo.filename}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rows count:</span>
                      <strong className="text-[#12213A] font-bold">{datasetInfo.rows.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Columns count:</span>
                      <strong className="text-[#12213A] font-bold">{datasetInfo.columns}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Label:</span>
                      <strong className="text-[#12213A] font-bold">{datasetInfo.target}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Size (bytes):</span>
                      <strong className="text-[#12213A] font-bold">{datasetInfo.size_bytes.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last updated: {datasetInfo.last_updated}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs space-y-1">
                  <p className="font-semibold">No active CSV dataset found.</p>
                  <p className="text-[10px] text-red-700 leading-tight">Please upload a valid hospital_readmissions.csv file to restore prediction sources.</p>
                </div>
              )}
            </div>

            {/* Model & Dataset Separation Warning Card */}
            <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Model/Dataset Separation:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                Dataset replacement updates the active research dataset only. It does not retrain or replace the deployed prediction model.
              </p>
              <p className="text-[10px] text-slate-400 font-mono italic">
                Deployed Classifier: Tuned XGBoost Pipeline (0.30 threshold).
              </p>
            </div>
          </div>

          {/* Upload and Preview Panel (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Upload Area */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-[#12213A] border-b border-slate-100 pb-2 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>Upload Replacement CSV Dataset</span>
              </h3>

              <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors relative cursor-pointer group">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-teal-600 mx-auto transition-colors" />
                <div className="text-xs font-semibold text-[#12213A] group-hover:text-teal-700 transition-colors">
                  Click to select replacement CSV or drag and drop here
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Enforces target schema validation (max size: 10MB)
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Status messages */}
              {uploadStatus && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{uploadStatus.message}</span>
                </div>
              )}
            </div>

            {/* CSV File Validation and Preview */}
            {localPreview && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-sm text-[#12213A]">
                      Dataset Validation & Preview
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      File: {localPreview.filename} ({localPreview.rows.toLocaleString()} rows, {localPreview.columns} columns)
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1 ${
                    localPreview.isValid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {localPreview.isValid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid Schema</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Schema Mismatch</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Validation errors */}
                {!localPreview.isValid && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2 text-red-900">
                    <p className="font-bold flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Schema validation failed. Replacement blocked.</span>
                    </p>
                    <ul className="list-disc pl-5 font-mono text-[10px] space-y-1">
                      {!localPreview.targetExists && (
                        <li>Missing required target label column: <strong>'readmitted'</strong></li>
                      )}
                      {localPreview.missingFeatures.map(feat => (
                        <li key={feat}>Missing required input feature: <strong>'{feat}'</strong></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preview Table */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                    <Table className="w-4 h-4 text-slate-400" />
                    <span>CSV Head Preview (First 5 Rows):</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left font-mono text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                          <th className="p-2 border-r border-slate-200">Row</th>
                          {localPreview.columnNames.slice(0, 8).map(col => (
                            <th key={col} className="p-2 border-r border-slate-200 min-w-[120px]">{col}</th>
                          ))}
                          {localPreview.columnNames.length > 8 && (
                            <th className="p-2 text-slate-400 italic">+{localPreview.columnNames.length - 8} more cols</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {localPreview.previewRows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold text-center">{rowIdx + 1}</td>
                            {localPreview.columnNames.slice(0, 8).map(col => (
                              <td key={col} className="p-2 border-r border-slate-200 text-slate-800">{row[col]}</td>
                            ))}
                            {localPreview.columnNames.length > 8 && (
                              <td className="p-2 text-slate-400 italic">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setLocalPreview(null);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUploadConfirm}
                    disabled={uploading || !localPreview.isValid}
                    className="px-4 py-2 bg-[#12213A] hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-2 transition-all"
                  >
                    {uploading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving active CSV...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <span>Confirm and Replace Active CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DATABASE AUDIT LOG VIEW */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-[#12213A] flex items-center space-x-2">
                <Database className="w-5 h-5 text-teal-600 animate-pulse" />
                <span>PostgreSQL DB Audit Log Explorer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect and purge database records for patients, prediction histories, and SHAP explanation sets.
              </p>
            </div>

            <button
              onClick={loadDatabaseRecords}
              disabled={dbLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* Database Error Alert */}
          {dbError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-900 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{dbError}</span>
            </div>
          )}

          {dbLoading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-mono text-slate-500">Querying PostgreSQL schema tables...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Patients Table */}
              <div className="space-y-3 border border-slate-150 rounded-2xl p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#12213A] flex items-center space-x-1.5">
                    <span>Patients Table ({patients.length})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">table: patients</span>
                </div>

                <div className="overflow-y-auto max-h-96 border border-slate-200 rounded-xl">
                  {patients.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 italic font-sans">No patient records in database.</div>
                  ) : (
                    <table className="w-full text-left font-mono text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold sticky top-0">
                          <th className="p-2.5">DB ID</th>
                          <th className="p-2.5">Reference</th>
                          <th className="p-2.5">Specialty</th>
                          <th className="p-2.5">Age</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patients.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">{p.id}</td>
                            <td className="p-2.5 text-teal-700 font-bold">{p.patient_reference || (p as any).id}</td>
                            <td className="p-2.5 text-slate-700 truncate max-w-[120px]">{p.medical_specialty}</td>
                            <td className="p-2.5 text-slate-500">{p.age}</td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeletePatient(p.id as any)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Delete patient (cascades predictions)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Column 2: Predictions & Explanations Table */}
              <div className="space-y-3 border border-slate-150 rounded-2xl p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#12213A] flex items-center space-x-1.5">
                    <span>Predictions Table ({predictions.length})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">table: predictions</span>
                </div>

                <div className="overflow-y-auto max-h-96 border border-slate-200 rounded-xl">
                  {predictions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 italic font-sans">No prediction history in database.</div>
                  ) : (
                    <table className="w-full text-left font-mono text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold sticky top-0">
                          <th className="p-2.5">DB ID</th>
                          <th className="p-2.5">Patient ID</th>
                          <th className="p-2.5">Prob</th>
                          <th className="p-2.5">Risk Level</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {predictions.map(pred => (
                          <tr key={pred.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">{pred.id}</td>
                            <td className="p-2.5 text-slate-700 font-bold">PT-{pred.patient_id}</td>
                            <td className="p-2.5 text-[#12213A] font-bold">{Math.round(pred.readmission_probability * 100)}%</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold border uppercase ${
                                pred.risk_level === 'HIGH'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : pred.risk_level === 'MODERATE'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {pred.risk_level}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeletePrediction(pred.id)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Delete prediction (cascades explanations)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dev Notice Footer */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="font-sans">
              To inspect raw table contents and run manual SQL queries directly against the PostgreSQL engine inside Docker, access the database manager dashboard on port 5050 at <a href="http://localhost:5050" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline font-mono inline-flex items-center space-x-0.5"><span>http://localhost:5050</span><ExternalLink className="w-3 h-3" /></a> using default email <strong>admin@vitals.com</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdmin;
