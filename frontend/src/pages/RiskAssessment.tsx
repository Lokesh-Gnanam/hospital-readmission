import React, { useState } from 'react';
import { apiService } from '../services/api';
import type { PatientInput, PredictionResponse } from '../types';
import { AlertCircle } from 'lucide-react';

interface RiskAssessmentProps {
  onPredictionResult: (result: PredictionResponse) => void;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ onPredictionResult }) => {
  const defaultPatient: PatientInput = {
    time_in_hospital: 4,
    n_lab_procedures: 40,
    n_procedures: 1,
    n_medications: 15,
    n_outpatient: 0,
    n_inpatient: 0,
    n_emergency: 0,
    age: '[60-70)',
    medical_specialty: 'InternalMedicine',
    diag_1: 'Circulatory',
    diag_2: 'Diabetes',
    diag_3: 'Other',
    glucose_test: 'no',
    A1Ctest: 'no',
    change: 'no',
    diabetes_med: 'yes',
  };

  const [form, setForm] = useState<PatientInput>({ ...defaultPatient });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['time_in_hospital', 'n_lab_procedures', 'n_procedures', 'n_medications', 'n_outpatient', 'n_inpatient', 'n_emergency'].includes(name);
    
    setForm(prev => ({
      ...prev,
      [name]: isNumeric ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.predictReadmission(form);
      onPredictionResult(data);
    } catch (err: any) {
      setError(err.message || 'Prediction execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Patient Risk Assessment</h2>
        <p className="text-slate-400 text-sm mt-1">
          Perform a readmission evaluation by submitting the de-identified clinical encounter details below.
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/20 border border-rose-800/80 p-4 rounded-lg flex items-center gap-3 text-rose-300 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#1e293b] border border-slate-800 rounded-xl p-8 shadow-md space-y-8">
        
        {/* Section 1: Encounter Complexity Metrics */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2 mb-6">
            1. Encounter Metrics & Complexity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Length of Stay (days)</label>
              <input 
                type="number" 
                name="time_in_hospital" 
                value={form.time_in_hospital} 
                onChange={handleInputChange}
                min={1} max={14} required
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Allowed: 1 to 14 days</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Lab Procedures performed</label>
              <input 
                type="number" 
                name="n_lab_procedures" 
                value={form.n_lab_procedures} 
                onChange={handleInputChange}
                min={1} max={113} required
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Allowed: 1 to 113</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Other Procedures performed</label>
              <input 
                type="number" 
                name="n_procedures" 
                value={form.n_procedures} 
                onChange={handleInputChange}
                min={0} max={6} required
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Allowed: 0 to 6</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Medications Prescribed</label>
              <input 
                type="number" 
                name="n_medications" 
                value={form.n_medications} 
                onChange={handleInputChange}
                min={1} max={79} required
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Allowed: 1 to 79</span>
            </div>
          </div>
        </div>

        {/* Section 2: Patient History */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2 mb-6">
            2. Prior Healthcare Utilization & Age
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Outpatient Visits (prior year)</label>
              <input 
                type="number" 
                name="n_outpatient" 
                value={form.n_outpatient} 
                onChange={handleInputChange}
                min={0} max={33} required
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Allowed: 0 to 33</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Inpatient Admissions (prior year)</label>
              <input 
                type="number" 
                name="n_inpatient" 
                value={form.n_inpatient} 
                onChange={handleInputChange}
                min={0} max={15} required
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Allowed: 0 to 15</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Emergency Visits (prior year)</label>
              <input 
                type="number" 
                name="n_emergency" 
                value={form.n_emergency} 
                onChange={handleInputChange}
                min={0} max={64} required
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Allowed: 0 to 64</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Patient Age Bracket</label>
              <select 
                name="age" 
                value={form.age} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="[40-50)">40 - 50 years</option>
                <option value="[50-60)">50 - 60 years</option>
                <option value="[60-70)">60 - 70 years</option>
                <option value="[70-80)">70 - 80 years</option>
                <option value="[80-90)">80 - 90 years</option>
                <option value="[90-100)">90 - 100 years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Diagnostic Categories & Admitting Specialty */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2 mb-6">
            3. Clinical Specialties & Diagnoses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Admitting Specialty</label>
              <select 
                name="medical_specialty" 
                value={form.medical_specialty} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="InternalMedicine">Internal Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Emergency/Trauma">Emergency / Trauma</option>
                <option value="Family/GeneralPractice">Family / General Practice</option>
                <option value="Surgery">Surgery</option>
                <option value="Other">Other Specialty</option>
                <option value="Missing">Missing / Not Documented</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Primary Diagnosis (Diag 1)</label>
              <select 
                name="diag_1" 
                value={form.diag_1} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Circulatory">Circulatory (Heart/Vascular)</option>
                <option value="Respiratory">Respiratory (Lung)</option>
                <option value="Digestive">Digestive (GI/Stomach)</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Injury">Injury / Trauma</option>
                <option value="Musculoskeletal">Musculoskeletal</option>
                <option value="Other">Other Diagnosis</option>
                <option value="Missing">Missing</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Secondary Diagnosis (Diag 2)</label>
              <select 
                name="diag_2" 
                value={form.diag_2} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Circulatory">Circulatory (Heart/Vascular)</option>
                <option value="Respiratory">Respiratory (Lung)</option>
                <option value="Digestive">Digestive (GI/Stomach)</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Injury">Injury / Trauma</option>
                <option value="Musculoskeletal">Musculoskeletal</option>
                <option value="Other">Other Diagnosis</option>
                <option value="Missing">Missing</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Tertiary Diagnosis (Diag 3)</label>
              <select 
                name="diag_3" 
                value={form.diag_3} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Other">Other Diagnosis</option>
                <option value="Circulatory">Circulatory (Heart/Vascular)</option>
                <option value="Respiratory">Respiratory (Lung)</option>
                <option value="Digestive">Digestive (GI/Stomach)</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Injury">Injury / Trauma</option>
                <option value="Musculoskeletal">Musculoskeletal</option>
                <option value="Missing">Missing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Diabetic medications */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2 mb-6">
            4. Glucose Testing & Diabetic Medications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Glucose Test Result</label>
              <select 
                name="glucose_test" 
                value={form.glucose_test} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="no">Not Tested</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">A1C Test Result</label>
              <select 
                name="A1Ctest" 
                value={form.A1Ctest} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="no">Not Tested</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Medication Changed during stay?</label>
              <select 
                name="change" 
                value={form.change} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="no">No medication change</option>
                <option value="yes">Medication was changed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Prescribed Diabetic Meds?</label>
              <select 
                name="diabetes_med" 
                value={form.diabetes_med} 
                onChange={handleInputChange}
                className="w-full bg-[#131b2e] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="yes">Prescribed</option>
                <option value="no">Not prescribed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-8 py-3 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-900/20"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running ML Inference...</span>
              </>
            ) : (
              <span>Evaluate 30-Day Readmission Risk</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default RiskAssessment;
