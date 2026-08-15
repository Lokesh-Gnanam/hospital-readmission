import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Info,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import type { PatientInput, PredictionResult } from '../types';
import { predictSingle } from '../api/client';
import ScoreGauge from '../components/ScoreGauge';

export const NewAssessment: React.FC = () => {
  // Form State matching Screenshot 1 initial values (Low Risk Post-Op / Demographics sample)
  const [formData, setFormData] = useState<PatientInput>({
    age: '[40-50)',
    time_in_hospital: 1,
    medical_specialty: 'Other',
    n_inpatient: 0,
    n_emergency: 0,
    n_outpatient: 0,
    diag_1: 'Other',
    diag_2: 'Other',
    diag_3: 'Other',
    n_medications: 2,
    n_lab_procedures: 4,
    n_procedures: 1,
    glucose_test: 'normal',
    A1Ctest: 'normal',
    change: 'no',
    diabetes_med: 'yes'
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Automatically run initial assessment on mount to populate assessment output like Screenshot 1
  useEffect(() => {
    runAssessment(formData);
  }, []);

  // Presets trigger real backend prediction
  const applyPreset = (presetType: 'cardiac' | 'respiratory' | 'postop') => {
    let preset: PatientInput;

    if (presetType === 'cardiac') {
      preset = {
        age: '[80-90)',
        time_in_hospital: 8,
        medical_specialty: 'Cardiology',
        n_inpatient: 4,
        n_emergency: 3,
        n_outpatient: 1,
        n_medications: 26,
        n_lab_procedures: 68,
        n_procedures: 3,
        diag_1: 'Circulatory',
        diag_2: 'Diabetes',
        diag_3: 'Respiratory',
        glucose_test: 'high',
        A1Ctest: 'no',
        change: 'yes',
        diabetes_med: 'yes'
      };
    } else if (presetType === 'respiratory') {
      preset = {
        age: '[60-70)',
        time_in_hospital: 4,
        medical_specialty: 'InternalMedicine',
        n_inpatient: 1,
        n_emergency: 0,
        n_outpatient: 0,
        n_medications: 12,
        n_lab_procedures: 42,
        n_procedures: 1,
        diag_1: 'Respiratory',
        diag_2: 'Circulatory',
        diag_3: 'Diabetes',
        glucose_test: 'normal',
        A1Ctest: 'normal',
        change: 'no',
        diabetes_med: 'yes'
      };
    } else {
      preset = {
        age: '[40-50)',
        time_in_hospital: 1,
        medical_specialty: 'Other',
        n_inpatient: 0,
        n_emergency: 0,
        n_outpatient: 0,
        n_medications: 2,
        n_lab_procedures: 4,
        n_procedures: 1,
        diag_1: 'Other',
        diag_2: 'Other',
        diag_3: 'Other',
        glucose_test: 'normal',
        A1Ctest: 'normal',
        change: 'no',
        diabetes_med: 'yes'
      };
    }

    setFormData(preset);
    runAssessment(preset);
  };

  const handleInputChange = (field: keyof PatientInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAssessment(formData);
  };

  const runAssessment = async (input: PatientInput) => {
    setLoading(true);
    try {
      const res = await predictSingle(input);
      setPrediction(res);
    } catch (err) {
      console.error('Error running assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-[#12213A]" />
            <h1 className="font-display font-extrabold text-2xl text-[#12213A] tracking-tight">
              New Patient Assessment
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Input structured patient clinical parameters to calculate real-time readmission risk probability and SHAP drivers.
          </p>
        </div>

        {/* Clinical Presets */}
        <div className="flex items-center space-x-2 flex-wrap shrink-0">
          <span className="text-xs font-mono font-semibold text-slate-400 mr-1 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('cardiac')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold font-mono transition-colors cursor-pointer border border-slate-200"
          >
            High Risk Cardiac
          </button>
          <button
            type="button"
            onClick={() => applyPreset('respiratory')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold font-mono transition-colors cursor-pointer border border-slate-200"
          >
            Moderate Risk Respiratory
          </button>
          <button
            type="button"
            onClick={() => applyPreset('postop')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold font-mono transition-colors cursor-pointer border border-slate-200"
          >
            Low Risk Post-Op
          </button>
        </div>
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Section 1: Patient Demographics & History */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-[#12213A] border-b border-slate-100 pb-2">
              Patient Demographics & History
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age Bracket</label>
                <select
                  value={formData.age}
                  onChange={e => handleInputChange('age', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="[40-50)">[40-50)</option>
                  <option value="[50-60)">[50-60)</option>
                  <option value="[60-70)">[60-70)</option>
                  <option value="[70-80)">[70-80)</option>
                  <option value="[80-90)">[80-90)</option>
                  <option value="[90-100)">[90-100)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stay Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={formData.time_in_hospital}
                  onChange={e => handleInputChange('time_in_hospital', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Specialty</label>
                <select
                  value={formData.medical_specialty}
                  onChange={e => handleInputChange('medical_specialty', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-sans text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="InternalMedicine">Internal Medicine</option>
                  <option value="Emergency/Trauma">Emergency / Trauma</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Family/GeneralPractice">Family / General Practice</option>
                  <option value="Other">Other</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Prior Health System Utilization */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-[#12213A] border-b border-slate-100 pb-2">
              Prior Health System Utilization
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prior Inpatient</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={formData.n_inpatient}
                  onChange={e => handleInputChange('n_inpatient', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prior Emergency</label>
                <input
                  type="number"
                  min={0}
                  max={64}
                  value={formData.n_emergency}
                  onChange={e => handleInputChange('n_emergency', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prior Outpatient</label>
                <input
                  type="number"
                  min={0}
                  max={33}
                  value={formData.n_outpatient}
                  onChange={e => handleInputChange('n_outpatient', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Diagnoses & Inpatient Care */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-[#12213A] border-b border-slate-100 pb-2">
              Diagnoses & Inpatient Care
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Diagnosis</label>
                <select
                  value={formData.diag_1}
                  onChange={e => handleInputChange('diag_1', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-sans text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Circulatory">Circulatory</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Digestive">Digestive</option>
                  <option value="Injury">Injury</option>
                  <option value="Musculoskeletal">Musculoskeletal</option>
                  <option value="Other">Other</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Diagnosis</label>
                <select
                  value={formData.diag_2}
                  onChange={e => handleInputChange('diag_2', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-sans text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Circulatory">Circulatory</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Digestive">Digestive</option>
                  <option value="Injury">Injury</option>
                  <option value="Musculoskeletal">Musculoskeletal</option>
                  <option value="Other">Other</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comorbid Diagnosis</label>
                <select
                  value={formData.diag_3}
                  onChange={e => handleInputChange('diag_3', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-sans text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Circulatory">Circulatory</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Digestive">Digestive</option>
                  <option value="Injury">Injury</option>
                  <option value="Musculoskeletal">Musculoskeletal</option>
                  <option value="Other">Other</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medications</label>
                <input
                  type="number"
                  min={1}
                  max={79}
                  value={formData.n_medications}
                  onChange={e => handleInputChange('n_medications', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lab Tests</label>
                <input
                  type="number"
                  min={1}
                  max={113}
                  value={formData.n_lab_procedures}
                  onChange={e => handleInputChange('n_lab_procedures', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Glucose Test</label>
                <select
                  value={formData.glucose_test}
                  onChange={e => handleInputChange('glucose_test', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-sans text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="no">no</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">A1C Test</label>
                <select
                  value={formData.A1Ctest}
                  onChange={e => handleInputChange('A1Ctest', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-sans text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="no">no</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#12213A] hover:bg-slate-800 text-white font-semibold text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer mt-4"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Executing XGBoost Model Inference...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
                <span>Run Readmission Risk Assessment</span>
              </span>
            )}
          </button>
        </form>

        {/* Right Assessment Result Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display font-bold text-base text-[#12213A]">
                Assessment Result
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Real-Data Model Output
              </span>
            </div>

            {prediction && (
              <>
                {/* Visual Gauge */}
                <ScoreGauge
                  probability={prediction.readmission_probability}
                  cutoff={prediction.operating_threshold || 0.2562}
                  variant="full"
                />

                {/* Top 3 SHAP Risk Drivers */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#12213A]">
                    Top 3 SHAP Risk Drivers
                  </h3>

                  <div className="space-y-3">
                    {prediction.top_3_shap_drivers.slice(0, 3).map((driver, idx) => {
                      const isIncrease = driver.impact_direction === 'increase';
                      const shapVal = driver.magnitude ? (isIncrease ? driver.magnitude : -driver.magnitude) : 0.15;
                      const formattedScore = `${isIncrease ? '+' : ''}${shapVal.toFixed(3)}`;

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center space-x-1.5 font-medium text-slate-800">
                              {isIncrease ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              )}
                              <span className="truncate max-w-[210px]" title={driver.plain_language}>
                                {driver.plain_language}
                              </span>
                            </span>
                            <span className={`font-mono font-bold ${isIncrease ? 'text-red-600' : 'text-slate-600'}`}>
                              {formattedScore}
                            </span>
                          </div>

                          {/* Indicator Bar matching Screenshot 1 */}
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isIncrease ? 'bg-red-500' : 'bg-slate-500'}`}
                              style={{ width: `${Math.min(100, Math.max(20, Math.abs(shapVal) * 180))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Suggested Preventive Actions */}
                {prediction.preventive_actions && prediction.preventive_actions.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#12213A]">
                        Suggested Preventive Actions
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {prediction.preventive_actions.map((act, idx) => {
                        let prioBadge = 'bg-slate-100 text-slate-800 border-slate-200';
                        if (act.priority === 'High') prioBadge = 'bg-red-50 text-red-900 border-red-200';
                        if (act.priority === 'Medium') prioBadge = 'bg-amber-50 text-amber-900 border-amber-200';
                        if (act.priority === 'Routine') prioBadge = 'bg-blue-50 text-blue-900 border-blue-200';

                        return (
                          <div key={idx} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#12213A] flex items-center space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span>{act.title}</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${prioBadge}`}>
                                {act.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                              {act.reason}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mandatory Disclaimer */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="font-sans leading-tight">
                    Preventive actions are decision-support suggestions for clinician consideration and are not medical diagnoses or treatment instructions.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAssessment;
