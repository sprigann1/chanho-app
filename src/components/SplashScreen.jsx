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
        background: '#3182F6',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <svg width="110" height="110" viewBox="0 0 512 512">
        <polygon points="256,96 408,224 408,416 104,416 104,224" fill="white"/>
        <rect x="144" y="252" width="88" height="80" rx="8" fill="#3182F6"/>
        <rect x="280" y="252" width="88" height="80" rx="8" fill="#3182F6"/>
        <rect x="208" y="332" width="96" height="84" rx="8" fill="#3182F6"/>
      </svg>
      <div style={{
        color: '#fff', fontSize: 22, fontWeight: 700,
        marginTop: 20, letterSpacing: '-0.5px',
        fontFamily: "'Pretendard', -apple-system, sans-serif",
      }}>
        창호 영업관리
      </div>
    </div>
  );
}
