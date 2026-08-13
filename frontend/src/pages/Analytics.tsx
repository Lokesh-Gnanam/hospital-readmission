import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { ModelInfo } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModelInfo = async () => {
      try {
        setLoading(true);
        const data = await apiService.getModelInfo();
        setModelInfo(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load model analytics');
      } finally {
        setLoading(false);
      }
    };
    loadModelInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading model specifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-800 p-6 rounded-xl flex items-center gap-4 text-rose-300">
        <AlertCircle className="w-10 h-10 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Metrics unavailable</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  // 5,000 held-out test set confusion matrix figures
  const confusionMatrix = {
    tn: 406,
    fp: 2244,
    fn: 155,
    tp: 2195
  };

  const cv = modelInfo?.cross_validation_metrics || {
    mean_accuracy: 0.5200,
    mean_precision: 0.4945,
    mean_recall: 0.9341,
    mean_f1: 0.6466,
    mean_roc_auc: 0.6493,
    mean_pr_auc: 0.6222
  };

  const metricsData = [
    { name: 'Accuracy', value: cv.mean_accuracy * 100 },
    { name: 'Precision', value: cv.mean_precision * 100 },
    { name: 'Recall (Sensitivity)', value: cv.mean_recall * 100 },
    { name: 'F1 Score', value: cv.mean_f1 * 100 },
    { name: 'ROC-AUC', value: cv.mean_roc_auc * 100 },
    { name: 'PR-AUC', value: cv.mean_pr_auc * 100 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Model Analytics & Validation</h2>
          <p className="text-slate-400 text-sm mt-1">
            Historical validation metrics computed on the 20% test partition.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Model Version: {modelInfo?.model_version || '1.0.0'}</span>
        </div>
      </div>

      {/* Metrics graph & hyperparams panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Metrics Chart */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg text-white">Validation Partition Performance (%)</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hyperparameters Card */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white mb-1">XGBoost Hyperparameters</h3>
            <p className="text-xs text-slate-400 mb-4">Grid search optimized hyperparameters</p>
          </div>

          <div className="space-y-3 bg-[#131b2e] p-4 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300">
            {modelInfo?.best_hyperparameters ? (
              Object.entries(modelInfo.best_hyperparameters).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1 border-b border-slate-800/40 last:border-0">
                  <span className="text-slate-500">{key}:</span>
                  <span className="text-blue-400 font-semibold">{JSON.stringify(val)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No parameters loaded.</p>
            )}
          </div>

          <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800 mt-4">
            Model pipeline encapsulates both scaling and one-hot encoding columns before feeding records to the XGBoost classifier.
          </div>
        </div>

      </div>

      {/* Confusion Matrix & Clinical Trade-offs panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Confusion Matrix Visualization */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold text-lg text-white mb-1">Confusion Matrix</h3>
            <p className="text-xs text-slate-400">Recorded on 5,000 held-out patient validation instances</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {/* True Negative */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">True Negative (TN)</span>
              <span className="text-2xl font-bold text-slate-300 block mt-1">{confusionMatrix.tn}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Correctly identified low-risk</span>
            </div>

            {/* False Positive */}
            <div className="bg-amber-950/10 border border-amber-900/60 p-4 rounded-lg text-center">
              <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider block">False Positive (FP)</span>
              <span className="text-2xl font-bold text-amber-400 block mt-1">{confusionMatrix.fp}</span>
              <span className="text-[10px] text-amber-500 mt-0.5 block">Alarm fatigue drivers</span>
            </div>

            {/* False Negative */}
            <div className="bg-rose-950/10 border border-rose-900/60 p-4 rounded-lg text-center">
              <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider block">False Negative (FN)</span>
              <span className="text-2xl font-bold text-rose-400 block mt-1">{confusionMatrix.fn}</span>
              <span className="text-[10px] text-rose-500 mt-0.5 block">Clinical Misses</span>
            </div>

            {/* True Positive */}
            <div className="bg-emerald-950/10 border border-emerald-900/60 p-4 rounded-lg text-center">
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider block">True Positive (TP)</span>
              <span className="text-2xl font-bold text-emerald-400 block mt-1">{confusionMatrix.tp}</span>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Correctly flagged high-risk</span>
            </div>
          </div>
        </div>

        {/* Clinical Discussion / Trade-offs */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg text-white">Decision Threshold Analysis [0.30]</h3>
          
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              In medical screening, missing a high-risk patient (False Negative) carries severe clinical consequences, whereas flagging a patient who would not readmit (False Positive) leads only to minor, harmless preventative follow-ups.
            </p>
            
            <p>
              Thus, our system was optimized to prioritize **Recall (Sensitivity) of 93.41%** by selecting a decision threshold of **0.30** instead of the standard 0.50.
            </p>

            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="font-semibold text-emerald-400">High Clinical Safety:</span>
                <span className="text-slate-400">By restricting clinical misses to just 155 patients (FN), the system guarantees that the vast majority of patients requiring preventative interventions are caught.</span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-800/40">
                <span className="font-semibold text-amber-400">Alarm Fatigue Trade-off:</span>
                <span className="text-slate-400">A high count of False Positives (2,244) implies that clinicians will review some patients who do not actually readmit, requiring optimized workflows to avoid fatigue.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Analytics;
