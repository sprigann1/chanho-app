import React, { useState, useRef, useEffect } from 'react';
import { HashRouter, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import Navigation from './components/Navigation';
import SplashScreen from './components/SplashScreen';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Todos from './pages/Todos';
import CalendarPage from './pages/CalendarPage';
import Collections from './pages/Collections';

const TABS = [
  { path: '/',            Component: Dashboard },
  { path: '/sites',       Component: Sites },
  { path: '/todos',       Component: Todos },
  { path: '/calendar',    Component: CalendarPage },
  { path: '/collections', Component: Collections },
];
const N = TABS.length;

function AppContent() {
  const { toast } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  // Splash
  const [splashMounted, setSplashMounted] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // Active tab + drag
  const [activeTab, setActiveTab] = useState(() => {
    const idx = TABS.findIndex(t => t.path === location.pathname);
    return idx >= 0 ? idx : 0;
  });
  const [dragOffset, setDragOffset] = useState(0);
  const [withTransition, setWithTransition] = useState(true);

  // Refs for reliable synchronous access inside event handlers
  const activeTabRef  = useRef(activeTab);
  const dragOffsetRef = useRef(0);
  const touchStartX   = useRef(null);
  const touchStartY   = useRef(null);
  const isHorizontal  = useRef(null);
  const isAnimating   = useRef(false);
  const prevPathname  = useRef(location.pathname);

  // Keep activeTabRef in sync with state
  activeTabRef.current = activeTab;

  // App fade-in: starts at same moment splash starts fading (1500ms)
  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Sync tab when URL changes via NavLink click
  useEffect(() => {
    if (location.pathname === prevPathname.current) return;
    prevPathname.current = location.pathname;
    const idx = TABS.findIndex(t => t.path === location.pathname);
    if (idx >= 0 && idx !== activeTabRef.current) {
      setWithTransition(true);
      setActiveTab(idx);
      dragOffsetRef.current = 0;
      setDragOffset(0);
    }
  }, [location.pathname]);

  const handleTouchStart = (e) => {
    if (isAnimating.current) return;
    // Skip swipe inside .tabs (horizontal scroll chips)
    if (e.target.closest('.tabs')) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setWithTransition(false);
  };

  const handleTouchMove = (e) => {
    if (isAnimating.current || touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine gesture direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dy) >= Math.abs(dx)) {
        isHorizontal.current = false;
        setWithTransition(true); // restore so content snaps properly
        return;
      }
      isHorizontal.current = true;
    }
    if (!isHorizontal.current) return;

    const curr = activeTabRef.current;
    const atStart = curr === 0 && dx > 0;
    const atEnd   = curr === N - 1 && dx < 0;
    const offset  = atStart || atEnd ? dx * 0.2 : dx; // rubber-band at edges
    dragOffsetRef.current = offset;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (isAnimating.current || touchStartX.current === null) return;
    const offset = isHorizontal.current ? dragOffsetRef.current : 0;
    const curr   = activeTabRef.current;

    touchStartX.current = null;
    isHorizontal.current = null;
    dragOffsetRef.current = 0;
    setWithTransition(true);

    if (Math.abs(offset) >= 50) {
      const next = offset < 0
        ? Math.min(curr + 1, N - 1)
        : Math.max(curr - 1, 0);
      if (next !== curr) {
        isAnimating.current = true;
        prevPathname.current = TABS[next].path;
        setActiveTab(next);
        setDragOffset(0);
        navigate(TABS[next].path);
        setTimeout(() => { isAnimating.current = false; }, 350);
        return;
      }
    }
    setDragOffset(0);
  };

  return (
    <>
      {/* Splash sits outside app-container so app opacity doesn't hide it */}
      {splashMounted && <SplashScreen onRemove={() => setSplashMounted(false)} />}

      <div
        className="app-container"
        style={{
          opacity: appReady ? 1 : 0,
          transition: appReady ? 'opacity 0.3s ease-in' : 'none',
        }}
      >
        {/* Swipeable tab strip */}
        <div
          style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{
            display: 'flex',
            width: `${N * 100}%`,
            height: '100%',
            transform: `translateX(calc(${-activeTab * (100 / N)}% + ${dragOffset}px))`,
            transition: withTransition
              ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              : 'none',
            willChange: 'transform',
            touchAction: 'pan-y',
          }}>
            {TABS.map(({ Component }, i) => (
              <div key={i} style={{
                width: `${100 / N}%`,
                flexShrink: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <Component />
              </div>
            ))}
          </div>
        </div>

        <Navigation />
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
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
