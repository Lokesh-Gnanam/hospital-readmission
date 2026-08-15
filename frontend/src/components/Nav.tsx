import React from 'react';
import { Activity, LayoutGrid, UserPlus, BarChart3 } from 'lucide-react';
import type { HealthStatus } from '../types';

interface NavProps {
  activeTab: 'ward' | 'intake' | 'performance';
  setActiveTab: (tab: 'ward' | 'intake' | 'performance') => void;
  health: HealthStatus | null;
}

export const Nav: React.FC<NavProps> = ({ activeTab, setActiveTab }) => {

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
            </div>
          </div>

          {/* Right empty container to balance layout */}
          <div className="flex items-center space-x-2"></div>
        </div>
      </div>
    </header>
  );
};

export default Nav;
