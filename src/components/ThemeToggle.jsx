import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={dark ? '라이트 모드' : '다크 모드'}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
