import React from 'react';
import { ChevronRight, Info, Clock } from 'lucide-react';
import type { PatientRecord } from '../types';
import ScoreGauge from './ScoreGauge';

interface PatientRowProps {
  patient: PatientRecord;
  onSelect: (patient: PatientRecord) => void;
}

export const PatientRow: React.FC<PatientRowProps> = ({ patient, onSelect }) => {
  const prob = patient.readmission_probability ?? 0.25;
  const percentScore = `${Math.round(prob * 100)}%`;
  const tier = patient.clinical_risk_tier || 'Low Risk';

  let tierBadgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  if (tier === 'High Risk') {
    tierBadgeStyle = 'bg-red-50 text-red-700 border-red-200';
  } else if (tier === 'Moderate Risk') {
    tierBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
  }

  const primaryDriverText = patient.primary_driver || `Patient age bracket ${patient.age || '[70-80)'}`;

  return (
    <div
      onClick={() => onSelect(patient)}
      className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-150 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      {/* Left: Compact Circular Arc & Metadata */}
      <div className="flex items-center space-x-4 min-w-0">
        <ScoreGauge probability={prob} variant="compact" />

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-sm text-[#12213A] group-hover:text-teal-700 transition-colors">
              {patient.id}
            </span>
            <span className="text-slate-400 font-sans text-xs">•</span>
            <span className="text-xs font-sans font-medium text-slate-700 truncate">
              {patient.medical_specialty || 'General Practice'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <span>{patient.age}</span>
            <span className="flex items-center space-x-1 text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{patient.time_in_hospital}d stay</span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Info Icon + Primary Risk Driver */}
      <div className="flex-1 min-w-0 px-2 flex items-center space-x-2 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="truncate font-sans font-medium text-slate-700">
          {primaryDriverText}
        </span>
      </div>

      {/* Right: Score percentage + Risk Tier Pill Badge + Chevron */}
      <div className="flex items-center space-x-3 shrink-0">
        <span className="font-mono font-bold text-sm text-[#12213A]">
          {percentScore}
        </span>

        <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${tierBadgeStyle}`}>
          {tier}
        </span>

        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};

export default PatientRow;
