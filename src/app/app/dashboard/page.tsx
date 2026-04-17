'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayers } from '@/lib/players';
import { getVisits } from '@/lib/visits';
import { DEMO_PLAYERS, DEMO_VISITS } from '@/lib/demo-data';
import { Player } from '@/types/player';
import { Visit } from '@/types/visit';
import AppNav from '@/components/AppNav';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  RadialLinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  RadialLinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function avgMetrics(p: Player) {
  const { technical = 0, tactical = 0, physical = 0, attitude = 0 } = p.metrics ?? {};
  return Math.round(((technical + tactical + physical + attitude) / 4) * 10) / 10;
}

function ratingColor(v: number) {
  if (v >= 8) return 'var(--status-activo)';
  if (v >= 6) return 'var(--status-espera)';
  return 'var(--status-desc)';
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CHART_BASE = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: '#374151', font: { size: 11 }, boxWidth: 10 } },
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      titleColor: '#111827',
      bodyColor: '#6B7280',
      padding: 10,
    },
  },
};

const DARK_SCALE = {
  grid: { color: 'rgba(0,0,0,0.06)' },
  ticks: { color: '#6B7280', font: { size: 10 } },
  border: { color: 'transparent' },
};

// ─── Section card ────────────────────────────────────────────────────────────

function Card({ title, children, span2, className }: { title: string; children: React.ReactNode; span2?: boolean; className?: string }) {
  return (
    <div className={className} style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '14px',
      padding: '1.375rem',
      gridColumn: span2 ? '1 / -1' : undefined,
    }}>
      <p style={{
        color: '#6B7280',
        fontSize: '0.69rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        margin: '0 0 1.25rem',
        fontFamily: 'var(--font-body)',
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (isDemo) {
      setPlayers(DEMO_PLAYERS);
      const allVisits = Object.values(DEMO_VISITS).flat();
      setAllVisits(allVisits);
      setLoadingData(false);
      return;
    }
    if (!user) return;
    (async () => {
      try {
        const ps = await getPlayers(user.uid);
        setPlayers(ps);
        const visitArrays = await Promise.all(ps.map(p => getVisits(p.id).catch(() => [] as Visit[])));
        setAllVisits(visitArrays.flat());
      } catch (err) {
        console.error('dashboard load error:', err);
        setLoadError('Error al cargar los datos. Recarga la página.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [user, isDemo]);

  if (loading || loadingData) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#475569' }}>Cargando datos…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#F87171', fontFamily: 'var(--font-body)' }}>{loadError}</p>
      </main>
    );
  }

  // ── Chart data ───────────────────────────────────────────────────────────

  // 1. Por estado
  const statusLabels = ['Activo', 'Seguimiento', 'En espera', 'Descartado'];
  const statusKeys   = ['activo', 'seguimiento', 'espera', 'descartado'];
  const statusColors = ['#34D399', '#818CF8', '#FBBF24', '#F87171'];
  const statusData   = statusKeys.map(k => players.filter(p => p.status === k).length);

  // 2. Por posición
  const posCounts: Record<string, number> = {};
  players.forEach(p => { if (p.position) posCounts[p.position] = (posCounts[p.position] || 0) + 1; });
  const posSorted = Object.entries(posCounts).sort((a, b) => b[1] - a[1]);

  // 3. Por categoría
  const catCounts: Record<string, number> = {};
  players.forEach(p => { if (p.category) catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
  const catSorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // 4. Métricas media global
  const n = players.length || 1;
  const avgTec = players.reduce((s, p) => s + (p.metrics?.technical || 0), 0) / n;
  const avgTac = players.reduce((s, p) => s + (p.metrics?.tactical  || 0), 0) / n;
  const avgFis = players.reduce((s, p) => s + (p.metrics?.physical  || 0), 0) / n;
  const avgAct = players.reduce((s, p) => s + (p.metrics?.attitude  || 0), 0) / n;

  // 5. Por ciudad top 10
  const cityCounts: Record<string, number> = {};
  players.forEach(p => { if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
  const citySorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // 6. Visitas por mes (año actual)
  const year = new Date().getFullYear();
  const visitsByMonth = Array(12).fill(0);
  allVisits.forEach(v => {
    if (!v.fecha) return;
    const [y, m] = v.fecha.split('-').map(Number);
    if (y === year && m >= 1 && m <= 12) visitsByMonth[m - 1]++;
  });

  // 7. Evolución valoración media
  const ratingByMonth: Record<string, number[]> = {};
  allVisits.forEach(v => {
    if (!v.fecha) return;
    const ym = v.fecha.slice(0, 7);
    if (!ratingByMonth[ym]) ratingByMonth[ym] = [];
    ratingByMonth[ym].push(v.valoracion);
  });
  const ratingKeys   = Object.keys(ratingByMonth).sort().slice(-12);
  const ratingAvgs   = ratingKeys.map(k => {
    const arr = ratingByMonth[k];
    return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
  });
  const ratingLabels = ratingKeys.map(k => {
    const [yr, mo] = k.split('-');
    return MONTHS[parseInt(mo) - 1] + ' ' + yr.slice(2);
  });

  // Top 10
  const top10 = [...players].sort((a, b) => avgMetrics(b) - avgMetrics(a)).slice(0, 10);

  return (
    <main style={{ minHeight: '100vh', background: '#0B0F1A' }}>
      <AppNav activePage="dashboard" />

      {/* ── Hero band ── */}
      <div style={{
        background: '#0B0F1A',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        position: 'relative', overflow: 'hidden',
        paddingTop: '7rem', paddingBottom: '3.5rem',
        paddingLeft: '1.5rem', paddingRight: '1.5rem',
      }}>
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--purple-2)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem', fontFamily: 'var(--font-body)' }}>Análisis</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
              Dashboard
            </h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Jugadores', value: players.length, color: 'white' },
              { label: 'Visitas', value: allVisits.length, color: '#A78BFA' },
              { label: 'Activos', value: players.filter(p => p.status === 'activo').length, color: '#10B981' },
              { label: 'En seguimiento', value: players.filter(p => p.status === 'seguimiento').length, color: '#3B82F6' },
            ].map((stat, idx) => (
              <div key={stat.label} className={`mm-fade-up-${Math.min(idx + 1, 4)}`} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.1rem 1.25rem', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                <p style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.4rem', fontFamily: 'var(--font-body)' }}>{stat.label}</p>
                <p className="mm-stat-num" style={{ color: stat.color, margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── White content panel ── */}
      <div style={{ background: '#FFFFFF', borderRadius: '2rem 2rem 0 0', marginTop: '-1.5rem', boxShadow: '0 -12px 40px rgba(0,0,0,0.18)', minHeight: '60vh', paddingTop: '2rem', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* 1. Estado */}
          <Card title="Distribución por estado" className="mm-card-hover mm-fade-up-1">
            <div style={{ maxHeight: 240, display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={{
                  labels: statusLabels,
                  datasets: [{ data: statusData, backgroundColor: statusColors, borderWidth: 2, borderColor: '#FFFFFF' }],
                }}
                options={{ ...CHART_BASE, cutout: '62%' } as Parameters<typeof Doughnut>[0]['options']}
              />
            </div>
          </Card>

          {/* 2. Por posición */}
          <Card title="Jugadores por posición" className="mm-card-hover mm-fade-up-2">
            <Bar
              data={{
                labels: posSorted.map(([k]) => k.length > 14 ? k.slice(0, 12) + '…' : k),
                datasets: [{
                  label: 'Jugadores', data: posSorted.map(([, v]) => v),
                  backgroundColor: 'rgba(124,58,237,0.65)', borderRadius: 5, borderSkipped: false,
                }],
              }}
              options={{
                ...CHART_BASE,
                indexAxis: 'y' as const,
                plugins: { ...CHART_BASE.plugins, legend: { display: false } },
                scales: {
                  x: { ...DARK_SCALE, beginAtZero: true, ticks: { ...DARK_SCALE.ticks, stepSize: 1 } },
                  y: DARK_SCALE,
                },
              }}
            />
          </Card>

          {/* 3. Por categoría */}
          <Card title="Jugadores por categoría" className="mm-card-hover mm-fade-up-3">
            <Bar
              data={{
                labels: catSorted.map(([k]) => k),
                datasets: [{
                  label: 'Jugadores', data: catSorted.map(([, v]) => v),
                  backgroundColor: ['#93C5FD','#6EE7B7','#FDE68A','#C4B5FD','#FDA4AF',
                    '#94A3B8','#67E8F9','#A5F3FC','#BBF7D0','#FCA5A5'],
                  borderRadius: 5, borderSkipped: false,
                }],
              }}
              options={{
                ...CHART_BASE,
                plugins: { ...CHART_BASE.plugins, legend: { display: false } },
                scales: {
                  x: DARK_SCALE,
                  y: { ...DARK_SCALE, beginAtZero: true, ticks: { ...DARK_SCALE.ticks, stepSize: 1 } },
                },
              }}
            />
          </Card>

          {/* 4. Radar métricas */}
          <Card title="Métricas — media global" className="mm-card-hover mm-fade-up-4">
            <div style={{ maxHeight: 260, display: 'flex', justifyContent: 'center' }}>
              <Radar
                data={{
                  labels: ['Técnica', 'Táctica', 'Físico', 'Actitud'],
                  datasets: [{
                    label: 'Media global',
                    data: [avgTec, avgTac, avgFis, avgAct].map(v => Math.round(v * 10) / 10),
                    backgroundColor: 'rgba(124,58,237,0.15)',
                    borderColor: '#7C3AED',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#7C3AED',
                    pointRadius: 5,
                  }],
                }}
                options={{
                  ...CHART_BASE,
                  scales: {
                    r: {
                      min: 0, max: 10,
                      ticks: { stepSize: 2, color: '#6B7280', font: { size: 10 }, backdropColor: 'transparent' },
                      grid: { color: 'rgba(0,0,0,0.07)' },
                      pointLabels: { color: '#374151', font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </Card>

          {/* 5. Por ciudad */}
          <Card title="Jugadores por ciudad (top 10)">
            <Bar
              data={{
                labels: citySorted.map(([k]) => k),
                datasets: [{
                  label: 'Jugadores', data: citySorted.map(([, v]) => v),
                  backgroundColor: 'rgba(59,130,246,0.65)', borderRadius: 5, borderSkipped: false,
                }],
              }}
              options={{
                ...CHART_BASE,
                indexAxis: 'y' as const,
                plugins: { ...CHART_BASE.plugins, legend: { display: false } },
                scales: {
                  x: { ...DARK_SCALE, beginAtZero: true, ticks: { ...DARK_SCALE.ticks, stepSize: 1 } },
                  y: DARK_SCALE,
                },
              }}
            />
          </Card>

          {/* 6. Visitas por mes */}
          <Card title={`Actividad de visitas · ${year}`}>
            <Bar
              data={{
                labels: MONTHS,
                datasets: [{
                  label: 'Visitas', data: visitsByMonth,
                  backgroundColor: 'rgba(16,185,129,0.65)', borderRadius: 5, borderSkipped: false,
                }],
              }}
              options={{
                ...CHART_BASE,
                plugins: { ...CHART_BASE.plugins, legend: { display: false } },
                scales: {
                  x: DARK_SCALE,
                  y: { ...DARK_SCALE, beginAtZero: true, ticks: { ...DARK_SCALE.ticks, stepSize: 1 } },
                },
              }}
            />
          </Card>

          {/* 7. Evolución valoración */}
          {ratingKeys.length > 0 && (
            <Card title="Evolución de valoración media" span2>
              <Bar
                data={{
                  labels: ratingLabels,
                  datasets: [{
                    label: 'Valoración media',
                    data: ratingAvgs,
                    backgroundColor: ratingAvgs.map(v =>
                      v >= 8 ? 'rgba(52,211,153,0.75)' :
                      v >= 6 ? 'rgba(251,191,36,0.75)' :
                               'rgba(248,113,113,0.75)'
                    ),
                    borderRadius: 5, borderSkipped: false,
                  }],
                }}
                options={{
                  ...CHART_BASE,
                  plugins: { ...CHART_BASE.plugins, legend: { display: false } },
                  scales: {
                    x: DARK_SCALE,
                    y: { ...DARK_SCALE, min: 0, max: 10, ticks: { ...DARK_SCALE.ticks, stepSize: 2 } },
                  },
                }}
              />
            </Card>
          )}

          {/* Top 10 */}
          <Card title="Top 10 jugadores por nota global" span2>
            {top10.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                No hay jugadores aún
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                {top10.map((p, i) => {
                  const a = avgMetrics(p);
                  const rankGrad =
                    i === 0 ? 'linear-gradient(135deg,#F59E0B,#FBBF24)' :
                    i === 1 ? 'linear-gradient(135deg,#94A3B8,#CBD5E1)' :
                    i === 2 ? 'linear-gradient(135deg,#D97706,#F59E0B)' :
                              'linear-gradient(135deg,#7C3AED,#A855F7)';
                  return (
                    <Link key={p.id} href={`/app/players/${p.id}`}
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center',
                        gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '10px',
                        transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: '50%',
                        background: rankGrad, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10, fontWeight: 800,
                        color: 'white', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ width: 34, height: 34, borderRadius: '8px',
                        background: 'linear-gradient(135deg,#EDE9FE,#C4B5FD)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#5B21B6', flexShrink: 0 }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#111827', margin: 0, fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
                          {p.name}
                        </p>
                        <p style={{ color: '#6B7280', margin: 0, fontSize: '0.75rem' }}>
                          {p.position} · {p.club || '—'}
                        </p>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.375rem',
                        color: ratingColor(a),
                      }}>
                        {a}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

        </div>
      </div>
      </div>
    </main>
  );
}
