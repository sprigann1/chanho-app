import React, { useState, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import Navigation from './components/Navigation';
import SplashScreen from './components/SplashScreen';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Todos from './pages/Todos';
import CalendarPage from './pages/CalendarPage';
import Collections from './pages/Collections';

const ROUTES = ['/', '/sites', '/todos', '/calendar', '/collections'];

function AppContent() {
  const { toast } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const touchStart = useRef(null);

  const handleTouchStart = useCallback((e) => {
    // Skip swipe detection inside horizontally scrollable elements
    if (e.target.closest('.tabs')) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    // Only trigger if clearly horizontal (dx > 60px and ratio dx/dy > 1.2)
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

    const curr = ROUTES.indexOf(location.pathname);
    if (curr === -1) return;
    if (dx < 0 && curr < ROUTES.length - 1) navigate(ROUTES[curr + 1]);
    if (dx > 0 && curr > 0) navigate(ROUTES[curr - 1]);
  }, [location.pathname, navigate]);

  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
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
      <ThemeProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
