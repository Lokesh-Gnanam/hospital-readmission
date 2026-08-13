import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { DashboardSummary } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, AlertTriangle, ShieldAlert, Sparkles, FileClock, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onNavigateToAssessment: () => void;
  onViewPatientDetails: (patientId: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAssessment, onViewPatientDetails }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDashboardSummary();
        setSummary(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard summary');
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Aggregating database statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-800 p-6 rounded-xl flex items-center gap-4 text-rose-300">
        <AlertTriangle className="w-10 h-10 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Failed to load statistics</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Assessments', value: summary?.total_predictions || 0, icon: Users, color: 'text-blue-400 bg-blue-950/40 border-blue-800' },
    { label: 'High Risk Patients', value: summary?.high_risk_patients || 0, icon: ShieldAlert, color: 'text-rose-400 bg-rose-950/40 border-rose-800' },
    { label: 'Moderate Risk Patients', value: summary?.moderate_risk_patients || 0, icon: AlertTriangle, color: 'text-amber-400 bg-amber-950/40 border-amber-800' },
    { label: 'Low Risk Patients', value: summary?.low_risk_patients || 0, icon: Sparkles, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' },
  ];

  // Prepare data for the Recharts donut chart
  const chartData = [
    { name: 'High Risk (>=30%)', value: summary?.high_risk_patients || 0, color: '#ef4444' },
    { name: 'Moderate Risk (20%-30%)', value: summary?.moderate_risk_patients || 0, color: '#f59e0b' },
    { name: 'Low Risk (<20%)', value: summary?.low_risk_patients || 0, color: '#10b981' },
  ].filter(item => item.value > 0);

  const avgPercent = ((summary?.average_probability || 0) * 100).toFixed(1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Clinical Overview</h2>
        <p className="text-slate-400 text-sm mt-1">
          Audits and telemetry aggregates of XGBoost machine learning predictions.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`border rounded-xl p-6 flex items-center justify-between shadow-sm bg-[#1e293b] ${stat.color.split(' ')[2]}`}>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">{stat.label}</span>
                <span className="text-3xl font-bold text-white tracking-tight">{stat.value}</span>
              </div>
              <div className={`p-3 rounded-lg border ${stat.color.split(' ')[0]} ${stat.color.split(' ')[2]} ${stat.color.split(' ')[3]}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Table block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Risk Distribution Chart */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-lg text-white mb-1">Risk Stratification</h3>
            <p className="text-xs text-slate-400 mb-4">Patient ratios based on operating threshold [0.30]</p>
          </div>
          
          <div className="h-64 relative flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-sm flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 rounded-lg">
                <span>No risk data available</span>
                <span className="text-xs mt-1">Aggregate charts populate after predictions run.</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">Average Predicted Probability</span>
            <span className="text-2xl font-bold text-blue-400">{avgPercent}%</span>
          </div>
        </div>

        {/* Recent Audits List Table */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">Recent Evaluations</h3>
                <p className="text-xs text-slate-400">Auditable clinical summaries recorded recently</p>
              </div>
              <button 
                onClick={onNavigateToAssessment}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-900"
              >
                Assess Patient
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {summary?.recent_predictions && summary.recent_predictions.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Patient Reference</th>
                      <th className="py-3 px-4">Calculated Probability</th>
                      <th className="py-3 px-4">Risk Category</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recent_predictions.map((pred) => (
                      <tr key={pred.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">{pred.patient_reference}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{(pred.readmission_probability * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            pred.risk_level === 'HIGH' 
                              ? 'text-rose-400 bg-rose-950/30 border-rose-800' 
                              : pred.risk_level === 'MODERATE' 
                              ? 'text-amber-400 bg-amber-950/30 border-amber-800' 
                              : 'text-emerald-400 bg-emerald-950/30 border-emerald-800'
                          }`}>
                            {pred.risk_level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {new Date(pred.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onViewPatientDetails(pred.patient_id)}
                            className="text-xs font-semibold text-blue-400 hover:underline"
                          >
                            Audit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-slate-500 flex flex-col items-center justify-center gap-3">
                  <FileClock className="w-12 h-12 text-slate-700" />
                  <div>
                    <h4 className="font-semibold text-slate-400">No predictions recorded yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      There are currently no patient records evaluated in the PostgreSQL audit database.
                    </p>
                  </div>
                  <button
                    onClick={onNavigateToAssessment}
                    className="mt-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Run First Prediction
                  </button>
                </div>
              )}
            </div>
          </div>

          {summary?.recent_predictions && summary.recent_predictions.length > 0 && (
            <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Click 'Audit' to load patient features, model outcomes, and local SHAP explanations.</span>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
export default Dashboard;
