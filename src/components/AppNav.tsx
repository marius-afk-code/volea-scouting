'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter } from 'next/navigation';
import BottomNav from './BottomNav';

export type ActivePage =
  | 'players'
  | 'dashboard'
  | 'compare'
  | 'map'
  | 'alerts'
  | 'scout-log';

interface AppNavProps {
  activePage: ActivePage;
  urgentCount?: number;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  players: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  dashboard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  compare: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/>
      <path d="M12 20V4"/>
      <path d="M6 20v-6"/>
    </svg>
  ),
  alerts: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  'scout-log': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
};

const NAV_LINKS = (urgentCount = 0) => [
  { href: '/app',           key: 'players',   label: 'Jugadores' },
  { href: '/app/dashboard', key: 'dashboard', label: 'Dashboard' },
  { href: '/app/compare',   key: 'compare',   label: 'Comparar' },
  {
    href: '/app/alerts',
    key: 'alerts',
    label: 'Alertas',
    badge: urgentCount > 0 ? urgentCount : null,
    urgent: urgentCount > 0,
  },
  { href: '/scout-log',     key: 'scout-log', label: 'Scout Log' },
] as const;

/* ── Volea logo ─────────────────────────────────────────────────── */

/* ── Thin vertical separator ────────────────────────────────────── */
function Divider() {
  return (
    <div style={{
      width: 1,
      alignSelf: 'stretch',
      margin: '14px 0',
      background: 'rgba(255,255,255,0.05)',
      flexShrink: 0,
    }} />
  );
}

export default function AppNav({ activePage, urgentCount = 0 }: AppNavProps) {
  const { user, signOut } = useAuth();
  const { isDemo, exitDemo } = useDemo();
  const router = useRouter();

  return (
    <>
    {/* ── Demo banner ──────────────────────────────────────────── */}
    {isDemo && (
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 51,
        background: 'linear-gradient(90deg, rgba(124,58,237,0.95), rgba(91,33,182,0.95))',
        borderBottom: '1px solid rgba(124,58,237,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '0.5rem 1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#a78bfa',
            display: 'inline-block',
            boxShadow: '0 0 6px rgba(167,139,250,0.6)',
          }} />
          <span style={{
            color: '#e9d5ff',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.01em',
          }}>
            Estás en modo demo con datos de ejemplo
          </span>
        </div>
        <button
          onClick={() => { exitDemo(); router.push('/'); }}
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#e9d5ff',
            borderRadius: '6px',
            padding: '0.2rem 0.75rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.03em',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.12)'; }}
        >
          Salir del demo →
        </button>
      </div>
    )}
    <header className="app-top-nav" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(6,12,24,0.97)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Gold scanline at very top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1.5px',
        background:
          'linear-gradient(90deg, transparent 0%, var(--gold) 20%, var(--gold-2) 50%, rgba(212,168,83,0.3) 80%, transparent 100%)',
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: '64px',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0 1.75rem',
      }}>

        {/* ── Brand ─────────────────────────────────────────────── */}
        <Link
          href="/app"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
            flexShrink: 0,
            paddingRight: '1.75rem',
          }}
        >
          <img
            src="/logo-volea-icon.svg"
            alt="Volea"
            style={{ height: 28, display: 'block', flexShrink: 0 }}
          />
          <span style={{
            fontFamily: 'var(--font-condensed)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#E2E8F0',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            VOLEA SCOUTING
          </span>
        </Link>

        <Divider />

        {/* ── Navigation links ──────────────────────────────────── */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'stretch',
            flex: 1,
            paddingLeft: '0.5rem',
          }}
          aria-label="Navegación principal"
        >
          {NAV_LINKS(urgentCount).map(l => {
            const isActive = l.key === activePage;
            const isUrgent = 'urgent' in l && l.urgent;
            const badge = 'badge' in l ? l.badge : null;

            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  'mm-nav-link',
                  isActive ? 'active' : '',
                  isUrgent && !isActive ? 'urgent' : '',
                ].join(' ')}
              >
                <span style={{ opacity: isActive ? 1 : 0.7, transition: 'opacity 0.15s' }}>
                  {NAV_ICONS[l.key]}
                </span>
                {l.label}
                {badge && (
                  <span style={{
                    marginLeft: '0.3rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    borderRadius: '4px',
                    background: 'rgba(124,58,237,0.2)',
                    border: '1px solid rgba(124,58,237,0.35)',
                    color: 'var(--purple-3)',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: 0,
                  }}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Divider />

        {/* ── User area ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          paddingLeft: '1.5rem',
          flexShrink: 0,
        }}>
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '7px',
                background: 'rgba(212,168,83,0.08)',
                border: '1px solid rgba(212,168,83,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  color: 'var(--gold)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  fontFamily: "'Syne', var(--font-heading), sans-serif",
                  letterSpacing: '0.02em',
                }}>
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span style={{
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 500,
                maxWidth: '130px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-body)',
              }}>
                {user.email}
              </span>
            </div>
          )}

          <button
            className="mm-salir-btn"
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
          >
            Salir
          </button>
        </div>

      </div>
    </header>
    <BottomNav activePage={activePage} urgentCount={urgentCount} />
    </>
  );
}
