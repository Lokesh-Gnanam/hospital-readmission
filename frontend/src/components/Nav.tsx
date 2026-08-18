import React from 'react';
import { Activity, LayoutGrid, UserPlus, BarChart3, Settings, LogOut } from 'lucide-react';
import type { HealthStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavProps {
  activeTab: 'ward' | 'intake' | 'performance' | 'admin';
  setActiveTab: (tab: 'ward' | 'intake' | 'performance' | 'admin') => void;
  health: HealthStatus | null;
}

export const Nav: React.FC<NavProps> = ({ activeTab, setActiveTab, health }) => {
  const { user, logout } = useAuth();

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

          {/* Right: API Health Status Indicator & Authenticated User Control */}
          <div className="flex items-center space-x-3 shrink-0">
            {health ? (
              <div 
                className="hidden lg:flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono select-none"
                title={`Database Connected: ${health.database_connected ? 'Yes' : 'No'}\nModel Loaded: ${health.model_loaded ? 'Yes' : 'No'}`}
              >
                <span className={`w-2 h-2 rounded-full ${health.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  API: {health.status}
                </span>
              </div>
            ) : null}

            {user && (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 hidden sm:inline max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
                  title="Sign out of application"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Nav;
