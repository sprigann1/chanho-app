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
  const navigate  = useNavigate();
  const location  = useLocation();

  // Splash
  const [splashMounted, setSplashMounted] = useState(true);
  const [appReady, setAppReady]           = useState(false);

  // Tab state
  const [activeTab, setActiveTab]       = useState(() => {
    const idx = TABS.findIndex(t => t.path === location.pathname);
    return idx >= 0 ? idx : 0;
  });
  const [dragOffset, setDragOffset]     = useState(0);
  const [withTransition, setWithTransition] = useState(true);

  // Refs — used inside addEventListener callbacks to avoid stale closures
  const activeTabRef  = useRef(activeTab);
  const dragOffsetRef = useRef(0);
  const touchStartX   = useRef(null);
  const touchStartY   = useRef(null);
  const directionRef  = useRef(null); // null | 'horizontal' | 'vertical'
  const isAnimating   = useRef(false);
  const prevPathname  = useRef(location.pathname);
  const containerRef  = useRef(null);
  const handlersRef   = useRef({});

  // Keep activeTabRef in sync
  activeTabRef.current = activeTab;

  // App fade-in: starts at 1500ms, same moment splash begins fading out
  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Sync tab when NavLink changes URL
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

  // Handler object — updated every render so addEventListener wrappers always
  // call the freshest version without needing to re-register the listeners.
  handlersRef.current = {
    onStart(e) {
      if (isAnimating.current) return;
      if (e.target.closest('.tabs')) return; // let filter chips scroll freely
      touchStartX.current  = e.touches[0].clientX;
      touchStartY.current  = e.touches[0].clientY;
      directionRef.current = null;
      setWithTransition(false);
    },

    onMove(e) {
      if (isAnimating.current || touchStartX.current === null) return;
      const absDx = Math.abs(e.touches[0].clientX - touchStartX.current);
      const absDy = Math.abs(e.touches[0].clientY - touchStartY.current);

      // Determine direction once on first significant movement
      if (directionRef.current === null) {
        if (absDy >= absDx) {
          directionRef.current = 'vertical';
          setWithTransition(true);
          return;
        }
        if (absDx > 10) {
          directionRef.current = 'horizontal';
        } else {
          return; // too small to decide yet
        }
      }

      if (directionRef.current === 'vertical') return;

      // Horizontal confirmed — block browser scroll (requires passive: false)
      e.preventDefault();

      const signedDx = e.touches[0].clientX - touchStartX.current;
      const curr     = activeTabRef.current;
      const atStart  = curr === 0       && signedDx > 0;
      const atEnd    = curr === N - 1   && signedDx < 0;
      const offset   = atStart || atEnd ? signedDx * 0.2 : signedDx; // rubber-band at edges
      dragOffsetRef.current = offset;
      setDragOffset(offset);
    },

    onEnd() {
      if (isAnimating.current || touchStartX.current === null) return;
      const dir    = directionRef.current;
      const offset = dir === 'horizontal' ? dragOffsetRef.current : 0;
      const curr   = activeTabRef.current;

      touchStartX.current   = null;
      directionRef.current  = null;
      dragOffsetRef.current = 0;
      setWithTransition(true);

      if (dir === 'horizontal' && Math.abs(offset) >= 50) {
        const next = offset < 0
          ? Math.min(curr + 1, N - 1)
          : Math.max(curr - 1, 0);
        if (next !== curr) {
          isAnimating.current  = true;
          prevPathname.current = TABS[next].path;
          setActiveTab(next);
          setDragOffset(0);
          navigate(TABS[next].path);
          setTimeout(() => { isAnimating.current = false; }, 350);
          return;
        }
      }
      setDragOffset(0);
    },
  };

  // Register with passive:false on touchmove so e.preventDefault() works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e) => handlersRef.current.onStart(e);
    const onMove  = (e) => handlersRef.current.onMove(e);
    const onEnd   = (e) => handlersRef.current.onEnd(e);
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []);

  return (
    <>
      {/* Outside app-container so opacity animation doesn't hide it */}
      {splashMounted && <SplashScreen onRemove={() => setSplashMounted(false)} />}

      <div
        className="app-container"
        style={{
          opacity: appReady ? 1 : 0,
          transition: appReady ? 'opacity 0.3s ease-in' : 'none',
        }}
      >
        {/* Touch capture layer — passive:false registered via ref */}
        <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={{
            display: 'flex',
            width: `${N * 100}%`,
            height: '100%',
            transform: `translateX(calc(${-activeTab * (100 / N)}% + ${dragOffset}px))`,
            transition: withTransition
              ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              : 'none',
            willChange: 'transform',
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
