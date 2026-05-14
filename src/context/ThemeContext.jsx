import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      const isDark = saved === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      return isDark;
    } catch { return false; }
  });

  const toggle = () => {
    document.documentElement.classList.add('theme-transitioning');
    setDark(d => {
      const next = !d;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
      return next;
    });
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300);
  };

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
