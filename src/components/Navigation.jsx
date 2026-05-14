import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',            label: '홈',  icon: HomeIcon,     activeIcon: HomeFilledIcon },
  { to: '/sites',       label: '현장', icon: SiteIcon,     activeIcon: SiteFilledIcon },
  { to: '/todos',       label: '할일', icon: TodoIcon,     activeIcon: TodoFilledIcon },
  { to: '/calendar',    label: '달력', icon: CalendarIcon, activeIcon: CalendarFilledIcon },
  { to: '/collections', label: '수금', icon: WalletIcon,   activeIcon: WalletFilledIcon },
];

export default function Navigation() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0,
      width: '100%',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      height: 'var(--nav-height)',
      zIndex: 500,
      padding: '0 12px',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(({ to, label, icon: Icon, activeIcon: ActiveIcon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3,
            color: isActive ? 'var(--primary)' : 'var(--text-4)',
            fontSize: 12, fontWeight: 600,
            textDecoration: 'none',
            transition: 'color 0.15s',
            paddingTop: 8,
          })}
        >
          {({ isActive }) => (
            <>
              {isActive ? <ActiveIcon /> : <Icon />}
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}
function HomeFilledIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" fill="currentColor"/>
      <path d="M9 21V12h6v9" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function SiteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}
function SiteFilledIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" fill="currentColor"/>
      <circle cx="12" cy="8" r="2.2" fill="#fff"/>
    </svg>
  );
}

function TodoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M7 9h10M7 13h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="5.5" cy="9" r="0" fill="currentColor"/>
    </svg>
  );
}
function TodoFilledIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor"/>
      <path d="M7 9h10M7 13h7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function CalendarFilledIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" fill="currentColor"/>
      <path d="M8 3v4M16 3v4M3 10h18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M16 13a1 1 0 110 2 1 1 0 010-2z" fill="currentColor"/>
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}
function WalletFilledIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="2" fill="currentColor"/>
      <path d="M2 10h20" stroke="#fff" strokeWidth="1.8"/>
      <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="16" cy="14" r="1.2" fill="#fff"/>
    </svg>
  );
}
