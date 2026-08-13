import React from 'react';
import type { PredictionResponse } from '../types';
import { Undo2, Activity, ShieldAlert } from 'lucide-react';

interface PredictionResultProps {
  result: PredictionResponse;
  onReset: () => void;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({ result, onReset }) => {
  const probPct = (result.readmission_probability * 100).toFixed(1);
  const thresholdPct = (result.threshold * 100).toFixed(0);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Result Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Evaluation Outcome</h2>
          <p className="text-slate-400 text-sm mt-1">Telemetry summary and local SHAP explanations</p>
        </div>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700 transition-all"
        >
          <Undo2 className="w-4 h-4" />
          Evaluate New Patient
        </button>
      </div>

      {/* Diagnostic probability panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Risk level */}
        <div className="md:col-span-2 bg-[#1e293b] border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
              Readmission Probability
            </span>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-5xl font-extrabold text-white tracking-tight">{probPct}%</span>
              <span className="text-sm text-slate-400">operating threshold: {thresholdPct}%</span>
            </div>
          </div>
          
          {/* Risk bar */}
          <div className="mt-6 space-y-2">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-1000 ${
                  result.risk_level === 'HIGH' 
                    ? 'bg-rose-500' 
                    : result.risk_level === 'MODERATE' 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${probPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>0%</span>
              <span>Low Risk</span>
              <span>20%</span>
              <span>Mod Risk</span>
              <span>30% (threshold)</span>
              <span>High Risk</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Risk Card Status */}
        <div className={`border rounded-xl p-6 flex flex-col justify-between shadow-md text-center ${
          result.risk_level === 'HIGH' 
            ? 'bg-rose-950/20 border-rose-800/80 text-rose-300' 
            : result.risk_level === 'MODERATE' 
            ? 'bg-amber-950/20 border-amber-800/80 text-amber-300' 
            : 'bg-emerald-950/20 border-emerald-800/80 text-emerald-300'
        }`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider block opacity-70">
              Risk Classification
            </span>
            <span className="text-3xl font-black block mt-4 tracking-wider">
              {result.risk_level}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 mt-6 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
            <Activity className="w-4 h-4 shrink-0" />
            <span>Model: {result.model_version}</span>
          </div>
        </div>
      </div>

      {/* Explainability (SHAP attributions) */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-white">Local Feature Attributions</h3>
          <p className="text-xs text-slate-400 mt-0.5">Top 5 model factors determining this patient's prediction</p>
        </div>

        <div className="space-y-5">
          {result.top_contributing_features && result.top_contributing_features.length > 0 ? (
            result.top_contributing_features.map((item, idx) => {
              const isPositive = item.impact === 'positive';
              // Calculate percentage width for visualization bar (cap at 100)
              const barWidth = Math.min(Math.round(Math.abs(item.importance) * 150), 100);
              
              return (
                <div key={idx} className="space-y-1.5 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="font-medium text-slate-300">
                      {item.feature}
                      <span className="text-xs text-slate-500 font-normal ml-1.5">({item.value})</span>
                    </span>
                    <span className={`text-xs font-semibold ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isPositive ? '+' : ''}{item.importance.toFixed(3)} {isPositive ? 'Increases Risk' : 'Reduces Risk'}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-800/60 rounded overflow-hidden flex items-center relative">
                    <div 
                      className={`h-full transition-all duration-750 ${
                        isPositive ? 'bg-rose-500/80' : 'bg-emerald-500/80'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-slate-500 text-sm text-center py-6 border border-dashed border-slate-800 rounded-lg">
              No feature attributions calculated.
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex gap-4 text-slate-400 text-xs leading-relaxed">
        <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-300">Non-Clinical Decision Support Disclaimer</h4>
          <p>{result.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;
