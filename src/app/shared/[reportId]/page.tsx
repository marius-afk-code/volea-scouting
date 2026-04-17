'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSharedReport } from '@/lib/visits';
import { SharedReport } from '@/types/visit';

// ─── Dark Radar Chart ───────────────────────────────────────────────────────

function DarkRadarChart({ metrics }: { metrics: SharedReport['metrics'] }) {
  const size = 220;
  const cx = size / 2, cy = size / 2, r = 80;
  const axes = [
    { key: 'technical' as const, label: 'Técnica',  color: '#A78BFA' },
    { key: 'tactical'  as const, label: 'Táctica',  color: '#60A5FA' },
    { key: 'physical'  as const, label: 'Físico',   color: '#34D399' },
    { key: 'attitude'  as const, label: 'Actitud',  color: '#FCD34D' },
  ];
  const n = axes.length;
  const sa = -Math.PI / 2;
  const step = (2 * Math.PI) / n;

  const pt = (a: number, pct: number) => ({
    x: cx + r * pct * Math.cos(a),
    y: cy + r * pct * Math.sin(a),
  });

  const gridPoly = (level: number) =>
    axes.map((_, i) => { const p = pt(sa + step * i, level / 5); return `${p.x},${p.y}`; }).join(' ');

  const dataPoly = axes.map((a, i) => {
    const p = pt(sa + step * i, (metrics[a.key] ?? 0) / 10);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1,2,3,4,5].map(l => (
        <polygon key={l} points={gridPoly(l)} fill="none"
          stroke={l === 5 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}
          strokeWidth={l === 5 ? 1.2 : 0.7} />
      ))}
      {axes.map((a, i) => {
        const p = pt(sa + step * i, 1);
        return <line key={a.key} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>;
      })}
      <polygon points={dataPoly} fill="rgba(124,58,237,0.2)" stroke="#7C3AED" strokeWidth="2.5" strokeLinejoin="round"/>
      {axes.map((a, i) => {
        const pct = (metrics[a.key] ?? 0) / 10;
        const p = pt(sa + step * i, pct);
        return (
          <g key={a.key}>
            <circle cx={p.x} cy={p.y} r={5} fill={a.color} stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
            <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="10" fontWeight="800" fill={a.color} fontFamily="system-ui">{metrics[a.key]}</text>
          </g>
        );
      })}
      {axes.map((a, i) => {
        const p = pt(sa + step * i, 1.3);
        return (
          <text key={a.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight="600" fill="#94A3B8" fontFamily="system-ui">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Visit Sparkline ────────────────────────────────────────────────────────

function VisitSparkline({ visits }: { visits: SharedReport['visits'] }) {
  const rated = visits.filter(v => v.valoracion > 0);
  if (rated.length < 2) return null;

  const W = 580, H = 100, pL = 28, pR = 16, pT = 16, pB = 28;
  const iW = W - pL - pR, iH = H - pT - pB;
  const n = rated.length;
  const xFor = (i: number) => pL + (n > 1 ? (i / (n - 1)) * iW : iW / 2);
  const yFor = (v: number) => pT + iH - ((v - 1) / 9) * iH;

  const pts = rated.map((v, i) => ({ x: xFor(i), y: yFor(v.valoracion), v: v.valoracion, d: v.fecha }));

  // Smooth bezier path
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i-1].x + pts[i].x) / 2;
    d += ` C ${cpx} ${pts[i-1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  const last = pts[pts.length - 1];
  const areaD = d + ` L ${last.x} ${H - pB} L ${pts[0].x} ${H - pB} Z`;

  const rcSpark = (v: number) => v >= 8 ? '#22C55E' : v >= 6 ? '#F59E0B' : '#EF4444';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[2, 4, 6, 8, 10].map(v => (
        <line key={v} x1={pL} y1={yFor(v)} x2={W - pR} y2={yFor(v)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      {[1, 6, 10].map(v => (
        <text key={v} x={pL - 4} y={yFor(v) + 4} textAnchor="end"
          fontSize="9" fill="#475569" fontFamily="system-ui">{v}</text>
      ))}
      <path d={areaD} fill="url(#sg)"/>
      <path d={d} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4.5} fill={rcSpark(p.v)} stroke="rgba(11,15,26,0.8)" strokeWidth="2"/>
          <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="10" fontWeight="800"
            fill={rcSpark(p.v)} fontFamily="system-ui">{p.v}</text>
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize="8.5" fill="#475569" fontFamily="system-ui">
            {p.d.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ratingColor(v: number): string {
  return v >= 8 ? '#22C55E' : v >= 6 ? '#F59E0B' : '#EF4444';
}

function ratingBg(v: number): string {
  return v >= 8 ? 'rgba(34,197,94,0.12)' : v >= 6 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function formatDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function calcAvg(metrics: SharedReport['metrics']): number {
  return Math.round(((metrics.technical + metrics.tactical + metrics.physical + metrics.attitude) / 4) * 10) / 10;
}

const METRIC_CONFIG = [
  { key: 'technical' as const, label: 'Técnica',  color: '#A78BFA' },
  { key: 'tactical'  as const, label: 'Táctica',  color: '#60A5FA' },
  { key: 'physical'  as const, label: 'Físico',   color: '#34D399' },
  { key: 'attitude'  as const, label: 'Actitud',  color: '#FCD34D' },
];

const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo', seguimiento: 'Seguimiento', espera: 'En espera', descartado: 'Descartado',
};
const STATUS_COLORS: Record<string, string> = {
  activo: '#22C55E', seguimiento: '#3B82F6', espera: '#F59E0B', descartado: '#EF4444',
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SharedReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    getSharedReport(reportId)
      .then(r => { if (!r) setNotFound(true); else setReport(r); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [reportId]);

  useEffect(() => {
    if (report) {
      const t = setTimeout(() => setMounted(true), 300);
      return () => clearTimeout(t);
    }
  }, [report]);

  const base: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0B0F1A',
    color: 'white',
    fontFamily: 'var(--font-body, system-ui, sans-serif)',
  };

  if (loading) {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#475569' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ fontFamily: 'var(--font-body, system-ui)' }}>Cargando informe…</p>
        </div>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem', fontFamily: 'var(--font-heading, system-ui)' }}>
            Informe no encontrado
          </h2>
          <p style={{ color: '#475569' }}>El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  const avg = calcAvg(report.metrics);
  const age = calcAge(report.playerBirthDate);
  const avgVisit = report.visits.length
    ? Math.round((report.visits.reduce((s, v) => s + v.valoracion, 0) / report.visits.length) * 10) / 10
    : null;

  const statusColor = STATUS_COLORS[report.playerStatus] ?? '#6B7280';

  return (
    <div style={base}>

      <style>{`
        .bar-fill { transition: width 0.8s cubic-bezier(.4,0,.2,1); }
        .no-print {}
        @media print {
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #0B0F1A !important; color: white !important; }
          @page { margin: 12mm; size: A4; }
        }
        @media (max-width: 720px) {
          .grid3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Top accent line ── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#7C3AED,#A78BFA,#C4B5FD,transparent)' }} />

      {/* ── Header bar ── */}
      <header style={{
        background: '#060810',
        padding: '0.875rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <img src="/logo-volea-icon.svg" alt="Volea" style={{ height: 28, display: 'block', flexShrink: 0 }} />
          <span style={{
            color: 'white',
            fontFamily: 'var(--font-condensed, system-ui)',
            fontWeight: 900,
            fontSize: '1.125rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            VOLEA SCOUTING
          </span>
          <span style={{
            padding: '0.15rem 0.5rem',
            borderRadius: 4,
            background: 'rgba(124,58,237,0.2)',
            color: '#A78BFA',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Informe
          </span>
        </div>
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <span style={{ color: '#334155', fontSize: '0.78rem' }}>
            {new Date(report.sharedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => window.print()}
            style={{
              padding: '0.4rem 0.875rem', borderRadius: 7, border: 'none',
              background: 'rgba(124,58,237,0.2)', color: '#C4B5FD',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              fontFamily: 'var(--font-body, system-ui)',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
            }}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* ── Hero ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(11,15,26,0) 100%)',
          borderRadius: 20, padding: '2rem',
          border: '1px solid rgba(124,58,237,0.2)',
          marginBottom: '1.5rem',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #7C3AED, rgba(124,58,237,0.2), transparent)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.5))',
              border: '2px solid rgba(124,58,237,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 32px rgba(124,58,237,0.25)',
            }}>
              <span style={{
                fontFamily: 'var(--font-condensed, system-ui)',
                fontWeight: 900,
                fontSize: '2.5rem',
                color: '#C4B5FD',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                {report.playerName.charAt(0)}
              </span>
            </div>

            {/* Name + info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{
                margin: 0,
                fontFamily: 'var(--font-condensed, system-ui)',
                fontWeight: 900,
                fontSize: '2.75rem',
                color: '#F1F5F9',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                lineHeight: 1,
                marginBottom: '0.375rem',
              }}>
                {report.playerName}
              </h1>
              <p style={{
                margin: '0 0 0.75rem',
                color: '#94A3B8',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-body, system-ui)',
                letterSpacing: '0.02em',
              }}>
                {report.playerPosition}
                {report.playerClub ? ` · ${report.playerClub}` : ''}
                {report.playerCity ? ` · ${report.playerCity}` : ''}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {report.playerCategory && (
                  <span style={{ padding: '0.2rem 0.625rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(124,58,237,0.2)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.3)' }}>
                    {report.playerCategory}
                  </span>
                )}
                {report.playerDivision && (
                  <span style={{ padding: '0.2rem 0.625rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {report.playerDivision}
                  </span>
                )}
                {report.playerStatus && (
                  <span style={{ padding: '0.2rem 0.625rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                    {STATUS_LABELS[report.playerStatus] ?? report.playerStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Rating badge */}
            <div style={{
              textAlign: 'center',
              background: `${ratingColor(avg)}12`,
              border: `2px solid ${ratingColor(avg)}40`,
              borderRadius: 16, padding: '1rem 1.5rem', flexShrink: 0,
              boxShadow: `0 0 32px ${ratingColor(avg)}20`,
            }}>
              <p style={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.2rem', fontFamily: 'var(--font-body, system-ui)' }}>Nota global</p>
              <p style={{
                fontFamily: 'var(--font-condensed, system-ui)',
                fontWeight: 900, fontSize: '3.5rem',
                color: ratingColor(avg), margin: 0, lineHeight: 1,
              }}>
                {avg}
              </p>
              <p style={{ color: '#475569', fontSize: '0.65rem', margin: '0.2rem 0 0' }}>/10</p>
            </div>
          </div>
        </div>

        {/* ── 3 col: metrics | radar | data ── */}
        <div className="grid3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* Metrics */}
          <div style={{ background: '#111827', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.375rem' }}>
            <p style={{ color: '#475569', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1.25rem', fontFamily: 'var(--font-body, system-ui)' }}>Métricas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {METRIC_CONFIG.map(mc => (
                <div key={mc.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontFamily: 'var(--font-body, system-ui)' }}>{mc.label}</span>
                    <span style={{
                      fontFamily: 'var(--font-condensed, system-ui)',
                      fontWeight: 900, fontSize: '1.1rem', color: mc.color,
                    }}>
                      {report.metrics[mc.key]}<span style={{ fontSize: '0.65rem', opacity: 0.6 }}>/10</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{
                      height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${mc.color}99, ${mc.color})`,
                      width: mounted ? `${(report.metrics[mc.key] / 10) * 100}%` : '0%',
                      boxShadow: mounted ? `0 0 8px ${mc.color}60` : 'none',
                    }}/>
                  </div>
                </div>
              ))}
            </div>
            {avgVisit !== null && (
              <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-condensed, system-ui)', fontWeight: 900, fontSize: '1.75rem', color: ratingColor(avgVisit), lineHeight: 1 }}>{avgVisit}</div>
                <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: '0.2rem' }}>media visitas ({report.visits.length})</div>
              </div>
            )}
          </div>

          {/* Radar */}
          <div style={{ background: '#111827', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.375rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 0.875rem', alignSelf: 'flex-start', fontFamily: 'var(--font-body, system-ui)' }}>Radar</p>
            <DarkRadarChart metrics={report.metrics} />
          </div>

          {/* Personal data */}
          <div style={{ background: '#111827', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.375rem' }}>
            <p style={{ color: '#475569', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1rem', fontFamily: 'var(--font-body, system-ui)' }}>Ficha personal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Edad',       value: age ? `${age} años` : '—' },
                { label: 'Nacimiento', value: formatDate(report.playerBirthDate) || '—' },
                { label: 'Posición',   value: report.playerPosition || '—' },
                { label: 'Pie',        value: report.playerFoot ? report.playerFoot.charAt(0).toUpperCase() + report.playerFoot.slice(1) : '—' },
                { label: 'Altura',     value: report.playerHeight ? `${report.playerHeight} cm` : '—' },
                { label: 'Peso',       value: report.playerWeight ? `${report.playerWeight} kg` : '—' },
                { label: 'Club',       value: report.playerClub || '—' },
                { label: 'Ciudad',     value: report.playerCity || '—' },
                { label: 'Categoría', value: report.playerCategory || '—' },
                { label: 'División',  value: report.playerDivision || '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#475569', fontFamily: 'var(--font-body, system-ui)' }}>{row.label}</span>
                  <span style={{ color: '#CBD5E1', fontWeight: 600, fontFamily: 'var(--font-body, system-ui)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Tags ── */}
        {report.playerTags && report.playerTags.length > 0 && (
          <div style={{ background: '#111827', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.375rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#475569', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 0.875rem', fontFamily: 'var(--font-body, system-ui)' }}>Perfil</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {report.playerTags.map((t, i) => (
                <span key={i} style={{ padding: '0.3rem 0.875rem', borderRadius: 999, background: 'rgba(124,58,237,0.15)', color: '#C4B5FD', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(124,58,237,0.25)', fontFamily: 'var(--font-body, system-ui)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Analysis ── */}
        {report.analysis && (
          <div style={{ background: 'rgba(124,58,237,0.07)', borderRadius: 14, border: '1px solid rgba(124,58,237,0.2)', padding: '1.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg,#7C3AED,#A78BFA)' }} />
            <p style={{ color: '#A78BFA', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem', fontFamily: 'var(--font-body, system-ui)' }}>
              Análisis del scout
            </p>
            {report.analysis.split('\n\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : '0.75rem 0 0', color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.7, fontFamily: 'var(--font-body, system-ui)' }}>
                {para}
              </p>
            ))}
          </div>
        )}

        {/* ── Visit trend sparkline ── */}
        {report.visits.length >= 2 && (
          <div style={{ background: '#111827', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.375rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#475569', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1rem', fontFamily: 'var(--font-body, system-ui)' }}>
              Evolución de valoraciones
            </p>
            <VisitSparkline visits={report.visits} />
          </div>
        )}

        {/* ── Visits list ── */}
        {report.visits.length > 0 && (
          <div style={{ background: '#111827', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.375rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#475569', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1.125rem', fontFamily: 'var(--font-body, system-ui)' }}>
              Seguimiento · {report.visits.length} visita{report.visits.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {report.visits.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ratingColor(v.valoracion), flexShrink: 0, boxShadow: `0 0 8px ${ratingColor(v.valoracion)}60` }} />
                    <span style={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-body, system-ui)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.partido}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body, system-ui)' }}>{formatDate(v.fecha)}</span>
                    <span style={{ fontFamily: 'var(--font-condensed, system-ui)', fontWeight: 900, fontSize: '1rem', color: ratingColor(v.valoracion), background: ratingBg(v.valoracion), padding: '0.15rem 0.5rem', borderRadius: 6, minWidth: 44, textAlign: 'center' }}>
                      {v.valoracion}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }} />
            <span style={{ fontFamily: 'var(--font-condensed, system-ui)', fontWeight: 900, fontSize: '0.9rem', color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Volea Scouting
            </span>
            <span style={{ color: '#334155', fontSize: '0.75rem' }}>· voleascouting.com</span>
          </div>
          <div style={{ color: '#334155', fontSize: '0.75rem' }}>
            Generado el {new Date(report.sharedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <em style={{ fontStyle: 'italic', color: '#1e293b' }}>Documento confidencial</em>
          </div>
        </div>

      </div>
    </div>
  );
}
