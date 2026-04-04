'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSharedReport } from '@/lib/visits';
import { SharedReport } from '@/types/visit';

// ─── Radar chart (light mode) ──────────────────────────────────────────────

function RadarChart({ metrics }: { metrics: SharedReport['metrics'] }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const axes = [
    { key: 'technical', label: 'Técnica',  color: '#7C3AED' },
    { key: 'tactical',  label: 'Táctica',  color: '#3B82F6' },
    { key: 'physical',  label: 'Físico',   color: '#10B981' },
    { key: 'attitude',  label: 'Actitud',  color: '#F59E0B' },
  ] as const;
  const n = axes.length;

  const point = (angle: number, pct: number) => ({
    x: cx + r * pct * Math.cos(angle - Math.PI / 2),
    y: cy + r * pct * Math.sin(angle - Math.PI / 2),
  });

  const gridPolygon = (level: number) =>
    axes.map((_, i) => {
      const p = point((2 * Math.PI * i) / n, level / 5);
      return `${p.x},${p.y}`;
    }).join(' ');

  const dataPolygon = axes.map((a, i) => {
    const p = point((2 * Math.PI * i) / n, (metrics[a.key] ?? 0) / 10);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* grid */}
      {[1, 2, 3, 4, 5].map(l => (
        <polygon key={l} points={gridPolygon(l)}
          fill="none" stroke="#E5E7EB" strokeWidth="1" />
      ))}
      {/* axes */}
      {axes.map((a, i) => {
        const p = point((2 * Math.PI * i) / n, 1);
        return <line key={a.key} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#D1D5DB" strokeWidth="1" />;
      })}
      {/* data */}
      <polygon points={dataPolygon} fill="rgba(124,58,237,0.2)" stroke="#7C3AED" strokeWidth="2" />
      {/* dots + values */}
      {axes.map((a, i) => {
        const pct = (metrics[a.key] ?? 0) / 10;
        const p = point((2 * Math.PI * i) / n, pct);
        return (
          <g key={a.key}>
            <circle cx={p.x} cy={p.y} r={4} fill={a.color} />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="11"
              fontWeight="700" fill={a.color}>{metrics[a.key]}</text>
          </g>
        );
      })}
      {/* labels */}
      {axes.map((a, i) => {
        const p = point((2 * Math.PI * i) / n, 1.2);
        return (
          <text key={a.key} x={p.x} y={p.y} textAnchor="middle"
            dominantBaseline="middle" fontSize="11" fontWeight="600" fill="#374151">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function ratingColor(v: number) {
  if (v >= 8) return '#16A34A';
  if (v >= 6) return '#D97706';
  return '#DC2626';
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const METRIC_CONFIG = [
  { key: 'technical' as const, label: 'Técnica',  color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  { key: 'tactical'  as const, label: 'Táctica',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'physical'  as const, label: 'Físico',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'attitude'  as const, label: 'Actitud',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
];

const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo', seguimiento: 'Seguimiento', espera: 'En espera', descartado: 'Descartado',
};
const STATUS_COLORS: Record<string, string> = {
  activo: '#22C55E', seguimiento: '#3B82F6', espera: '#F59E0B', descartado: '#EF4444',
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SharedReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    getSharedReport(reportId)
      .then(r => {
        if (!r) { setNotFound(true); } else { setReport(r); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Cargando informe…</p>
        </div>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            Informe no encontrado
          </h2>
          <p>El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  const avg = Math.round(
    (report.metrics.technical + report.metrics.tactical +
     report.metrics.physical + report.metrics.attitude) / 4
  );
  const avgVisit = report.visits.length
    ? (report.visits.reduce((s, v) => s + v.valoracion, 0) / report.visits.length).toFixed(1)
    : null;
  const age = calcAge(report.playerBirthDate);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header bar ── */}
      <div style={{ background: '#0B0F1A', padding: '0.875rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1rem', color: 'white' }}>M</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Volea Scouting</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
            Compartido el {formatDate(report.sharedAt.split('T')[0])} · por {report.sharedBy}
          </span>
          <button
            onClick={() => window.print()}
            style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none',
              background: 'rgba(124,58,237,0.3)', color: '#C4B5FD', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600 }}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Hero ── */}
        <div style={{ background: 'linear-gradient(135deg,#0B0F1A 0%,#1e1b4b 100%)',
          borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {report.playerName.charAt(0).toUpperCase()}
          </div>
          {/* Name + info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'white',
              letterSpacing: '-0.02em' }}>{report.playerName}</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
              {report.playerPosition} · {report.playerClub} · {report.playerCity}
            </p>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                fontWeight: 600, background: 'rgba(124,58,237,0.3)', color: '#C4B5FD' }}>
                {report.playerCategory}
              </span>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                {report.playerDivision}
              </span>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                fontWeight: 600,
                background: `${STATUS_COLORS[report.playerStatus] ?? '#6B7280'}20`,
                color: STATUS_COLORS[report.playerStatus] ?? '#6B7280' }}>
                {STATUS_LABELS[report.playerStatus] ?? report.playerStatus}
              </span>
            </div>
          </div>
          {/* Rating badge */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%',
              background: `${ratingColor(avg)}20`, border: `3px solid ${ratingColor(avg)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: ratingColor(avg),
                lineHeight: 1 }}>{avg}</span>
              <span style={{ fontSize: '0.55rem', color: ratingColor(avg), fontWeight: 600 }}>/10</span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
              Valoración global
            </p>
          </div>
        </div>

        {/* ── 3-column grid: metrics | radar | personal data ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* Metrics */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700,
              color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Métricas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {METRIC_CONFIG.map(mc => (
                <div key={mc.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                      {mc.label}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: mc.color }}>
                      {report.metrics[mc.key]}
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3,
                      width: `${(report.metrics[mc.key] / 10) * 100}%`,
                      background: mc.color, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            {avgVisit && (
              <div style={{ marginTop: '1rem', padding: '0.625rem', borderRadius: '8px',
                background: '#F9FAFB', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800,
                  color: ratingColor(parseFloat(avgVisit)) }}>{avgVisit}</div>
                <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                  Media visitas ({report.visits.length})
                </div>
              </div>
            )}
          </div>

          {/* Radar */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 700,
              color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em',
              alignSelf: 'flex-start' }}>
              Radar
            </h3>
            <RadarChart metrics={report.metrics} />
          </div>

          {/* Personal data */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700,
              color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ficha personal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: 'Edad',       value: age ? `${age} años` : '—' },
                { label: 'Fecha nac.', value: formatDate(report.playerBirthDate) || '—' },
                { label: 'Posición',   value: report.playerPosition || '—' },
                { label: 'Pie',        value: report.playerFoot
                    ? report.playerFoot.charAt(0).toUpperCase() + report.playerFoot.slice(1)
                    : '—' },
                { label: 'Altura',     value: report.playerHeight ? `${report.playerHeight} cm` : '—' },
                { label: 'Peso',       value: report.playerWeight ? `${report.playerWeight} kg` : '—' },
                { label: 'Club',       value: report.playerClub || '—' },
                { label: 'Ciudad',     value: report.playerCity || '—' },
                { label: 'Categoría', value: report.playerCategory || '—' },
                { label: 'División',  value: report.playerDivision || '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.8rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tags ── */}
        {report.playerTags && report.playerTags.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem',
            marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700,
              color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Etiquetas
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {report.playerTags.map((t, i) => (
                <span key={i} style={{ padding: '0.25rem 0.75rem', borderRadius: '20px',
                  background: 'rgba(124,58,237,0.1)', color: '#7C3AED',
                  fontSize: '0.8rem', fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Analysis ── */}
        {report.analysis && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem',
            marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #7C3AED' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700,
              color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Análisis del Scout
            </h3>
            {report.analysis.split('\n\n').map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : '0.75rem 0 0',
                color: '#374151', fontSize: '0.9rem', lineHeight: 1.65 }}>
                {para}
              </p>
            ))}
          </div>
        )}

        {/* ── Visits ── */}
        {report.visits && report.visits.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem',
            marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700,
              color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Últimas Visitas ({report.visits.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {report.visits.map((v, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${ratingColor(v.valoracion)}`,
                  paddingLeft: '1rem', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>
                        {v.partido}
                      </span>
                      <span style={{ marginLeft: '0.5rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
                        {formatDate(v.fecha)}
                      </span>
                    </div>
                    <div style={{ padding: '0.15rem 0.5rem', borderRadius: '6px',
                      background: `${ratingColor(v.valoracion)}15`,
                      color: ratingColor(v.valoracion), fontWeight: 700, fontSize: '0.875rem',
                      flexShrink: 0 }}>
                      {v.valoracion}/10
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.825rem', lineHeight: 1.5 }}>
                    {v.nota}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem',
          padding: '1.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', marginBottom: '0.375rem' }}>
            <div style={{ width: 20, height: 20, borderRadius: '5px',
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.7rem', color: 'white' }}>M</div>
            <span style={{ fontWeight: 700, color: '#6B7280' }}>Volea Scouting</span>
          </div>
          <p style={{ margin: 0 }}>
            Informe generado el {new Date(report.sharedAt).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#D1D5DB' }}>
            Este informe es confidencial y está destinado exclusivamente al uso profesional.
          </p>
        </div>

      </div>

      <style>{`
        @media print {
          button { display: none !important; }
          body { background: white !important; }
        }
        @media (max-width: 700px) {
          .report-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
