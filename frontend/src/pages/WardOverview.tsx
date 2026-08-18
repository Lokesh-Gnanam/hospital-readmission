import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import type { PatientRecord, PatientsResponse } from '../types';
import { fetchPatients, uploadBatchCsv } from '../api/client';
import PatientRow from '../components/PatientRow';
import PatientDetail from '../components/PatientDetail';

export const WardOverview: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [data, setData] = useState<PatientsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // Filters & Search State
  const [filterTier, setFilterTier] = useState<'ALL' | 'High Risk' | 'Moderate Risk' | 'Low Risk'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'stay'>('highest');

  // CSV upload state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const loadPatientsData = async (pageNum: number) => {
    setLoading(true);
    try {
      // In server mode, fetch page. If full dataset is already loaded, stay in client mode.
      const res = await fetchPatients(pageNum, pageSize);
      setData(res);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientsData(page);
  }, []);

  // Reset current page to 1 whenever risk filter, search, or page size changes
  useEffect(() => {
    setPage(1);
  }, [filterTier, searchQuery, pageSize]);

  // Overall metric counts derived from loaded patients population
  const metrics = useMemo(() => {
    if (!data || !data.patients) {
      return { total: 0, high: 0, moderate: 0, low: 0 };
    }
    const pts = data.patients;
    let high = 0;
    let moderate = 0;
    let low = 0;

    pts.forEach(p => {
      const tier = p.clinical_risk_tier;
      if (tier === 'High Risk') high++;
      else if (tier === 'Moderate Risk') moderate++;
      else if (tier === 'Low Risk') low++;
    });

    return {
      total: data.total && data.total > pts.length ? data.total : pts.length,
      high,
      moderate,
      low
    };
  }, [data]);

  // Filter counts for pills
  const pillCounts = useMemo(() => {
    if (!data || !data.patients) {
      return { ALL: 0, 'High Risk': 0, 'Moderate Risk': 0, 'Low Risk': 0 };
    }
    const pts = data.patients;
    let high = 0;
    let moderate = 0;
    let low = 0;

    pts.forEach(p => {
      if (p.clinical_risk_tier === 'High Risk') high++;
      else if (p.clinical_risk_tier === 'Moderate Risk') moderate++;
      else if (p.clinical_risk_tier === 'Low Risk') low++;
    });

    return {
      ALL: pts.length,
      'High Risk': high,
      'Moderate Risk': moderate,
      'Low Risk': low
    };
  }, [data]);

  // Filtered & Sorted patients list
  const processedPatients = useMemo(() => {
    if (!data || !data.patients) return [];
    let list = [...data.patients];

    // Filter by risk tier
    if (filterTier !== 'ALL') {
      list = list.filter(p => p.clinical_risk_tier === filterTier);
    }

    // Filter by search query (patient ID, specialty, primary driver, diag)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p =>
          p.id.toLowerCase().includes(q) ||
          (p.medical_specialty && p.medical_specialty.toLowerCase().includes(q)) ||
          (p.primary_driver && p.primary_driver.toLowerCase().includes(q)) ||
          (p.diag_1 && p.diag_1.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      const probA = a.readmission_probability ?? 0;
      const probB = b.readmission_probability ?? 0;
      if (sortBy === 'highest') return probB - probA;
      if (sortBy === 'lowest') return probA - probB;
      if (sortBy === 'stay') return (b.time_in_hospital || 0) - (a.time_in_hospital || 0);
      return 0;
    });

    return list;
  }, [data, filterTier, searchQuery, sortBy]);

  // Pagination calculations
  const totalFilteredCount = processedPatients.length > 0 ? processedPatients.length : (data?.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  // Current page items to display on screen
  const displayedPatients = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return processedPatients.slice(startIdx, startIdx + pageSize);
  }, [processedPatients, page, pageSize]);

  // Handle CSV file upload trigger sending file to POST /predict_batch
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('Scoring uploaded ward patients CSV with POST /predict_batch...');
    try {
      const result = await uploadBatchCsv(file);
      if (result && result.predictions && result.predictions.length > 0) {
        setData({
          patients: result.predictions,
          total: result.predictions.length,
          page: 1,
          page_size: pageSize,
          total_pages: Math.ceil(result.predictions.length / pageSize)
        });
        setPage(1);
        setUploadStatus(`Batch scoring complete! ${result.predictions.length.toLocaleString()} predictions loaded across ${Math.ceil(result.predictions.length / pageSize).toLocaleString()} pages.`);
      } else {
        setUploadStatus('No valid patient rows found in CSV file.');
      }

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadStatus('');
      }, 2000);
    } catch (err) {
      console.error('Error during CSV batch prediction:', err);
      setUploadStatus('Error processing CSV batch upload. Try again.');
    }
  };

  const startRecordNum = totalFilteredCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const endRecordNum = Math.min(page * pageSize, totalFilteredCount);

  return (
    <div className="space-y-6">
      {/* Main Ward Discharge Overview Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="font-display font-extrabold text-2xl text-[#12213A] tracking-tight">
              Ward Discharge Overview
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Predictions generated using the trained model on real Kaggle patient records.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Upload Ward CSV</span>
          </button>

          <button
            onClick={() => loadPatientsData(page)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#12213A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
            <span>Refresh Page</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patients Scored */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">PATIENTS SCORED</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono font-extrabold text-3xl text-[#12213A]">
            {metrics.total.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-sans font-medium">
            Total scored records
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-red-50/40 rounded-2xl p-5 border border-red-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-red-800">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">HIGH RISK</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="font-mono font-extrabold text-3xl text-red-700">
            {metrics.high.toLocaleString()}
          </div>
          <div className="text-[11px] text-red-700 font-sans font-medium">
            Require intervention
          </div>
        </div>

        {/* Moderate Risk */}
        <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">MODERATE RISK</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono font-extrabold text-3xl text-amber-700">
            {metrics.moderate.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-sans font-medium">
            Close monitoring
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">LOW RISK</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono font-extrabold text-3xl text-slate-700">
            {metrics.low.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-sans font-medium">
            Standard discharge
          </div>
        </div>
      </div>

      {/* Filter, Search & Pagination Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Risk Filter Pills with Live Badges */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          {(['ALL', 'High Risk', 'Moderate Risk', 'Low Risk'] as const).map(tier => {
            const label = tier === 'ALL' ? 'All Patients' : tier;
            const count = pillCounts[tier];
            return (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold font-sans transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  filterTier === tier
                    ? 'bg-[#12213A] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    filterTier === tier ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-3 flex-1 max-w-xl">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ID, specialty..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-sans font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="highest">Highest Risk First</option>
            <option value="lowest">Lowest Risk First</option>
            <option value="stay">Longest Stay First</option>
          </select>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
          <div className="text-xs font-sans text-slate-500 mr-2 hidden sm:block">
            Showing <span className="font-mono font-semibold text-slate-800">{startRecordNum}</span>–
            <span className="font-mono font-semibold text-slate-800">{endRecordNum}</span> of{' '}
            <span className="font-mono font-semibold text-slate-800">{totalFilteredCount.toLocaleString()}</span>
          </div>

          {/* Page Size Select */}
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer mr-1"
            title="Patients per page"
          >
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {totalPages > 1 && (
            <>
              {/* First Page Button */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-mono font-bold"
                title="First Page"
              >
                «
              </button>

              {/* Previous Page Button */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-[#12213A] px-2">
                Page {page.toLocaleString()} of {totalPages.toLocaleString()}
              </span>

              {/* Next Page Button */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page Button */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-mono font-bold"
                title="Last Page"
              >
                »
              </button>
            </>
          )}
        </div>
      </div>

      {/* Patient List Rows */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500">Loading Patient Records from FastAPI backend (Page {page})...</p>
        </div>
      ) : displayedPatients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No matching patient records found</p>
          <p className="text-xs text-slate-500">Try adjusting your filter search criteria or search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPatients.map(patient => (
            <PatientRow key={patient.id} patient={patient} onSelect={setSelectedPatient} />
          ))}
        </div>
      )}

      {/* Patient Detail Drawer */}
      {selectedPatient && (
        <PatientDetail patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                <h3 className="font-display font-bold text-base text-[#12213A]">
                  Upload Ward CSV Dataset
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select a CSV file containing patient clinical features to send to POST /predict_batch.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer relative">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-[#12213A]">
                Click to browse or drop CSV file
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Sends to POST /predict_batch
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {uploadStatus && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs font-mono text-teal-900 text-center font-semibold">
                {uploadStatus}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardOverview;
