'use client';

import Link from 'next/link';
import type { ActivePage } from './AppNav';

interface BottomNavProps {
  activePage: ActivePage;
  urgentCount?: number;
}

const BNAV_ITEMS: Array<{
  key: ActivePage;
  href: string;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'players',
    href: '/app',
    label: 'Jugadores',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: 'dashboard',
    href: '/app/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: 'scout-log',
    href: '/scout-log',
    label: 'Log',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    key: 'map',
    href: '/app/map',
    label: 'Mapa',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    key: 'alerts',
    href: '/app/alerts',
    label: 'Alertas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

export default function BottomNav({ activePage, urgentCount = 0 }: BottomNavProps) {
  return (
    <nav className="app-bottom-nav" aria-label="Navegación rápida">
      <div className="bnav-inner">
        {BNAV_ITEMS.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={`bnav-btn${activePage === item.key ? ' active' : ''}`}
          >
            <span className="bnav-icon">{item.icon}</span>
            <span className="bnav-label">
              {item.label}
              {item.key === 'alerts' && urgentCount > 0 && (
                <span style={{
                  display: 'inline-block',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#EF4444',
                  marginLeft: '3px',
                  verticalAlign: 'middle',
                }} />
              )}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
