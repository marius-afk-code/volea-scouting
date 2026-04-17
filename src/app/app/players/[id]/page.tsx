'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AppNav from '@/components/AppNav';
import { getPlayer } from '@/lib/players';
import { getVisits, addVisit, deleteVisit, saveSharedReport } from '@/lib/visits';
import { DEMO_PLAYERS, DEMO_VISITS } from '@/lib/demo-data';
import { Player } from '@/types/player';
import { Visit } from '@/types/visit';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function avgMetrics(p: Player): number {
  const { technical, tactical, physical, attitude } = p.metrics;
  return Math.round(((technical + tactical + physical + attitude) / 4) * 10) / 10;
}

function ratingColor(v: number): string {
  return v >= 8 ? '#22C55E' : v >= 6 ? '#F59E0B' : '#EF4444';
}

function ratingBg(v: number): string {
  return v >= 8 ? 'rgba(34,197,94,0.12)' : v >= 6 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

function metricLabel(key: string): string {
  return { technical: 'Técnica', tactical: 'Táctica', physical: 'Físico', attitude: 'Actitud' }[key] ?? key;
}

function metricColor(key: string): string {
  return { technical: '#7C3AED', tactical: '#3B82F6', physical: '#10B981', attitude: '#F59E0B' }[key] ?? '#7C3AED';
}

// ─── Smart analysis (algorithmic fallback) ────────────────────────────────────

function generateAnalysis(player: Player, visits: Visit[]): string {
  const avg = avgMetrics(player);
  const { technical: t, tactical: ta, physical: ph, attitude: at } = player.metrics;

  const entries = [['technical', t], ['tactical', ta], ['physical', ph], ['attitude', at]] as const;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const best    = metricLabel(sorted[0][0]);
  const weakest = metricLabel(sorted[sorted.length - 1][0]);
  const bestVal    = sorted[0][1];
  const weakestVal = sorted[sorted.length - 1][1];

  const recentVisits = visits.slice(0, 5);
  const avgRating = recentVisits.length
    ? (recentVisits.reduce((s, v) => s + v.valoracion, 0) / recentVisits.length).toFixed(1)
    : null;

  const levelDesc = avg >= 7.5 ? 'destacado' : avg >= 6 ? 'interesante' : 'en desarrollo';
  const bestDesc = {
    Técnica:  'resolver situaciones con el balón y generar juego',
    Táctica:  'leer el partido, posicionarse y tomar decisiones rápidas',
    Físico:   'imponerse en duelos y mantener la intensidad los 90 minutos',
    Actitud:  'liderar al equipo y aportar en los momentos decisivos',
  }[best] ?? 'destacar en su posición';

  const p1 = `${player.name} es un ${player.position}${player.category ? ` de categoría ${player.category}` : ''} que actualmente milita en ${player.club || 'su club actual'}${player.city ? ` (${player.city})` : ''}${player.division ? `, competición ${player.division}` : ''}. Con una valoración global de ${avg}/10, el jugador presenta un perfil ${levelDesc} para su nivel.`;

  const p2 = `Entre sus principales fortalezas destaca su ${best.toLowerCase()} (${bestVal}/10), que le permite ${bestDesc}.${avgRating ? ` En las ${recentVisits.length} visita${recentVisits.length > 1 ? 's' : ''} del periodo de seguimiento ha obtenido una valoración media de ${avgRating}/10.` : ''}`;

  const p3 = `Como área de mejora prioritaria se identifica la ${weakest.toLowerCase()} (${weakestVal}/10), aspecto en el que puede crecer con trabajo específico y continuado. El perfil global del jugador justifica ${player.status === 'activo' ? 'mantener un seguimiento activo' : player.status === 'seguimiento' ? 'continuar el seguimiento en próximas convocatorias' : 'evaluar su evolución en la próxima temporada'}.`;

  return [p1, p2, p3].join('\n\n');
}

// ─── Radar Chart SVG (React component for the page) ──────────────────────────

function RadarChart({ metrics, dark = true }: { metrics: Player['metrics']; dark?: boolean }) {
  const dims = [
    { key: 'technical', label: 'Técnica' },
    { key: 'tactical',  label: 'Táctica' },
    { key: 'physical',  label: 'Físico' },
    { key: 'attitude',  label: 'Actitud' },
  ];
  const size = 220;
  const cx = size / 2, cy = size / 2, R = size * 0.33;
  const n = 4, sa = -Math.PI / 2, step = (2 * Math.PI) / n;
  const levels = 5;

  const po = (a: number, r: number): [number, number] => [
    cx + r * Math.cos(a),
    cy + r * Math.sin(a),
  ];

  const gridColor   = dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';
  const labelColor  = dark ? '#94A3B8' : '#64748B';
  const valueColor  = dark ? '#A78BFA' : '#7C3AED';

  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const r = R * (l + 1) / levels;
    return Array.from({ length: n }, (__, i) => po(sa + i * step, r).join(',')).join(' ');
  });

  const values = dims.map(d => metrics[d.key as keyof typeof metrics]);

  const dataPoints = values
    .map((v, i) => po(sa + i * step, R * Math.max(0.5, v) / 10).join(','))
    .join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {gridPolygons.map((pts, l) => (
        <polygon key={l} points={pts} fill="none"
          stroke={gridColor}
          strokeWidth={l === levels - 1 ? 1.5 : 0.8} />
      ))}
      {dims.map((_, i) => {
        const [x, y] = po(sa + i * step, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={gridColor} strokeWidth={0.8} />;
      })}
      {dims.map((d, i) => {
        const [lx, ly] = po(sa + i * step, R + 24);
        const anchor = Math.abs(lx - cx) < 5 ? 'middle' : lx > cx ? 'start' : 'end';
        return (
          <text key={i} x={lx} y={ly + 4} textAnchor={anchor}
            fontSize={11} fontWeight={600} fill={labelColor}
            fontFamily="system-ui">
            {d.label}
          </text>
        );
      })}
      <polygon points={dataPoints}
        fill="rgba(124,58,237,0.2)" stroke="#7C3AED"
        strokeWidth={2.5} strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = po(sa + i * step, R * Math.max(0.5, v) / 10);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={5} fill="#7C3AED"
              stroke={dark ? 'rgba(255,255,255,0.2)' : '#fff'} strokeWidth={2} />
            <text x={x} y={y - 10} textAnchor="middle"
              fontSize={10} fontWeight={800} fill={valueColor}
              fontFamily="system-ui">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Radar SVG string (for PDF / shared report HTML template) ─────────────────

function buildRadarSvgString(metrics: Player['metrics']): string {
  const dims = [
    { key: 'technical', label: 'Técnica' },
    { key: 'tactical',  label: 'Táctica' },
    { key: 'physical',  label: 'Físico' },
    { key: 'attitude',  label: 'Actitud' },
  ];
  const size = 240, cx = size / 2, cy = size / 2, R = size * 0.33;
  const n = 4, sa = -Math.PI / 2, step = (2 * Math.PI) / n;
  const po = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;

  for (let l = 1; l <= 5; l++) {
    const r = R * l / 5;
    const pts = Array.from({ length: n }, (_, i) => po(sa + i * step, r).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="${l === 5 ? '#D1D5DB' : '#E5E7EB'}" stroke-width="${l === 5 ? 1.5 : 0.8}"/>`;
  }
  dims.forEach((d, i) => {
    const [x, y] = po(sa + i * step, R);
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E5E7EB" stroke-width="0.8"/>`;
    const [lx, ly] = po(sa + i * step, R + 24);
    const anchor = Math.abs(lx - cx) < 5 ? 'middle' : lx > cx ? 'start' : 'end';
    s += `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" font-size="12" font-weight="600" fill="#64748B" font-family="Inter,system-ui">${d.label}</text>`;
  });

  const values = dims.map(d => metrics[d.key as keyof typeof metrics]);
  const dp = values.map((v, i) => po(sa + i * step, R * Math.max(0.5, v) / 10).join(',')).join(' ');
  s += `<polygon points="${dp}" fill="rgba(124,58,237,0.2)" stroke="#7C3AED" stroke-width="2.5" stroke-linejoin="round"/>`;
  values.forEach((v, i) => {
    const [x, y] = po(sa + i * step, R * Math.max(0.5, v) / 10);
    s += `<circle cx="${x}" cy="${y}" r="5" fill="#7C3AED" stroke="#fff" stroke-width="2"/>`;
    s += `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="11" font-weight="800" fill="#7C3AED" font-family="Inter,system-ui">${v}</text>`;
  });
  return s + '</svg>';
}

// ─── Report HTML template ─────────────────────────────────────────────────────

function buildReportHTML(player: Player, visits: Visit[], analysis: string): string {
  const avg = avgMetrics(player);
  const rc = (v: number) => v >= 8 ? '#059669' : v >= 6 ? '#D97706' : '#DC2626';
  const esc = (s: string | number) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const metricDefs = [
    { key: 'technical', label: 'Técnica',  color: '#7C3AED' },
    { key: 'tactical',  label: 'Táctica',  color: '#3B82F6' },
    { key: 'physical',  label: 'Físico',   color: '#10B981' },
    { key: 'attitude',  label: 'Actitud',  color: '#F59E0B' },
  ];

  const scoreBoxes = metricDefs.map(({ key, label, color }) => {
    const v = player.metrics[key as keyof typeof player.metrics];
    return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 10px;text-align:center">
      <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${label}</div>
      <div style="font-size:28px;font-weight:800;color:${rc(v)};line-height:1">${v}</div>
      <div style="margin-top:8px;height:5px;border-radius:3px;background:#f1f5f9">
        <div style="height:5px;border-radius:3px;background:${color};width:${v * 10}%"></div>
      </div>
    </div>`;
  }).join('');

  const progressBars = metricDefs.map(({ key, label, color }) => {
    const v = player.metrics[key as keyof typeof player.metrics];
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:12px;font-weight:600;color:#64748B">${label}</span>
        <span style="font-size:12px;font-weight:800;color:${color}">${v}/10</span>
      </div>
      <div style="height:6px;border-radius:3px;background:#F1F5F9">
        <div style="height:6px;border-radius:3px;background:${color};width:${v * 10}%"></div>
      </div>
    </div>`;
  }).join('');

  const tagsHTML = player.tags.length
    ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px">
        ${player.tags.map(t => `<span style="font-size:11px;padding:3px 10px;border-radius:99px;background:#EDE9FE;color:#5B21B6;font-weight:600">${esc(t)}</span>`).join('')}
       </div>`
    : '';

  const ir = (k: string, v: string) =>
    `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f8fafc;font-size:13px">
      <span style="color:#64748b">${k}</span>
      <span style="font-weight:600;color:#1e293b">${v}</span>
     </div>`;

  const analysisHTML = analysis
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 14px;font-size:14px;line-height:1.85;color:#1e293b">${esc(p)}</p>`)
    .join('');

  const visitsHTML = visits.slice(0, 6).map((v, i) => `
    <div style="display:flex;gap:0;margin-bottom:${i < visits.length - 1 ? '20px' : '0'}">
      <div style="display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0">
        <div style="width:28px;height:28px;border-radius:50%;background:#7C3AED;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${i + 1}</div>
        ${i < visits.slice(0, 6).length - 1 ? '<div style="width:1px;flex:1;background:#e2e8f0;margin:4px 0;min-height:16px"></div>' : ''}
      </div>
      <div style="flex:1;padding-left:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
          <span style="font-size:12px;font-weight:700;color:#0B0F1A">${esc(v.partido)}</span>
          <span style="font-size:11px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px">${esc(v.fecha)}</span>
          ${v.valoracion ? `<span style="font-size:12px;font-weight:800;color:${rc(v.valoracion)};background:${v.valoracion >= 8 ? '#D1FAE5' : v.valoracion >= 6 ? '#FEF3C7' : '#FEE2E2'};padding:1px 8px;border-radius:6px">${v.valoracion}/10</span>` : ''}
        </div>
        <p style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;margin:0">${esc(v.nota) || 'Sin notas'}</p>
      </div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe Scout — ${esc(player.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:12mm;size:A4}
  .no-print{position:fixed;top:16px;right:16px;z-index:100;display:flex;gap:8px}
  .no-print button{font-family:'Inter',system-ui;font-size:13px;padding:10px 20px;border-radius:8px;cursor:pointer;border:none;font-weight:700}
  @media print{.no-print{display:none!important}body{background:#fff}}
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()" style="background:#7C3AED;color:#fff">🖨️ Guardar como PDF</button>
  <button onclick="window.close()" style="background:#fff;color:#374151;border:1px solid #d1d5db">✕ Cerrar</button>
</div>

<!-- Header -->
<div style="background:#0B0F1A;color:#fff;position:relative;overflow:hidden">
  <div style="height:5px;background:linear-gradient(90deg,#7C3AED,#8B5CF6,#A78BFA)"></div>
  <div style="padding:32px 48px;display:flex;align-items:flex-start;gap:24px">
    <div style="width:68px;height:68px;border-radius:16px;background:rgba(124,58,237,.2);border:2px solid rgba(124,58,237,.4);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#c4b5fd;flex-shrink:0">
      ${esc(player.name.charAt(0).toUpperCase())}
    </div>
    <div style="flex:1">
      <div style="font-size:10px;letter-spacing:.14em;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;font-weight:600">Informe de Scouting · Volea Scouting</div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-.02em;margin-bottom:6px">${esc(player.name)}</div>
      <div style="font-size:14px;color:#94a3b8;margin-bottom:14px">${esc(player.position)} &nbsp;·&nbsp; ${esc(player.club || '—')} &nbsp;·&nbsp; ${esc(player.category || '—')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${[
          player.foot ? `Pie ${player.foot}` : '',
          player.height ? `${player.height} cm` : '',
          player.weight ? `${player.weight} kg` : '',
          player.birthDate ? `Nac. ${formatDate(player.birthDate)}` : '',
          `${visits.length} visita${visits.length !== 1 ? 's' : ''}`,
        ].filter(Boolean).map(c => `<span style="font-size:11px;padding:4px 12px;border-radius:99px;background:rgba(255,255,255,.08);color:#cbd5e1;font-weight:500">${esc(c)}</span>`).join('')}
      </div>
    </div>
    <div style="text-align:center;background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.35);border-radius:14px;padding:16px 20px;flex-shrink:0">
      <div style="font-size:10px;letter-spacing:.1em;color:#c4b5fd;text-transform:uppercase;margin-bottom:4px;font-weight:700">Nota global</div>
      <div style="font-size:46px;font-weight:800;color:#fff;line-height:1">${avg}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px">sobre 10</div>
    </div>
  </div>
</div>

<!-- Body -->
<div style="max-width:780px;margin:0 auto;padding:32px 48px">

  <!-- Valoración scout -->
  <div style="margin-bottom:28px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#7C3AED;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #F5F3FF">Valoración scout</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
      <div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">${scoreBoxes}</div>
        ${progressBars}
      </div>
      <div style="text-align:center;padding:12px">${buildRadarSvgString(player.metrics)}</div>
    </div>
  </div>

  ${tagsHTML}

  <!-- Datos -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px">
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#7C3AED;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #F5F3FF">Datos del jugador</div>
      ${ir('Posición', esc(player.position))}
      ${ir('Categoría', esc(player.category || '—'))}
      ${ir('División', esc(player.division || '—'))}
      ${ir('Club actual', esc(player.club || '—'))}
      ${ir('Ciudad', esc(player.city || '—'))}
      ${ir('Pie dominante', esc(player.foot || '—'))}
      ${ir('Altura', player.height ? `${player.height} cm` : '—')}
      ${ir('Peso', player.weight ? `${player.weight} kg` : '—')}
      ${ir('Nacimiento', formatDate(player.birthDate))}
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#7C3AED;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #F5F3FF">Estado de seguimiento</div>
      ${ir('Estado', esc(player.status || '—'))}
      ${player.tags.length ? ir('Etiquetas', player.tags.join(', ')) : ''}
      ${player.privateNotes ? `<div style="margin-top:12px;font-size:12px;color:#64748b;line-height:1.7">${esc(player.privateNotes)}</div>` : ''}
    </div>
  </div>

  <!-- Análisis -->
  <div style="margin-bottom:28px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#7C3AED;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #F5F3FF">Análisis del scout</div>
    <div style="background:#F5F3FF;border-left:4px solid #7C3AED;padding:22px 24px;border-radius:0 10px 10px 0">
      ${analysisHTML}
    </div>
  </div>

  <!-- Visitas -->
  ${visits.length > 0 ? `
  <div style="margin-bottom:28px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#7C3AED;margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid #F5F3FF">
      Historial de seguimiento — ${visits.length} visita${visits.length !== 1 ? 's' : ''}
    </div>
    ${visitsHTML}
  </div>` : ''}

</div>

<!-- Footer -->
<div style="background:#0B0F1A;padding:16px 48px;display:flex;justify-content:space-between;align-items:center">
  <span style="font-size:11px;color:#475569">Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
  <div style="display:flex;align-items:center;gap:8px">
    <div style="width:6px;height:6px;border-radius:50%;background:#7C3AED"></div>
    <span style="font-size:12px;color:#64748b;font-weight:600">Volea Scouting · Scouting &amp; Analytics</span>
  </div>
</div>
</body>
</html>`;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputS: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '0.625rem 0.875rem',
  color: '#111827',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'var(--font-body)',
};

const labelS: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '0.72rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: '0.375rem',
};

const STATUS_CONFIG = {
  activo:      { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  label: 'Activo' },
  seguimiento: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Seguimiento' },
  espera:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'En espera' },
  descartado:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Descartado' },
} as const;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlayerDetailPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Visit form
  const [vFecha, setVFecha]       = useState(todayISO());
  const [vPartido, setVPartido]   = useState('');
  const [vNota, setVNota]         = useState('');
  const [vValoracion, setVVal]    = useState(7);
  const [savingVisit, setSavingVisit] = useState(false);
  const [visitError, setVisitError]   = useState('');

  // Delete visit
  const [confirmVisit, setConfirmVisit] = useState<Visit | null>(null);

  // Report / share
  const [generatingReport, setGeneratingReport] = useState(false);
  const [sharing, setSharing]   = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  // Evolution AI analysis
  const [evoAiText, setEvoAiText]     = useState('');
  const [evoAiLoading, setEvoAiLoading] = useState(false);

  // Compute evolution data from visits (memoized)
  const evoData = useMemo(() => {
    const rated = [...visits]
      .filter(v => v.valoracion > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (rated.length < 2) return null;

    const labels = rated.map(v => v.fecha);
    const data   = rated.map(v => v.valoracion);

    // Linear regression for trend line
    const n  = data.length;
    const xm = (n - 1) / 2;
    const ym = data.reduce((s, v) => s + v, 0) / n;
    let num = 0, den = 0;
    data.forEach((y, i) => { num += (i - xm) * (y - ym); den += (i - xm) ** 2; });
    const slope = den ? num / den : 0;
    const intercept = ym - slope * xm;
    const trend = data.map((_, i) => Math.round((slope * i + intercept) * 10) / 10);

    // Trend badge
    const half = Math.ceil(n / 2);
    const firstAvg = data.slice(0, half).reduce((s, v) => s + v, 0) / half;
    const lastAvg  = data.slice(half).reduce((s, v) => s + v, 0) / (n - half);
    const diff = lastAvg - firstAvg;
    const badge = diff > 0.5
      ? { label: '↑ Mejorando', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' }
      : diff < -0.5
        ? { label: '↓ Empeorando', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
        : { label: '→ Estable', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };

    return { labels, data, trend, badge, rated };
  }, [visits]);

  // Auth guard
  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  // Load player + visits in parallel
  useEffect(() => {
    if (!playerId) return;
    if (isDemo) {
      const demoPlayer = DEMO_PLAYERS.find(p => p.id === playerId) ?? null;
      const demoVisits = DEMO_VISITS[playerId] ?? [];
      setPlayer(demoPlayer);
      setVisits(demoVisits);
      setLoadingData(false);
      return;
    }
    Promise.all([getPlayer(playerId), getVisits(playerId)])
      .then(([p, v]) => { setPlayer(p); setVisits(v); })
      .catch(err => { console.error('Error cargando datos:', err); setLoadError('Error al cargar los datos del jugador. Recarga la página.'); })
      .finally(() => setLoadingData(false));
  }, [playerId, isDemo]);

  // ── Visit handlers ──
  async function handleAddVisit() {
    if (isDemo) { setVisitError('Las visitas no se pueden guardar en modo demo.'); return; }
    if (!player || !vFecha || !vPartido.trim()) {
      setVisitError('Indica la fecha y el partido.');
      return;
    }
    setVisitError('');
    setSavingVisit(true);
    try {
      const now = new Date().toISOString();
      const id = await addVisit(player.id, {
        fecha: vFecha, partido: vPartido.trim(),
        nota: vNota.trim(), valoracion: vValoracion, createdAt: now,
      });
      const newVisit: Visit = {
        id, fecha: vFecha, partido: vPartido.trim(),
        nota: vNota.trim(), valoracion: vValoracion, createdAt: now,
      };
      setVisits(prev => [newVisit, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setVFecha(todayISO()); setVPartido(''); setVNota(''); setVVal(7);
    } catch (err: unknown) {
      setVisitError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingVisit(false);
    }
  }

  async function handleDeleteVisit() {
    if (!player || !confirmVisit) return;
    if (isDemo) { setConfirmVisit(null); return; }
    try {
      await deleteVisit(player.id, confirmVisit.id);
      setVisits(prev => prev.filter(v => v.id !== confirmVisit.id));
      setConfirmVisit(null);
    } catch (err: unknown) {
      console.error(err);
      setVisitError(err instanceof Error ? err.message : 'Error al eliminar la visita');
    }
  }

  // ── Report generation (opens in new tab via blob URL) ──
  function handleGenerateReport() {
    if (!player) return;
    setGeneratingReport(true);
    try {
      const analysis = generateAnalysis(player, visits);
      const html = buildReportHTML(player, visits, analysis);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setGeneratingReport(false);
    }
  }

  // ── Share: save snapshot to Firestore, show URL ──
  async function handleShare() {
    if (!player || (!user && !isDemo)) return;
    if (isDemo) { setShareUrl('https://volea.app/report/demo-example'); setSharing(false); return; }
    setSharing(true);
    try {
      const analysis = generateAnalysis(player, visits);
      const reportId = await saveSharedReport({
        playerName: player.name,
        playerPosition: player.position,
        playerClub: player.club,
        playerCity: player.city,
        playerCategory: player.category,
        playerDivision: player.division,
        playerBirthDate: player.birthDate,
        playerFoot: player.foot,
        playerHeight: player.height,
        playerWeight: player.weight,
        playerStatus: player.status,
        playerTags: player.tags,
        metrics: player.metrics,
        visits: visits.slice(0, 6).map(v => ({
          fecha: v.fecha, partido: v.partido,
          nota: v.nota, valoracion: v.valoracion,
        })),
        analysis,
        sharedAt: new Date().toISOString(),
        sharedBy: user?.email ?? '',
      });
      setShareUrl(`${window.location.origin}/shared/${reportId}`);
    } catch (err: unknown) {
      console.error(err);
      setVisitError(err instanceof Error ? err.message : 'Error al generar el enlace compartido');
    } finally {
      setSharing(false);
    }
  }

  async function handleEvoAI() {
    if (!player || !evoData) return;
    setEvoAiLoading(true);
    setEvoAiText('');
    const visitsText = evoData.rated
      .map((v, i) => `Visita ${i+1} (${v.fecha}) — ${v.partido} — Nota: ${v.valoracion}/10\n${v.nota || 'Sin comentarios'}`)
      .join('\n\n');
    const prompt = `Eres un analista de scouting de fútbol base. Analiza la EVOLUCIÓN de este jugador.\n\nJUGADOR: ${player.name} | ${player.position} | ${player.category} | Club: ${player.club}\n\nVISITAS (orden cronológico):\n${visitsText}\n\nEscribe EXACTAMENTE 3 frases cortas y directas (sin numeración, sin títulos):\n1. Cómo era en las primeras visitas\n2. Cómo ha cambiado y en qué aspectos\n3. Tendencia actual y recomendación concreta\nEspañol, 60-90 palabras total.`;
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 400 }),
      });
      const json = await res.json() as { text?: string };
      setEvoAiText(json.text ?? fallbackEvoText());
    } catch {
      setEvoAiText(fallbackEvoText());
    } finally {
      setEvoAiLoading(false);
    }
  }

  function fallbackEvoText(): string {
    if (!player || !evoData) return '';
    const nom = player.name.split(' ')[0];
    const { data, badge } = evoData;
    const half = Math.ceil(data.length / 2);
    const firstAvg = (data.slice(0, half).reduce((s,v)=>s+v,0)/half).toFixed(1);
    const lastAvg  = (data.slice(half).reduce((s,v)=>s+v,0)/(data.length-half)).toFixed(1);
    return `${nom} comenzó con una valoración media de ${firstAvg}/10 en sus primeras visitas. En las últimas su media es ${lastAvg}/10, mostrando una tendencia ${badge.label.toLowerCase().replace('→ ','').replace('↑ ','').replace('↓ ','')}. ${parseFloat(lastAvg) > parseFloat(firstAvg) ? 'Progresión positiva — buen momento para activar contacto.' : parseFloat(lastAvg) < parseFloat(firstAvg) ? 'Conviene investigar las causas y reevaluar antes de decidir.' : 'Rendimiento consistente — seguir monitorizando para detectar cambios.'}`;
  }

  function handleCopyShare() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }

  // ─────────────────── Render ─────────────────────────────────────────────────

  if (loading || loadingData) return (
    <main style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#475569' }}>Cargando…</p>
    </main>
  );

  if (loadError) return (
    <main style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#F87171', fontFamily: 'var(--font-body)' }}>{loadError}</p>
    </main>
  );

  if (!player) return (
    <main style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <p style={{ color: '#475569' }}>Jugador no encontrado.</p>
      <Link href="/app" style={{ color: 'var(--purple-3)' }}>← Volver a la lista</Link>
    </main>
  );

  const avg = avgMetrics(player);
  const sc  = STATUS_CONFIG[player.status] ?? STATUS_CONFIG.espera;

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <AppNav activePage="players" />

      {/* Breadcrumb + actions */}
      <div style={{
        borderBottom: '1px solid #E5E7EB',
        padding: '0 1.5rem',
        background: '#FFFFFF',
        position: 'relative', zIndex: 20,
        paddingTop: '4rem',
      }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/app" style={{ color: '#6B7280', fontSize: '0.82rem', textDecoration: 'none' }}>Jugadores</Link>
            <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>/</span>
            <span style={{ color: '#111827', fontSize: '0.82rem', fontWeight: 500 }}>{player.name}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <Link href={`/app/${player.id}`} style={{
              color: '#6B7280', fontSize: '0.78rem', textDecoration: 'none',
              padding: '0.4rem 0.875rem', border: '1px solid #E5E7EB',
              borderRadius: '7px',
            }}>
              Editar
            </Link>
            <Link href={`/app/players/${player.id}/cv`} style={{
              color: '#6B7280', fontSize: '0.78rem', textDecoration: 'none',
              padding: '0.4rem 0.875rem', border: '1px solid #E5E7EB',
              borderRadius: '7px',
            }}>
              Sports CV
            </Link>
            <button onClick={handleGenerateReport} disabled={generatingReport}
              style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)', padding: '0.4rem 0.875rem', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {generatingReport ? 'Generando…' : 'Informe PDF'}
            </button>
            <button onClick={handleShare} disabled={sharing}
              style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.875rem', borderRadius: '7px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {sharing ? 'Compartiendo…' : 'Compartir'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Share URL box ── */}
      {shareUrl && (
        <div style={{ backgroundColor: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '0.75rem 2rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#A78BFA', fontSize: '0.8rem', fontWeight: '600' }}>🔗 Enlace para compartir (válido 30 días):</span>
            <span style={{ color: '#111827', fontSize: '0.78rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
            <button onClick={handleCopyShare}
              style={{ backgroundColor: shareCopied ? '#22C55E' : '#7C3AED', color: 'white', border: 'none', padding: '0.375rem 0.875rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>
              {shareCopied ? '✓ Copiado' : 'Copiar enlace'}
            </button>
            <button onClick={() => setShareUrl('')}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '1rem' }}>×</button>
          </div>
        </div>
      )}

      {/* ── Content panel ── */}
      <div style={{ background: '#FAFAFA', minHeight: '60vh', paddingTop: '2rem', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0' }}>

        {/* ══ HERO ══ */}
        <div className="mm-fade-up" style={{
          background: '#FFFFFF',
          borderRadius: '16px', padding: '1.75rem 2rem', marginBottom: '1.5rem',
          border: '1px solid #E5E7EB', position: 'relative', overflow: 'hidden',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#7C3AED,#A78BFA,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: '80px', height: '80px', borderRadius: '18px', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 0 24px rgba(124,58,237,0.2)' }}>
              {player.photoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.photoBase64} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              ) : (
                <span style={{ color: '#A78BFA', fontSize: '28px', fontWeight: '900', fontFamily: 'var(--font-condensed)', letterSpacing: '-0.02em' }}>{player.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                <h1 style={{ color: '#111827', fontSize: '2rem', margin: 0, fontFamily: 'var(--font-condensed)', letterSpacing: '0.02em', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>{player.name}</h1>
                <span style={{ background: sc.bg, color: sc.color, padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
              </div>
              <p style={{ color: '#6B7280', margin: '0 0 0.625rem', fontSize: '0.85rem', fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>{player.position}</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  player.club && player.club,
                  player.city && player.city,
                  player.category && player.category,
                  player.division && player.division,
                ].filter(Boolean).map((chip, i) => (
                  <span key={i} style={{ color: '#94A3B8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.6rem' }}>◆</span>}
                    {chip as string}
                  </span>
                ))}
              </div>
            </div>
            {/* Overall rating */}
            <div style={{ textAlign: 'center', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '14px', padding: '1rem 1.75rem', flexShrink: 0, boxShadow: '0 0 24px rgba(124,58,237,0.1)' }}>
              <p style={{ color: '#A78BFA', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 0.2rem', fontFamily: 'var(--font-body)' }}>Nota global</p>
              <p className="mm-stat-num" style={{ color: ratingColor(avg), fontSize: '3.25rem', margin: 0 }}>{avg}</p>
              <p style={{ color: '#475569', fontSize: '0.65rem', margin: '0.2rem 0 0', fontFamily: 'var(--font-body)' }}>sobre 10</p>
            </div>
          </div>
        </div>

        {/* ══ METRICS + RADAR + INFO ══ */}
        <div className="mm-fade-up-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* Metric boxes + progress bars */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
            <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1rem', fontFamily: 'var(--font-body)' }}>Métricas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
              {(['technical', 'tactical', 'physical', 'attitude'] as const).map(key => {
                const v = player.metrics[key];
                const c = metricColor(key);
                return (
                  <div key={key} style={{ background: '#F9FAFB', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: `1px solid ${c}22` }}>
                    <p style={{ color: '#475569', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.2rem', fontFamily: 'var(--font-body)' }}>{metricLabel(key)}</p>
                    <p style={{ color: c, fontSize: '1.875rem', fontFamily: 'var(--font-condensed)', margin: 0, lineHeight: 1, fontWeight: 900 }}>{v}</p>
                    <div style={{ marginTop: '0.5rem', height: '3px', borderRadius: '2px', backgroundColor: '#E5E7EB' }}>
                      <div className="mm-bar-animated" style={{ height: '3px', borderRadius: '2px', backgroundColor: c, width: `${v * 10}%`, boxShadow: `0 0 8px ${c}60` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Progress bars */}
            {(['technical', 'tactical', 'physical', 'attitude'] as const).map(key => {
              const v = player.metrics[key];
              const c = metricColor(key);
              return (
                <div key={key} style={{ marginBottom: '0.625rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#64748B', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>{metricLabel(key)}</span>
                    <span style={{ color: c, fontSize: '0.75rem', fontWeight: '700', fontFamily: 'var(--font-condensed)' }}>{v}/10</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                    <div className="mm-bar-animated" style={{ width: `${v * 10}%`, height: '100%', backgroundColor: c, borderRadius: '999px', boxShadow: `0 0 6px ${c}50` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Radar chart */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1rem', alignSelf: 'flex-start', fontFamily: 'var(--font-body)' }}>Radar</h3>
            <RadarChart metrics={player.metrics} dark={false} />
          </div>

          {/* Personal data */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
            <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1rem', fontFamily: 'var(--font-body)' }}>Datos personales</h3>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                ['Nacimiento', formatDate(player.birthDate)],
                ['Pie', player.foot ? player.foot.charAt(0).toUpperCase() + player.foot.slice(1) : '—'],
                ['Altura', player.height ? `${player.height} cm` : '—'],
                ['Peso', player.weight ? `${player.weight} kg` : '—'],
                ['Club', player.club || '—'],
                ['Ciudad', player.city || '—'],
                ['Categoría', player.category || '—'],
                ['División', player.division || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.45rem' }}>
                  <dt style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>{label}</dt>
                  <dd style={{ color: '#111827', fontSize: '0.82rem', fontWeight: '500', margin: 0, fontFamily: 'var(--font-body)' }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* ══ CONTACT (private) ══ */}
        <div className="mm-fade-up-1" style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.15)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0, fontFamily: 'var(--font-body)' }}>Contacto y entorno</h3>
              <span style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '0.6rem', fontWeight: 700, padding: '1px 8px', borderRadius: 4, letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>PRIVADO</span>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
              {player.contactName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem' }}>
                  <dt style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>
                    {player.contactRelation ? player.contactRelation : 'Contacto'}
                  </dt>
                  <dd style={{ color: '#111827', fontSize: '0.82rem', fontWeight: 500, margin: 0, fontFamily: 'var(--font-body)' }}>{player.contactName}</dd>
                </div>
              )}
              {player.contactPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem' }}>
                  <dt style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>Teléfono</dt>
                  <dd style={{ color: '#111827', fontSize: '0.82rem', fontWeight: 500, margin: 0, fontFamily: 'var(--font-body)' }}>{player.contactPhone}</dd>
                </div>
              )}
              {player.agentName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem' }}>
                  <dt style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>Agente</dt>
                  <dd style={{ color: '#111827', fontSize: '0.82rem', fontWeight: 500, margin: 0, fontFamily: 'var(--font-body)' }}>{player.agentName}</dd>
                </div>
              )}
              {player.contractEnd && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem' }}>
                  <dt style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>Fin contrato</dt>
                  <dd style={{ color: '#111827', fontSize: '0.82rem', fontWeight: 500, margin: 0, fontFamily: 'var(--font-body)' }}>{formatDate(player.contractEnd)}</dd>
                </div>
              )}
              {player.transferInterest && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem' }}>
                  <dt style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>Interés traspaso</dt>
                  <dd style={{ color: player.transferInterest === 'si' ? '#22C55E' : player.transferInterest === 'no' ? '#EF4444' : '#F59E0B', fontSize: '0.82rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>
                    {player.transferInterest === 'si' ? 'Sí' : player.transferInterest === 'no' ? 'No' : 'Desconocido'}
                  </dd>
                </div>
              )}
              {player.clauseAmount !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem' }}>
                  <dt style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>Cláusula</dt>
                  <dd style={{ color: '#111827', fontSize: '0.82rem', fontWeight: 500, margin: 0, fontFamily: 'var(--font-body)' }}>
                    {player.clauseAmount.toLocaleString('es-ES')} €
                  </dd>
                </div>
              )}
            </dl>
            {!player.contactName && !player.contactPhone && !player.agentName && !player.contractEnd && !player.transferInterest && (
              <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)' }}>Sin datos de contacto. <a href={`/app/${player.id}`} style={{ color: '#7C3AED', textDecoration: 'none' }}>Añadir →</a></p>
            )}
          </div>

        {/* ══ SEASON STATS ══ */}
        <div className="mm-fade-up-1" style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1rem', fontFamily: 'var(--font-body)' }}>Estadísticas de temporada</h3>
            {(() => {
              const stats = [
                { label: 'Partidos', value: player.matchesPlayed, color: '#94A3B8' },
                { label: 'Minutos', value: player.minutesPlayed, color: '#94A3B8' },
                { label: 'Goles', value: player.goals, color: '#22C55E' },
                { label: 'Asistencias', value: player.assists, color: '#3B82F6' },
                { label: 'Amarillas', value: player.yellowCards, color: '#F59E0B' },
                { label: 'Rojas', value: player.redCards, color: '#EF4444' },
                ...(player.position === 'Portero' ? [
                  { label: 'Paradas', value: player.saves, color: '#7C3AED' },
                  { label: 'Goles encajados', value: player.goalsConceded, color: '#EF4444' },
                ] : []),
              ].filter(s => s.value !== undefined);
              return stats.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {stats.map(stat => (
                    <div key={stat.label} style={{ background: '#F9FAFB', borderRadius: '10px', padding: '0.875rem 1.125rem', border: '1px solid #E5E7EB', minWidth: '80px', textAlign: 'center' }}>
                      <p style={{ color: '#475569', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.3rem', fontFamily: 'var(--font-body)' }}>{stat.label}</p>
                      <p style={{ color: stat.color, fontSize: '1.75rem', fontFamily: 'var(--font-condensed)', margin: 0, lineHeight: 1, fontWeight: 900 }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)' }}>Sin estadísticas registradas. <a href={`/app/${player.id}`} style={{ color: '#7C3AED', textDecoration: 'none' }}>Añadir →</a></p>
              );
            })()}
          </div>

        {/* ══ TAGS + NOTES ══ */}
        {(player.tags.length > 0 || player.privateNotes) && (
          <div style={{ display: 'grid', gridTemplateColumns: player.tags.length && player.privateNotes ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {player.tags.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
                <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 0.875rem', fontFamily: 'var(--font-body)' }}>Etiquetas</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {player.tags.map(tag => (
                    <span key={tag} style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', border: '1px solid #DDD6FE', fontFamily: 'var(--font-body)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {player.privateNotes && (
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
                <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 0.875rem', fontFamily: 'var(--font-body)' }}>Notas privadas</h3>
                <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{player.privateNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* ══ CLUB HISTORY ══ */}
        <div className="mm-fade-up-2" style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1.25rem', fontFamily: 'var(--font-body)' }}>Historial de clubes</h3>
            {(player.clubHistory ?? []).length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)' }}>Sin historial registrado. <a href={`/app/${player.id}`} style={{ color: '#7C3AED', textDecoration: 'none' }}>Añadir →</a></p>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(player.clubHistory ?? []).map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 0 }}>
                  {/* Timeline dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', flexShrink: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED', border: '2px solid rgba(124,58,237,0.3)', flexShrink: 0, marginTop: '0.6rem', boxShadow: '0 0 8px rgba(124,58,237,0.4)' }} />
                    {idx < (player.clubHistory ?? []).length - 1 && (
                      <div style={{ width: '1px', flex: 1, background: 'rgba(124,58,237,0.2)', margin: '4px 0', minHeight: '20px' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingLeft: '0.875rem', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}>{entry.club}</span>
                      <span style={{ color: '#475569', fontSize: '0.72rem', background: '#F3F4F6', padding: '1px 8px', borderRadius: 4, fontFamily: 'var(--font-body)' }}>{entry.season}</span>
                      {entry.category && (
                        <span style={{ color: '#64748B', fontSize: '0.72rem', fontFamily: 'var(--font-body)' }}>{entry.category}</span>
                      )}
                    </div>
                    {(entry.goals !== undefined || entry.assists !== undefined) && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem' }}>
                        {entry.goals !== undefined && (
                          <span style={{ color: '#22C55E', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>⚽ {entry.goals} goles</span>
                        )}
                        {entry.assists !== undefined && (
                          <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>🅰️ {entry.assists} asistencias</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

        {/* ══ VIDEO LINKS ══ */}
        <div className="mm-fade-up-2" style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#475569', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 1rem', fontFamily: 'var(--font-body)' }}>Vídeos</h3>
            {(player.videoLinks ?? []).length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)' }}>Sin vídeos añadidos. <a href={`/app/${player.id}`} style={{ color: '#7C3AED', textDecoration: 'none' }}>Añadir →</a></p>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(player.videoLinks ?? []).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.875rem', borderRadius: '8px',
                    background: '#F9FAFB', border: '1px solid rgba(124,58,237,0.15)',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EDE9FE')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#F9FAFB')}
                >
                  <span style={{ fontSize: '1rem' }}>▶</span>
                  <span style={{ color: '#7C3AED', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)', flex: 1 }}>{link.label || 'Ver vídeo'}</span>
                  <span style={{ color: '#9CA3AF', fontSize: '0.7rem', fontFamily: 'var(--font-body)' }}>↗</span>
                </a>
              ))}
            </div>
            )}
          </div>

        {/* ══ EVOLUTION CHART ══ */}
        {evoData && (
          <div className="mm-fade-up-2" style={{ background: '#FFFFFF', borderRadius: '12px',
            border: '1px solid #E5E7EB', padding: '1.5rem',
            marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ color: '#111827', fontSize: '0.9rem', margin: 0, fontFamily: 'var(--font-body)', fontWeight: 600 }}>Evolución del jugador</h2>
                <span style={{
                  padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.7rem',
                  fontWeight: 700, background: evoData.badge.bg, color: evoData.badge.color,
                  fontFamily: 'var(--font-body)',
                }}>{evoData.badge.label}</span>
              </div>
              <button onClick={handleEvoAI} disabled={evoAiLoading} style={{
                background: evoAiLoading ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA',
                padding: '0.35rem 0.875rem', borderRadius: 8, fontSize: '0.75rem',
                fontWeight: 600, cursor: evoAiLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
              }}>
                {evoAiLoading ? '⏳ Analizando…' : '🤖 Analizar evolución con IA'}
              </button>
            </div>

            <div style={{ maxHeight: 220 }}>
              <Line
                key={visits.length}
                data={{
                  labels: evoData.labels,
                  datasets: [
                    {
                      label: 'Valoración del scout',
                      data: evoData.data,
                      borderColor: '#7C3AED',
                      backgroundColor: 'rgba(124,58,237,0.08)',
                      fill: true,
                      tension: 0.3,
                      borderWidth: 2.5,
                      pointBackgroundColor: evoData.data.map(v =>
                        v >= 8 ? '#22C55E' : v >= 6 ? '#F59E0B' : '#EF4444'
                      ),
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      pointBorderColor: 'rgba(255,255,255,0.15)',
                      pointBorderWidth: 2,
                    },
                    {
                      label: 'Tendencia',
                      data: evoData.trend,
                      borderColor: 'rgba(124,58,237,0.4)',
                      borderWidth: 1.5,
                      borderDash: [6, 4],
                      pointRadius: 0,
                      fill: false,
                      tension: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#6B7280', font: { size: 11 }, boxWidth: 12, padding: 10 },
                    },
                    tooltip: {
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      titleColor: '#111827',
                      bodyColor: '#6B7280',
                      padding: 10,
                    },
                  },
                  scales: {
                    y: {
                      min: 1, max: 10,
                      ticks: { stepSize: 1, color: '#6B7280', font: { size: 10 } },
                      grid: { color: 'rgba(0,0,0,0.06)' },
                      border: { color: 'transparent' },
                    },
                    x: {
                      ticks: { color: '#6B7280', font: { size: 10 } },
                      grid: { color: 'rgba(0,0,0,0.04)' },
                      border: { color: 'transparent' },
                    },
                  },
                }}
              />
            </div>

            {evoAiText && (
              <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: 10,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)' }}>
                <p style={{ color: '#7C3AED', fontSize: '0.67rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem', fontFamily: 'var(--font-body)' }}>
                  Análisis de evolución IA
                </p>
                <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.75, margin: 0 }}>
                  {evoAiText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══ VISITS ══ */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#111827', fontSize: '0.9rem', margin: 0, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              Historial de visitas
              <span style={{ color: '#6B7280', fontWeight: '400', fontSize: '0.82rem', marginLeft: '0.5rem' }}>({visits.length})</span>
            </h2>
          </div>

          {/* Add visit form */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={labelS}>Fecha</label>
                <input type="date" style={inputS} value={vFecha} onChange={e => setVFecha(e.target.value)} />
              </div>
              <div>
                <label style={labelS}>Partido</label>
                <input style={inputS} value={vPartido} onChange={e => setVPartido(e.target.value)} placeholder="ej: Cadete Lorca vs Cartagena J12" />
              </div>
            </div>

            {/* Valoración slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.2)', marginBottom: '0.75rem' }}>
              <span style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: '500', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>¿Cómo lo has visto hoy?</span>
              <input
                type="range" min={1} max={10} step={1} value={vValoracion}
                onChange={e => setVVal(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#7C3AED' }}
              />
              <span style={{ fontSize: '1.875rem', fontWeight: '900', fontFamily: 'var(--font-condensed)', color: ratingColor(vValoracion), minWidth: '2.5rem', textAlign: 'center' }}>{vValoracion}</span>
            </div>

            <textarea
              rows={2}
              style={{ ...inputS, resize: 'vertical', marginBottom: '0.75rem' }}
              value={vNota}
              onChange={e => setVNota(e.target.value)}
              placeholder="Notas: posicionamiento, acciones destacadas, aspectos a mejorar..."
            />

            {visitError && <p style={{ color: '#F87171', fontSize: '0.78rem', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>{visitError}</p>}

            <button onClick={handleAddVisit} disabled={savingVisit}
              style={{ backgroundColor: savingVisit ? '#5B21B6' : '#7C3AED', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: savingVisit ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', boxShadow: savingVisit ? 'none' : '0 4px 12px rgba(124,58,237,0.3)' }}>
              {savingVisit ? 'Guardando...' : '+ Añadir visita'}
            </button>
          </div>

          {/* Visit list */}
          {visits.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '0.875rem', textAlign: 'center', padding: '2.5rem', fontFamily: 'var(--font-body)' }}>
              Sin visitas registradas todavía. ¡Añade la primera!
            </p>
          ) : (
            <div style={{ padding: '0.75rem 0' }}>
              {visits.map((v, idx) => (
                <div key={v.id} style={{ position: 'relative', display: 'flex', gap: '0', margin: '0 1.5rem', marginBottom: idx < visits.length - 1 ? '0' : '0' }}>
                  {/* Timeline connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', flexShrink: 0, paddingTop: '0.875rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED', border: '2px solid rgba(124,58,237,0.3)', flexShrink: 0, boxShadow: '0 0 8px rgba(124,58,237,0.4)' }} />
                    {idx < visits.length - 1 && (
                      <div style={{ width: '1px', flex: 1, background: 'rgba(124,58,237,0.2)', margin: '4px 0', minHeight: '20px' }} />
                    )}
                  </div>
                  {/* Visit content */}
                  <div style={{ flex: 1, padding: '0.75rem 0.875rem', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#475569', fontSize: '0.72rem', fontWeight: '600', fontFamily: 'var(--font-body)', letterSpacing: '0.03em' }}>
                          {v.fecha}
                        </span>
                        <span style={{ color: '#111827', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'var(--font-body)' }}>{v.partido}</span>
                        {v.valoracion > 0 && (
                          <span style={{ fontSize: '0.72rem', fontWeight: '800', fontFamily: 'var(--font-condensed)', color: ratingColor(v.valoracion), backgroundColor: ratingBg(v.valoracion), padding: '1px 8px', borderRadius: '5px', letterSpacing: '0.02em' }}>
                            {v.valoracion}/10
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmVisit(v)}
                        style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', lineHeight: 1 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
                      >✕</button>
                    </div>
                    {v.nota && (
                      <p style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>{v.nota}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>{/* end white panel */}

      {/* ── Delete visit modal ── */}
      {confirmVisit && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
            <h2 style={{ color: '#E2E8F0', fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>¿Eliminar visita?</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <strong style={{ color: '#111827' }}>{confirmVisit.partido}</strong>
            </p>
            <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>{confirmVisit.fecha}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmVisit(null)} style={{ backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteVisit} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
