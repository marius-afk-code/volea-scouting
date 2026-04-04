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
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─── Constants ─────────────────────────────────────────────────────────────

const CMP_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B'];
const CMP_BG     = [
  'rgba(124,58,237,0.15)', 'rgba(59,130,246,0.15)',
  'rgba(16,185,129,0.15)', 'rgba(245,158,11,0.15)',
];

function avgMetrics(p: Player) {
  const { technical, tactical, physical, attitude } = p.metrics;
  return Math.round(((technical + tactical + physical + attitude) / 4) * 10) / 10;
}

function ratingColor(v: number) {
  return v >= 8 ? '#059669' : v >= 6 ? '#D97706' : '#DC2626';
}

function formatDate(iso: string) {
  if (!iso) return '—';
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

// ─── Smart recommendation (fallback) ───────────────────────────────────────

function smartRecommendation(selected: Player[], visitMap: Record<string, Visit[]>): string {
  const scored = selected.map(p => {
    const a = avgMetrics(p);
    const vis = visitMap[p.id] ?? [];
    const recent = vis.slice(0, 3).map(v => v.valoracion).filter(Boolean);
    const trend = recent.length >= 2 ? recent[0] - recent[recent.length - 1] : 0;
    const score = a * 0.5 + (recent.length ? recent.reduce((s, v) => s + v, 0) / recent.length * 0.3 : a * 0.3) + vis.length * 0.05 + trend * 0.15;
    return { p, a, vis: vis.length, trend, score };
  }).sort((a, b) => b.score - a.score);
  const best = scored[0], second = scored[1];
  const l1 = `Mi elección es <strong>${best.p.name}</strong> (${best.a}/10, ${best.vis} visitas).`;
  const l2 = `Supera a ${second.p.name} (${second.a}/10)${best.a > second.a ? ' en nota global' : ' en regularidad de visitas'}${best.trend > 0 ? ' con tendencia ascendente reciente' : ''}.`;
  const l3 = best.trend < 0
    ? 'Riesgo: tendencia reciente a la baja. Ampliar observaciones antes de decidir.'
    : best.vis < 3
      ? 'Riesgo: pocas visitas. Seguimiento adicional antes de tomar decisión definitiva.'
      : 'Perfil sólido con seguimiento suficiente. Momento idóneo para activar contacto.';
  return [l1, l2, l3].join(' ');
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();

  const [players, setPlayers]       = useState<Player[]>([]);
  const [visitMap, setVisitMap]     = useState<Record<string, Visit[]>>({});
  const [loadingData, setLoadingData] = useState(true);

  // Comparison state
  const [slots, setSlots]           = useState(2);
  const [selected, setSelected]     = useState<(Player | null)[]>([null, null, null, null]);

  // AI
  const [aiText, setAiText]         = useState('');
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState('');

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (isDemo) {
      setPlayers(DEMO_PLAYERS);
      setVisitMap(DEMO_VISITS);
      setLoadingData(false);
      return;
    }
    if (!user) return;
    (async () => {
      try {
        const ps = await getPlayers(user.uid);
        setPlayers(ps);
        const visitArrays = await Promise.all(ps.map(p => getVisits(p.id).catch(() => [] as Visit[])));
        const vm: Record<string, Visit[]> = {};
        ps.forEach((p, i) => { vm[p.id] = visitArrays[i]; });
        setVisitMap(vm);
      } catch (err) { console.error(err); }
      finally { setLoadingData(false); }
    })();
  }, [user, isDemo]);

  // Active selected players (non-null, no duplicates)
  const active = selected.slice(0, slots).filter((p): p is Player => p !== null);
  const hasDupes = active.length !== new Set(active.map(p => p.id)).size;
  const showResult = active.length >= 2 && !hasDupes;

  function setSlot(i: number, playerId: string) {
    const p = players.find(x => x.id === playerId) ?? null;
    setSelected(prev => prev.map((s, idx) => idx === i ? p : s));
    setAiText('');
  }

  async function handleAI() {
    if (active.length < 2) return;
    setAiLoading(true);
    setAiError('');
    setAiText('');
    const playersInfo = active.map((p, i) => {
      const vis = (visitMap[p.id] ?? []).slice(0, 3);
      const visText = vis.map((v, j) => `  Visita ${j+1} (${v.fecha}): ${v.valoracion}/10 — ${v.nota||'sin notas'}`).join('\n');
      return `JUGADOR ${i+1}: ${p.name} | ${p.position} | ${p.category} | Club: ${p.club}\nMétricas: Técnica ${p.metrics.technical} | Táctica ${p.metrics.tactical} | Físico ${p.metrics.physical} | Actitud ${p.metrics.attitude} | Global: ${avgMetrics(p)}/10\nVisitas totales: ${(visitMap[p.id]??[]).length}. Últimas:\n${visText||'  Sin visitas'}`;
    }).join('\n\n');

    const prompt = `Eres un director deportivo de fútbol base en España. Te presentan ${active.length} jugadores para elegir uno.\n\n${playersInfo}\n\nEscribe EXACTAMENTE 3 frases directas:\n1. A quién eliges y por qué (nombra al jugador)\n2. Ventaja concreta sobre el resto (datos específicos)\n3. Riesgo de tu elección y cuándo reevaluar\nEspañol, 70-100 palabras total. Sin numeración, sin títulos.`;

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 400 }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setAiText(data.text ?? '');
    } catch {
      // Fallback to algorithmic recommendation
      setAiText(smartRecommendation(active, visitMap));
    } finally {
      setAiLoading(false);
    }
  }

  if (loading || loadingData) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#475569' }}>Cargando…</p>
      </main>
    );
  }

  const dims: Array<[string, keyof Player['metrics'] | null]> = [
    ['Técnica', 'technical'], ['Táctica', 'tactical'],
    ['Físico', 'physical'],   ['Actitud', 'attitude'],
    ['Nota global', null],
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#0B0F1A' }}>
      <AppNav activePage="compare" />

      {/* ── Hero band ── */}
      <div style={{
        background: '#0B0F1A',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        position: 'relative', overflow: 'hidden',
        paddingTop: '7rem', paddingBottom: '3.5rem',
        paddingLeft: '1.5rem', paddingRight: '1.5rem',
      }}>
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1080px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--purple-2)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem', fontFamily: 'var(--font-body)' }}>Análisis comparativo</p>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 0.5rem' }}>
            Comparador
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.84rem', margin: 0 }}>
            Compara hasta 4 jugadores en paralelo
          </p>
        </div>
      </div>

      {/* ── White content panel ── */}
      <div style={{ background: '#FFFFFF', borderRadius: '2rem 2rem 0 0', marginTop: '-1.5rem', boxShadow: '0 -12px 40px rgba(0,0,0,0.18)', minHeight: '60vh', paddingTop: '2rem', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 10 }}>
      <div className="mm-fade-in" style={{ maxWidth: 1080, margin: '0 auto', padding: '0' }}>


        {players.length < 2 && (
          <div style={{ padding: '2rem', background: '#F9FAFB', borderRadius: 12,
            border: '1px solid #E5E7EB', textAlign: 'center', color: '#6B7280' }}>
            Necesitas al menos 2 jugadores para comparar. <Link href="/app" style={{ color: 'var(--purple-3)' }}>Añade jugadores →</Link>
          </div>
        )}

        {players.length >= 2 && (
          <>
            {/* Selector row */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem',
              alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {Array.from({ length: slots }).map((_, i) => {
                const p = selected[i];
                return (
                  <div key={i} style={{ flex: 1, minWidth: 160, background: '#F9FAFB',
                    border: `1px solid ${p ? CMP_COLORS[i] + '60' : '#E5E7EB'}`,
                    borderRadius: 14, padding: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%',
                        background: CMP_COLORS[i], flexShrink: 0 }} />
                      <span style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Jugador {i + 1}
                      </span>
                    </div>
                    <select
                      value={p?.id ?? ''}
                      onChange={e => setSlot(i, e.target.value)}
                      style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 8,
                        padding: '0.5rem 0.75rem', color: '#111827',
                        fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
                      <option value="">Seleccionar…</option>
                      {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(pl => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name} — {pl.position} ({avgMetrics(pl)})
                        </option>
                      ))}
                    </select>
                    {p && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280',
                        textAlign: 'center' }}>
                        {p.club || '—'} · {p.category || '—'}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Add slot button */}
              {slots < 4 && (
                <button onClick={() => setSlots(s => s + 1)} style={{
                  width: 52, height: 52, borderRadius: 14, alignSelf: 'center',
                  background: 'transparent', border: '2px dashed rgba(255,255,255,0.1)',
                  color: '#64748B', fontSize: '1.5rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#64748B'; }}
                >+</button>
              )}
            </div>

            {hasDupes && (
              <div style={{ marginBottom: '1rem', padding: '0.625rem 1rem', borderRadius: 8,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                color: '#F59E0B', fontSize: '0.825rem' }}>
                ⚠️ Tienes el mismo jugador en más de un slot. Selecciona jugadores distintos.
              </div>
            )}

            {showResult && (
              <>
                {/* Hero cards */}
                <div style={{ display: 'grid',
                  gridTemplateColumns: `repeat(${active.length}, 1fr)`,
                  gap: '1rem', marginBottom: '1.25rem' }}>
                  {active.map((p, i) => {
                    const a = avgMetrics(p);
                    return (
                      <Link key={p.id} href={`/app/players/${p.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          background: 'linear-gradient(135deg,#0B0F1A,#160b2e)',
                          borderRadius: 14, padding: '1.25rem', textAlign: 'center',
                          border: `1px solid ${CMP_COLORS[i]}40`,
                          position: 'relative', overflow: 'hidden',
                        }}>
                          <div style={{ position: 'absolute', right: -30, top: -30,
                            width: 100, height: 100, borderRadius: '50%',
                            background: `${CMP_COLORS[i]}15` }} />
                          <div style={{ width: 52, height: 52, borderRadius: 12, margin: '0 auto 0.625rem',
                            background: `${CMP_COLORS[i]}20`, border: `2px solid ${CMP_COLORS[i]}60`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 800, color: CMP_COLORS[i] }}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <p style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem',
                            margin: '0 0 0.2rem' }}>{p.name}</p>
                          <p style={{ color: '#64748B', fontSize: '0.75rem', margin: '0 0 0.625rem' }}>
                            {p.position} · {p.club || '—'}
                          </p>
                          <p style={{ color: ratingColor(a), fontSize: '2.25rem', fontFamily: 'var(--font-display)',
                            margin: 0, lineHeight: 1 }}>{a}</p>
                          <p style={{ color: '#64748B', fontSize: '0.65rem', margin: '0.2rem 0 0' }}>
                            nota global
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Radar chart */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB',
                  borderRadius: 14, padding: '1.5rem', marginBottom: '1.25rem' }}>
                  <p style={{ color: '#6B7280', fontSize: '0.7rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem' }}>
                    Radar comparativo
                  </p>
                  <div style={{ maxHeight: 340, display: 'flex', justifyContent: 'center' }}>
                    <Radar
                      data={{
                        labels: ['Técnica', 'Táctica', 'Físico', 'Actitud'],
                        datasets: active.map((p, i) => ({
                          label: p.name,
                          data: [p.metrics.technical, p.metrics.tactical,
                                 p.metrics.physical, p.metrics.attitude],
                          backgroundColor: CMP_BG[i],
                          borderColor: CMP_COLORS[i],
                          borderWidth: 2.5,
                          pointBackgroundColor: CMP_COLORS[i],
                          pointRadius: 5,
                        })),
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                          r: {
                            min: 0, max: 10,
                            ticks: { stepSize: 2, color: '#6B7280', font: { size: 10 },
                              backdropColor: 'transparent' },
                            grid: { color: 'rgba(0,0,0,0.07)' },
                            pointLabels: { color: '#374151', font: { size: 12, weight: 'bold' as const } },
                          },
                        },
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: { color: '#374151', font: { size: 11 }, boxWidth: 12, padding: 12 },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Metric bars */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB',
                  borderRadius: 14, padding: '1.5rem', marginBottom: '1.25rem' }}>
                  <p style={{ color: '#6B7280', fontSize: '0.7rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem' }}>
                    Comparativa de valoraciones
                  </p>
                  {active.length === 2 ? (
                    // Duel bars
                    <div>
                      {dims.map(([label, key]) => {
                        const vA = key ? active[0].metrics[key] : avgMetrics(active[0]);
                        const vB = key ? active[1].metrics[key] : avgMetrics(active[1]);
                        const winA = vA > vB, winB = vB > vA;
                        return (
                          <div key={label} style={{ display: 'grid',
                            gridTemplateColumns: '1fr 80px 1fr', gap: '0.75rem',
                            alignItems: 'center', marginBottom: '0.625rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <div style={{
                                height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                                paddingLeft: '0.625rem', paddingRight: '0.625rem',
                                fontSize: 13, fontWeight: 800, color: 'white',
                                width: `${vA * 10}%`, minWidth: 36, justifyContent: 'flex-end',
                                background: `linear-gradient(90deg,${CMP_COLORS[0]}50,${CMP_COLORS[0]})`,
                                boxShadow: winA ? `0 0 12px ${CMP_COLORS[0]}50` : 'none',
                              }}>{vA}</div>
                            </div>
                            <div style={{ color: '#6B7280', fontSize: '0.7rem', fontWeight: 700,
                              textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.04em' }}>
                              {label}
                            </div>
                            <div>
                              <div style={{
                                height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                                paddingLeft: '0.625rem', paddingRight: '0.625rem',
                                fontSize: 13, fontWeight: 800, color: 'white',
                                width: `${vB * 10}%`, minWidth: 36,
                                background: `linear-gradient(90deg,${CMP_COLORS[1]},${CMP_COLORS[1]}50)`,
                                boxShadow: winB ? `0 0 12px ${CMP_COLORS[1]}50` : 'none',
                              }}>{vB}</div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Player name labels */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr',
                        gap: '0.75rem', marginTop: '0.75rem' }}>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700,
                          color: CMP_COLORS[0] }}>{active[0].name}</div>
                        <div />
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: CMP_COLORS[1] }}>
                          {active[1].name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Segment bars for 3-4
                    <div>
                      {dims.map(([label, key]) => {
                        const vals = active.map(p => key ? p.metrics[key] : avgMetrics(p));
                        const maxV = Math.max(...vals);
                        return (
                          <div key={label} style={{ marginBottom: '0.875rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B',
                              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                              {label}
                            </div>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {vals.map((v, i) => (
                                <div key={i} style={{
                                  height: 28, borderRadius: 6,
                                  width: `${v * 10}%`, minWidth: 32,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 800, color: 'white',
                                  background: v === maxV ? CMP_COLORS[i] : CMP_COLORS[i] + '55',
                                }}>{v}</div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {active.map((p, i) => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: CMP_COLORS[i] }} />
                            <span style={{ color: CMP_COLORS[i], fontSize: '0.75rem', fontWeight: 700 }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comparison table */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB',
                  borderRadius: 14, padding: '1.5rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
                  <p style={{ color: '#6B7280', fontSize: '0.7rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem' }}>
                    Datos comparados
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.375rem 0.75rem',
                          color: '#6B7280', fontSize: '0.7rem', textTransform: 'uppercase',
                          borderBottom: '1px solid #E5E7EB' }}></th>
                        {active.map((p, i) => (
                          <th key={p.id} style={{ padding: '0.375rem 0.75rem', textAlign: 'center',
                            color: CMP_COLORS[i], fontWeight: 700, fontSize: '0.8rem',
                            borderBottom: '1px solid #E5E7EB' }}>
                            {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        ['Posición',   (p: Player) => p.position],
                        ['Club',       (p: Player) => p.club || '—'],
                        ['Ciudad',     (p: Player) => p.city || '—'],
                        ['Categoría',  (p: Player) => p.category || '—'],
                        ['División',   (p: Player) => p.division || '—'],
                        ['Pie',        (p: Player) => p.foot || '—'],
                        ['Nacimiento', (p: Player) => formatDate(p.birthDate)],
                        ['Altura',     (p: Player) => p.height ? `${p.height} cm` : '—'],
                        ['Peso',       (p: Player) => p.weight ? `${p.weight} kg` : '—'],
                        ['Estado',     (p: Player) => ({ activo:'Activo', seguimiento:'Seguimiento', espera:'En espera', descartado:'Descartado' }[p.status] ?? p.status)],
                        ['Visitas',    (p: Player) => String((visitMap[p.id]??[]).length)],
                        ['Etiquetas',  (p: Player) => p.tags.join(', ') || '—'],
                      ] as Array<[string, (p: Player) => string]>).map(([label, fn]) => (
                        <tr key={label}>
                          <td style={{ padding: '0.4rem 0.75rem', color: '#6B7280', fontWeight: 500,
                            borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
                            {label}
                          </td>
                          {active.map(p => (
                            <td key={p.id} style={{ padding: '0.4rem 0.75rem', textAlign: 'center',
                              fontWeight: 600, color: '#111827',
                              borderBottom: '1px solid #F3F4F6' }}>
                              {fn(p)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* AI recommendation */}
                {aiText && (
                  <div style={{ background: 'rgba(124,58,237,0.05)',
                    border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14,
                    padding: '1.25rem', marginBottom: '1rem' }}>
                    <p style={{ color: '#7C3AED', fontSize: '0.7rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>
                      🤖 Recomendación IA
                    </p>
                    <div style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: aiText }} />
                  </div>
                )}

                {aiError && (
                  <div style={{ marginBottom: '1rem', padding: '0.625rem 1rem', borderRadius: 8,
                    background: 'rgba(239,68,68,0.1)', color: '#F87171', fontSize: '0.825rem' }}>
                    ⚠️ {aiError}
                  </div>
                )}

                <div style={{ textAlign: 'center' }}>
                  <button onClick={handleAI} disabled={aiLoading} style={{
                    background: aiLoading ? '#5B21B6' : '#7C3AED', color: 'white', border: 'none',
                    padding: '0.625rem 1.5rem', borderRadius: 8, fontWeight: 700,
                    fontSize: '0.875rem', cursor: aiLoading ? 'not-allowed' : 'pointer',
                  }}>
                    {aiLoading ? '⏳ La IA está analizando…' : '🤖 ¿Cuál es la mejor opción?'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
      </div>
    </main>
  );
}
