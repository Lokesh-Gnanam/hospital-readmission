import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { PatientResponse } from '../types';
import { FileClock, Search, AlertCircle, X, Check, Eye } from 'lucide-react';

interface HistoryProps {
  selectedPatientId: number | null;
  onClearSelectedPatient: () => void;
}

export const PatientHistory: React.FC<HistoryProps> = ({ selectedPatientId, onClearSelectedPatient }) => {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected detail modal
  const [activePatient, setActivePatient] = useState<PatientResponse | null>(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await apiService.listPatients(0, 100);
        setPatients(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load patients list');
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, []);

  // Handle selected patient ID from dashboard
  useEffect(() => {
    if (selectedPatientId && patients.length > 0) {
      const match = patients.find(p => p.id === selectedPatientId);
      if (match) {
        handleViewPatient(match);
      }
    }
  }, [selectedPatientId, patients]);

  const handleViewPatient = (patient: PatientResponse) => {
    setActivePatient(patient);
  };

  const handleCloseDetail = () => {
    setActivePatient(null);
    onClearSelectedPatient();
  };

  // Filter list by patient reference search
  const filteredPatients = patients.filter(p => 
    p.patient_reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading audit registers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-800 p-6 rounded-xl flex items-center gap-4 text-rose-300">
        <AlertCircle className="w-10 h-10 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Database error</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const renderClinicalField = (label: string, val: any) => (
    <div className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-0.5">
      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-slate-200">{val}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Patient Audit History</h2>
        <p className="text-slate-400 text-sm mt-1">
          Historical log of patient records in the PostgreSQL database.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by Patient Reference (e.g. PT-XXXXXX)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e293b] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredPatients.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase bg-slate-900/30">
                <th className="py-4 px-6">Patient Reference</th>
                <th className="py-4 px-6">Age</th>
                <th className="py-4 px-6">Length of stay</th>
                <th className="py-4 px-6">Lab Procedures</th>
                <th className="py-4 px-6">Diabetic Meds</th>
                <th className="py-4 px-6">Registration Date</th>
                <th className="py-4 px-6 text-right">Audit</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs text-slate-300">{patient.patient_reference}</td>
                  <td className="py-4 px-6 text-slate-200">{patient.age}</td>
                  <td className="py-4 px-6 text-slate-200">{patient.time_in_hospital} days</td>
                  <td className="py-4 px-6 text-slate-200">{patient.n_lab_procedures}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      patient.diabetes_med === 'yes'
                        ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900'
                        : 'text-slate-400 bg-slate-800/20 border-slate-700'
                    }`}>
                      {patient.diabetes_med === 'yes' ? <Check className="w-3 h-3" /> : null}
                      {patient.diabetes_med === 'yes' ? 'Prescribed' : 'No'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-400">
                    {new Date(patient.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleViewPatient(patient)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-900/60 hover:border-blue-900 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Features
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center gap-3">
            <FileClock className="w-12 h-12 text-slate-700" />
            <div>
              <h4 className="font-semibold text-slate-400">No patient records matched</h4>
              <p className="text-xs text-slate-500 mt-1">
                Perform a prediction assessment or check your search term spelling.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over details drawer (clinical audit panel) */}
      {activePatient && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop closer click */}
          <div className="absolute inset-0" onClick={handleCloseDetail} />
          
          <div className="w-full max-w-xl bg-[#131b2e] border-l border-slate-850 h-full flex flex-col relative shadow-2xl z-10 animate-slideLeft overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">Patient Encounter Audit</h3>
                <span className="text-xs font-mono text-slate-400">Ref: {activePatient.patient_reference}</span>
              </div>
              <button 
                onClick={handleCloseDetail}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              
              {/* Registration Meta */}
              <div className="text-xs text-slate-500 bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-1">
                <div className="flex justify-between">
                  <span>Record Database ID:</span>
                  <span className="font-mono text-slate-400">{activePatient.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registered Timestamp:</span>
                  <span className="text-slate-400">{new Date(activePatient.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Clinical features grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">1. Encounter Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderClinicalField('Length of Hospital Stay', `${activePatient.time_in_hospital} days`)}
                  {renderClinicalField('Lab Procedures Count', activePatient.n_lab_procedures)}
                  {renderClinicalField('Other Procedures Count', activePatient.n_procedures)}
                  {renderClinicalField('Medications Count', activePatient.n_medications)}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">2. Medical History</h4>
                <div className="grid grid-cols-3 gap-4">
                  {renderClinicalField('Outpatient Visits', activePatient.n_outpatient)}
                  {renderClinicalField('Inpatient Visits', activePatient.n_inpatient)}
                  {renderClinicalField('Emergency Visits', activePatient.n_emergency)}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">3. Diagnostic Coding & Specialty</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderClinicalField('Admitting Medical Specialty', activePatient.medical_specialty)}
                  {renderClinicalField('Patient Age bracket', activePatient.age)}
                  {renderClinicalField('Primary Diagnosis (Diag 1)', activePatient.diag_1)}
                  {renderClinicalField('Secondary Diagnosis (Diag 2)', activePatient.diag_2)}
                  {renderClinicalField('Tertiary Diagnosis (Diag 3)', activePatient.diag_3)}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">4. Diabetes Indicators</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderClinicalField('Glucose Test Result', activePatient.glucose_test)}
                  {renderClinicalField('A1C Test Result', activePatient.A1Ctest)}
                  {renderClinicalField('Medication Changed?', activePatient.change)}
                  {renderClinicalField('Prescribed Diabetic Meds?', activePatient.diabetes_med)}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PatientHistory;
