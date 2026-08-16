import React, { useState, useEffect } from 'react';
import Nav from './components/Nav';
import WardOverview from './pages/WardOverview';
import NewAssessment from './pages/NewAssessment';
import ModelPerformance from './pages/ModelPerformance';
import type { HealthStatus } from './types';
import { fetchHealth } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ward' | 'intake' | 'performance'>('ward');
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetchHealth();
        setHealth(res);
      } catch (err) {
        console.error('Error loading health status:', err);
      }
    }
    loadHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Bar Header Navigation */}
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} health={health} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'ward' && <WardOverview />}
        {activeTab === 'intake' && <NewAssessment />}
        {activeTab === 'performance' && <ModelPerformance />}
      </main>

      {/* Platform Footer */}
      <footer className="bg-[#12213A] text-slate-400 text-xs border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">VITALS</span>
            <span className="text-slate-500">|</span>
            <span>Hospital Readmission Risk Platform</span>
          </div>

          <div className="text-slate-400 text-center sm:text-right">
            Model Cutoff: <span className="text-teal-400 font-bold">25.6%</span> | Training Cohort: <span className="text-slate-200">25,000 Kaggle Patients</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
