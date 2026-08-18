import React, { useState } from 'react';
import { Activity, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, authError, setAuthError, successMessage, setSuccessMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setAuthError(null);

    // Basic frontend checks
    if (!email.trim()) {
      setValidationError('Please enter your email address.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      // Clear messages on success
      setSuccessMessage(null);
    } catch (err: any) {
      // Error is set in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    setAuthError(null);
    setValidationError(null);
    onSwitchToRegister();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans py-12">
      {/* Container Card */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6 animate-fade-in">
        
        {/* Existing App Logo & Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#12213A] text-teal-400 shadow-md mb-2">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="font-display font-extrabold text-2xl text-[#12213A] tracking-tight">
              Vitals
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
              DECISION SUPPORT
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight pt-2">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sign in to continue to your hospital readmission dashboard
          </p>
        </div>

        {/* Success Message Banner (e.g. After Registration) */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 text-xs flex items-start space-x-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message Banner */}
        {(validationError || authError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs flex items-start space-x-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium">{validationError || authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError(null);
                  if (authError) setAuthError(null);
                }}
                placeholder="name@hospital.org"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
                  if (authError) setAuthError(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={handleRegisterClick}
              className="font-semibold text-teal-600 hover:text-teal-700 underline focus:outline-none cursor-pointer"
            >
              Create Account
            </button>
          </p>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-400 font-mono">
        Vitals Platform &bull; Secure Clinical Decision Support
      </div>
    </div>
  );
};

export default LoginPage;
