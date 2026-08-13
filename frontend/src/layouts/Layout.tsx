import React, { useEffect, useState } from 'react';
import { LayoutDashboard, UserRound, FileClock, BarChart3, ShieldCheck, HeartPulse, Activity } from 'lucide-react';
import { apiService } from '../services/api';
import type { HealthResponse } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Poll system health status every 15 seconds
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await apiService.checkHealth();
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'unhealthy', model_loaded: false, database_connected: false });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Clinician Dashboard', icon: LayoutDashboard },
    { id: 'predict', label: 'New Risk Assessment', icon: UserRound },
    { id: 'history', label: 'Patient Audit History', icon: FileClock },
    { id: 'analytics', label: 'Model Performance', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-[#1e293b] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-blue-500 animate-pulse" />
            <div>
              <h1 className="font-bold text-lg leading-tight">CardioGuard</h1>
              <span className="text-xs text-slate-400">Readmission AI Tool</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (System Status Indicators) */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-[#131b2e]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              API Connection
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.status === 'healthy' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-rose-500 animate-ping'
                }`}
              />
              <span className="capitalize">{health?.status || 'connecting...'}</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>ML Model (XGBoost)</span>
              <span className={health?.model_loaded ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                {health?.model_loaded ? 'LOADED' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Database (Postgres)</span>
              <span className={health?.database_connected ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                {health?.database_connected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-[#0b0f19] p-2 rounded border border-slate-800">
            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Prototype. Non-clinical.</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-300">Clinician Workspace</span>
            <span className="h-4 w-px bg-slate-800" />
            <span className="text-xs text-slate-400">Hospital Readmission Predictive Modeling</span>
          </div>
          <div className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </header>

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
export default Layout;
