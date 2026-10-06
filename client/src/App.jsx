import React from 'react';
import { StudentProvider, useStudent } from './context/StudentContext';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';
import { ErrorState } from './components/ui/ErrorState';
import { Home } from './pages/Home';
import { Careers } from './pages/Careers';
import { DSAPractice } from './pages/DSAPractice';
import { Simulator } from './pages/Simulator';
import { Optimizer } from './pages/Optimizer';
import { LearningPath } from './pages/LearningPath';
import { Dashboard } from './pages/Dashboard';
import { KnowledgeGraphView } from './pages/KnowledgeGraphView';
import { StudentProfile } from './pages/StudentProfile';

function AppContent() {
  const { activeTab, loading, error, refreshProfile } = useStudent();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner label="Connecting to the API…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <ErrorState
          title="Could not reach the backend"
          message={`${error}. Start the server with npm run dev inside server/.`}
          onRetry={refreshProfile}
        />
      </div>
    );
  }

  return (
    <AppLayout>
      {activeTab === 'home' && <Home />}
      {activeTab === 'careers' && <Careers />}
      {activeTab === 'practice' && <DSAPractice />}
      {activeTab === 'simulator' && <Simulator />}
      {activeTab === 'optimizer' && <Optimizer />}
      {activeTab === 'learning' && <LearningPath />}
      {activeTab === 'graph' && <KnowledgeGraphView />}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'profile' && <StudentProfile />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <StudentProvider>
      <AppContent />
    </StudentProvider>
  );
}
