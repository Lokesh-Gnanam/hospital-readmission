import React from 'react';
import { Activity, LayoutGrid, UserPlus, BarChart3, Settings } from 'lucide-react';
import type { HealthStatus } from '../types';

interface NavProps {
  activeTab: 'ward' | 'intake' | 'performance' | 'admin';
  setActiveTab: (tab: 'ward' | 'intake' | 'performance' | 'admin') => void;
  health: HealthStatus | null;
}

export const Nav: React.FC<NavProps> = ({ activeTab, setActiveTab, health }) => {

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Left: Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => setActiveTab('ward')}>
            <div className="w-8 h-8 rounded-xl bg-[#12213A] text-teal-400 flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-lg text-[#12213A] tracking-tight">
                  Vitals
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                  DECISION SUPPORT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-none hidden sm:block">
                Hospital Readmission Risk Platform
              </p>
            </div>
          </div>

          {/* Center: Top Navigation Control Tabs */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <div className="bg-slate-100/90 rounded-xl p-1 border border-slate-200/80 flex items-center space-x-1 shadow-inner">
              <button
                onClick={() => setActiveTab('ward')}
                className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ward'
                    ? 'bg-white text-[#12213A] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <span>Ward Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('intake')}
                className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'intake'
                    ? 'bg-white text-[#12213A] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>New Assessment</span>
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'performance'
                    ? 'bg-white text-[#12213A] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <span>Model Performance</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-[#12213A] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>System Admin</span>
              </button>
            </div>
          </div>

          {/* Right: API Health Status Indicator */}
          <div className="flex items-center space-x-2 shrink-0">
            {health ? (
              <div 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono select-none"
                title={`Database Connected: ${health.database_connected ? 'Yes' : 'No'}\nModel Loaded: ${health.model_loaded ? 'Yes' : 'No'}`}
              >
                <span className={`w-2 h-2 rounded-full ${health.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-slate-600 font-semibold uppercase tracking-wider text-[10px] hidden sm:inline">
                  API: {health.status}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono select-none">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-slate-600 font-semibold uppercase tracking-wider text-[10px] hidden sm:inline">
                  API: CONNECTING
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Nav;
