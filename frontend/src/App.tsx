import React, { useState } from 'react';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import RiskAssessment from './pages/RiskAssessment';
import PredictionResult from './pages/PredictionResult';
import PatientHistory from './pages/PatientHistory';
import ModelAnalytics from './pages/ModelAnalytics';
import type { PredictionResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Drill-down audit state (passes selected patient from Dashboard to History detail panel)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  // Evaluation outcome state
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);

  const handleViewPatientDetails = (patientId: number) => {
    setSelectedPatientId(patientId);
    setActiveTab('history');
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatientId(null);
  };

  const handlePredictionResult = (result: PredictionResponse) => {
    setPredictionResult(result);
    setActiveTab('result');
  };

  const handleResetPrediction = () => {
    setPredictionResult(null);
    setActiveTab('predict');
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard 
          onNavigateToAssessment={() => setActiveTab('predict')} 
          onViewPatientDetails={handleViewPatientDetails} 
        />
      )}
      
      {activeTab === 'predict' && (
        <RiskAssessment onPredictionResult={handlePredictionResult} />
      )}

      {activeTab === 'result' && predictionResult && (
        <PredictionResult result={predictionResult} onReset={handleResetPrediction} />
      )}
      
      {activeTab === 'history' && (
        <PatientHistory 
          selectedPatientId={selectedPatientId} 
          onClearSelectedPatient={handleClearSelectedPatient} 
        />
      )}
      
      {activeTab === 'analytics' && (
        <ModelAnalytics />
      )}
    </Layout>
  );
};

export default App;
