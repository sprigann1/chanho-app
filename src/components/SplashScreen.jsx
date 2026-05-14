import React, { useEffect, useState, useRef } from 'react';

export default function SplashScreen({ onRemove }) {
  const [hiding, setHiding] = useState(false);
  const called = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setHiding(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'opacity' || !hiding || called.current) return;
    called.current = true;
    onRemove();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#2D2D2D',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="2" y="2" width="76" height="76" rx="3" stroke="white" strokeWidth="2"/>
        <line x1="40" y1="2" x2="40" y2="78" stroke="white" strokeWidth="2"/>
        <line x1="2" y1="40" x2="78" y2="40" stroke="white" strokeWidth="2"/>
      </svg>
      <div style={{
        color: '#fff',
        fontSize: 18,
        fontWeight: 300,
        letterSpacing: '0.2em',
        marginTop: 16,
        fontFamily: "'Pretendard', -apple-system, sans-serif",
      }}>
        보운창호
      </div>
    </div>
  );
}
