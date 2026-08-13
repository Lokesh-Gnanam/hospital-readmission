import React, { useState } from 'react';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import History from './pages/History';
import Analytics from './pages/Analytics';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Drill-down audit state (passes selected patient from Dashboard to History detail panel)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const handleViewPatientDetails = (patientId: number) => {
    setSelectedPatientId(patientId);
    setActiveTab('history');
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatientId(null);
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
        <Assessment />
      )}
      
      {activeTab === 'history' && (
        <History 
          selectedPatientId={selectedPatientId} 
          onClearSelectedPatient={handleClearSelectedPatient} 
        />
      )}
      
      {activeTab === 'analytics' && (
        <Analytics />
      )}
    </Layout>
  );
};

export default App;
