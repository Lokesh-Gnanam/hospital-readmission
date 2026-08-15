import React, { useEffect } from 'react';
import { X, AlertCircle, ArrowUpRight, ArrowDownRight, ShieldCheck, Activity, Stethoscope, FileText, CheckCircle2, Info } from 'lucide-react';
import type { PatientRecord } from '../types';
import ScoreGauge from './ScoreGauge';

interface PatientDetailProps {
  patient: PatientRecord;
  onClose: () => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onClose }) => {
  const prob = patient.readmission_probability ?? 0.15;
  const shapDrivers = patient.top_3_shap_drivers || [];
  const preventiveActions = patient.preventive_actions || [];

  // Keyboard shortcut listener to close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-50 h-screen shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#12213A] text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-mono font-bold text-xl text-white tracking-tight">
                  {patient.id}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-teal-300 border border-slate-700">
                  {patient.medical_specialty || 'General Practice'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Detailed Clinical Readmission Risk Evaluation & Audit Log
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Drawer (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Section 1: Full Score Gauge & Cohort Context */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-auto flex justify-center">
              <ScoreGauge probability={prob} variant="full" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <h3 className="font-display font-bold text-sm text-[#12213A] uppercase tracking-wider">
                  Cohort Risk Context
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                This patient's predicted readmission score of{' '}
                <strong className="font-mono text-[#12213A]">{(prob * 100).toFixed(1)}%</strong> is evaluated against the 25,000-record benchmark dataset operating cutoff (<strong className="font-mono text-slate-900">25.6%</strong>).
              </p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Demographic Age:</span>
                  <span className="font-bold text-[#12213A]">{patient.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Length of Stay:</span>
                  <span className="font-bold text-[#12213A]">{patient.time_in_hospital} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prior 12m ER Visits:</span>
                  <span className="font-bold text-[#12213A]">{patient.n_emergency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Top 3 SHAP Drivers */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="font-display font-bold text-sm text-[#12213A] uppercase tracking-wider">
                  Top 3 Plain-Language SHAP Risk Drivers
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Model Feature Attributions
              </span>
            </div>

            <div className="space-y-3">
              {shapDrivers.map((driver, idx) => {
                const isIncrease = driver.impact_direction === 'increase' || (driver as any).direction?.includes('Increase');
                const magPct = Math.round((driver.magnitude || 0.1) * 100);

                return (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 font-medium text-slate-800">
                        {isIncrease ? (
                          <span className="p-1 rounded bg-red-100 text-red-700">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="font-sans font-semibold text-[#12213A]">
                          {driver.plain_language || driver.plain_language_driver || driver.feature}
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${isIncrease ? 'text-red-700' : 'text-emerald-700'}`}>
                        {isIncrease ? `+${magPct}%` : `-${magPct}%`}
                      </span>
                    </div>

                    {/* Horizontal Bar Visualizer */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isIncrease ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(15, magPct * 3))}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Suggested Preventive Actions */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h3 className="font-display font-bold text-sm text-[#12213A] uppercase tracking-wider">
                Suggested Preventive Actions Panel
              </h3>
            </div>

            <div className="grid gap-3">
              {preventiveActions.map((action, idx) => {
                let prioBadge = 'bg-slate-100 text-slate-800 border-slate-200';
                if (action.priority === 'High') prioBadge = 'bg-red-50 text-red-900 border-red-200';
                if (action.priority === 'Medium') prioBadge = 'bg-amber-50 text-amber-900 border-amber-200';
                if (action.priority === 'Routine') prioBadge = 'bg-blue-50 text-blue-900 border-blue-200';

                return (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#12213A] flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>{action.title}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${prioBadge}`}>
                        {action.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5 leading-relaxed">
                      {action.reason}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="font-sans">
                Preventive actions are decision-support suggestions for clinician consideration and are not medical diagnoses or treatment instructions.
              </p>
            </div>
          </div>

          {/* Section 4: Raw Clinical Parameters Grid (9 Attributes) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-slate-600" />
              <h3 className="font-display font-bold text-sm text-[#12213A] uppercase tracking-wider">
                Raw Clinical Parameters Grid (9 Attributes)
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Primary Diag (diag_1)</span>
                <span className="font-bold text-[#12213A]">{patient.diag_1}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Secondary Diag (diag_2)</span>
                <span className="font-bold text-[#12213A]">{patient.diag_2}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Tertiary Diag (diag_3)</span>
                <span className="font-bold text-[#12213A]">{patient.diag_3}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Inpatient Visits</span>
                <span className="font-bold text-[#12213A]">{patient.n_inpatient}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Emergency Visits</span>
                <span className="font-bold text-[#12213A]">{patient.n_emergency}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Outpatient Visits</span>
                <span className="font-bold text-[#12213A]">{patient.n_outpatient}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Medications Count</span>
                <span className="font-bold text-[#12213A]">{patient.n_medications}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Lab Procedures</span>
                <span className="font-bold text-[#12213A]">{patient.n_lab_procedures}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Stay Duration</span>
                <span className="font-bold text-[#12213A]">{patient.time_in_hospital} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#12213A] text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Detail Audit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
