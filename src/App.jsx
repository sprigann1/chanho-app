import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Todos from './pages/Todos';
import CalendarPage from './pages/CalendarPage';
import Collections from './pages/Collections';

function AppContent() {
  const { toast } = useData();

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/collections" element={<Collections />} />
      </Routes>
      <Navigation />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </HashRouter>
  );
}
