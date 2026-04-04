'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayers, addPlayer } from '@/lib/players';
import { Player, PlayerPosition, PlayerFoot, PlayerStatus } from '@/types/player';
import AppNav from '@/components/AppNav';

const POSITIONS: PlayerPosition[] = [
  'Portero', 'Lateral Derecho', 'Lateral Izquierdo', 'Central',
  'Mediocentro Defensivo', 'Mediocentro', 'Mediocentro Ofensivo',
  'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro', 'Segunda Punta',
];

const STATUS_CONFIG: Record<PlayerStatus, { color: string; bg: string; border: string; label: string }> = {
  activo:      { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  label: 'Activo' },
  seguimiento: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',  label: 'Seguimiento' },
  espera:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',  label: 'En espera' },
  descartado:  { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',   label: 'Descartado' },
};

const INITIAL_FORM = {
  name: '',
  birthDate: '',
  position: 'Mediocentro' as PlayerPosition,
  foot: 'derecho' as PlayerFoot,
  height: 175,
  weight: 70,
  club: '',
  city: '',
  category: '',
  division: '',
  status: 'seguimiento' as PlayerStatus,
  privateNotes: '',
  tags: '',
};

const S = {
  input: {
    width: '100%',
    backgroundColor: 'var(--navy)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.6rem 0.875rem',
    color: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  label: {
    color: '#64748B',
    fontSize: '0.69rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    display: 'block',
    marginBottom: '0.35rem',
  } as React.CSSProperties,
};

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getBirthYear(birthDate: string): string {
  if (!birthDate) return '—';
  return birthDate.split('-')[0] ?? birthDate.slice(0, 4);
}

function calcRating(metrics: Player['metrics']): number {
  const vals = [metrics.technical, metrics.tactical, metrics.physical, metrics.attitude];
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function ratingColor(rating: number): string {
  if (rating >= 8) return '#10B981';
  if (rating >= 6.5) return '#F59E0B';
  return '#EF4444';
}

function Avatar({ name, status }: { name: string; status: PlayerStatus }) {
  const sc = STATUS_CONFIG[status];
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
      background: sc.bg,
      border: `1px solid ${sc.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: sc.color, fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        {getInitials(name)}
      </span>
    </div>
  );
}

export default function AppPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<PlayerStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');

  void signOut;

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getPlayers(user.uid)
        .then(setPlayers)
        .catch(err => {
          console.error('getPlayers error:', err);
          setLoadError('Error al cargar jugadores. Recarga la página.');
        })
        .finally(() => setLoadingPlayers(false));
    }
  }, [user]);

  const filtered = players.filter(p => {
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus;
    const matchSearch = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.club.toLowerCase().includes(search.toLowerCase())
      || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const handleSubmit = async () => {
    if (!user || !form.name.trim() || !form.club.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const now = new Date().toISOString();
      const id = await addPlayer({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        height: Number(form.height),
        weight: Number(form.weight),
        photo: '',
        metrics: { technical: 5, tactical: 5, physical: 5, attitude: 5 },
        userId: user.uid,
        createdAt: now,
        updatedAt: now,
      });
      const newPlayer: Player = {
        id,
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        height: Number(form.height),
        weight: Number(form.weight),
        photo: '',
        metrics: { technical: 5, tactical: 5, physical: 5, attitude: 5 },
        userId: user.uid,
        createdAt: now,
        updatedAt: now,
      };
      setPlayers(prev => [newPlayer, ...prev]);
      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err: unknown) {
      console.error('addPlayer error:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setSaveError(`No se pudo guardar el jugador: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#475569', fontFamily: 'var(--font-body)' }}>Cargando…</p>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <AppNav activePage="players" />

      {/* ── Hero band ─────────────────────────────────────────── */}
      <div
        style={{
          background: '#0B0F1A',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: '7rem',
          paddingBottom: '3.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Title + CTA */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}
            className="mm-fade-up">
            <div>
              <p style={{
                color: 'var(--purple-2)', fontSize: '0.68rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                marginBottom: '0.4rem', fontFamily: 'var(--font-body)',
              }}>
                Base de jugadores
              </p>
              <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
                Mis Jugadores
              </h1>
            </div>
            <button onClick={() => setShowForm(true)} className="mm-btn-primary">
              + Nuevo jugador
            </button>
          </div>

          {/* Stats row — 5 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
            {([
              { label: 'Total',        value: players.length,                                        color: 'white' },
              { label: 'Activos',      value: players.filter(p => p.status === 'activo').length,     color: STATUS_CONFIG.activo.color },
              { label: 'Seguimiento',  value: players.filter(p => p.status === 'seguimiento').length, color: STATUS_CONFIG.seguimiento.color },
              { label: 'En espera',    value: players.filter(p => p.status === 'espera').length,     color: STATUS_CONFIG.espera.color },
              { label: 'Descartados',  value: players.filter(p => p.status === 'descartado').length, color: STATUS_CONFIG.descartado.color },
            ] as { label: string; value: number; color: string }[]).map((stat, idx) => (
              <div key={stat.label}
                className={`mm-card-hover mm-fade-up-${Math.min(idx + 1, 4)}`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '16px',
                  padding: '1.1rem 1.25rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}>
                <p style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.4rem', fontFamily: 'var(--font-body)' }}>
                  {stat.label}
                </p>
                <p className="mm-stat-num" style={{ color: stat.color, margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── White content pane ────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '2rem 2rem 0 0',
        marginTop: '-1.5rem',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
        minHeight: '60vh',
        paddingTop: '2rem',
        paddingBottom: '4rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }} className="mm-fade-in">

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar jugador, club o etiqueta…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '260px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '999px',
                  padding: '0.55rem 1rem 0.55rem 2.5rem',
                  color: '#111827',
                  fontSize: '0.875rem',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {(['todos', 'activo', 'seguimiento', 'espera', 'descartado'] as const).map(s => {
                const isActive = filterStatus === s;
                const dotColor = s === 'todos' ? '#8B5CF6' : STATUS_CONFIG[s as PlayerStatus].color;
                const activeBg = s === 'todos' ? '#111827' : STATUS_CONFIG[s as PlayerStatus].bg;
                const activeColor = s === 'todos' ? 'white' : STATUS_CONFIG[s as PlayerStatus].color;
                const label = s === 'todos' ? 'Todos' : STATUS_CONFIG[s as PlayerStatus].label;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.35rem 0.875rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isActive
                        ? (s === 'todos' ? '1px solid #111827' : `1px solid ${STATUS_CONFIG[s as PlayerStatus].border}`)
                        : '1px solid #E5E7EB',
                      backgroundColor: isActive ? activeBg : 'white',
                      color: isActive ? activeColor : '#6B7280',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {s !== 'todos' && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        backgroundColor: dotColor, flexShrink: 0,
                        display: 'inline-block',
                      }} />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
              {filtered.length} {filtered.length === 1 ? 'jugador' : 'jugadores'}
            </div>
          </div>

          {loadError && (
            <div style={{
              marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#DC2626', fontSize: '0.875rem',
            }}>
              {loadError}
            </div>
          )}

          {/* Player list */}
          <div>
            {/* Column headers */}
            {!loadingPlayers && filtered.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 2fr 1.5fr 1.5fr 0.8fr',
                gap: '1rem',
                padding: '0 1.25rem 0.625rem',
                borderBottom: '1px solid #F3F4F6',
                marginBottom: '0.25rem',
              }}>
                {['Jugador', 'Etiquetas', 'Datos', 'Estado', 'Nota'].map(h => (
                  <span key={h} style={{
                    color: '#9CA3AF', fontSize: '0.69rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    fontFamily: 'var(--font-body)',
                    textAlign: h === 'Nota' ? 'right' : 'left',
                  }}>{h}</span>
                ))}
              </div>
            )}

            {loadingPlayers ? (
              <p style={{ color: '#9CA3AF', padding: '3rem', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
                Cargando jugadores…
              </p>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {players.length === 0 ? 'Aún no hay jugadores en tu base.' : 'Sin resultados para este filtro.'}
                </p>
                {players.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}
                  >
                    Añadir el primer jugador →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {filtered.map(player => {
                  const sc = STATUS_CONFIG[player.status];
                  const rating = calcRating(player.metrics);
                  const rColor = ratingColor(rating);
                  const isDiscarded = player.status === 'descartado';
                  const year = getBirthYear(player.birthDate);
                  return (
                    <Link
                      key={player.id}
                      href={`/app/players/${player.id}`}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '3fr 2fr 1.5fr 1.5fr 0.8fr',
                          gap: '1rem',
                          padding: '0.75rem 1.25rem',
                          borderRadius: '12px',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                          opacity: isDiscarded ? 0.65 : 1,
                          borderLeft: '3px solid transparent',
                          position: 'relative',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#F9FAFB';
                          e.currentTarget.style.borderLeftColor = sc.color;
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderLeftColor = 'transparent';
                          e.currentTarget.style.opacity = isDiscarded ? '0.65' : '1';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Col 1: Player */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar name={player.name} status={player.status} />
                          <div>
                            <p style={{
                              color: isDiscarded ? '#9CA3AF' : '#111827',
                              margin: 0, fontWeight: 700, fontSize: '0.9rem',
                              fontFamily: 'var(--font-body)',
                              textDecoration: isDiscarded ? 'line-through' : 'none',
                            }}>
                              {player.name}
                            </p>
                            <p style={{ color: '#6B7280', margin: 0, fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>
                              {[player.position, player.club, player.category].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>

                        {/* Col 2: Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {player.tags.slice(0, 3).map(tag => (
                            <span key={tag} style={{
                              padding: '0.2rem 0.5rem',
                              background: '#F3F4F6',
                              color: '#374151',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              fontFamily: 'var(--font-body)',
                              border: '1px solid #E5E7EB',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Col 3: Physical data */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ color: '#6B7280', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
                            {year !== '—' ? `Año ${year}` : '—'}
                          </span>
                          <span style={{ color: '#9CA3AF', fontSize: '0.75rem', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>
                            {player.foot !== 'ambos' ? `Pie ${player.foot}` : 'Ambos pies'}
                          </span>
                        </div>

                        {/* Col 4: Status badge */}
                        <div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            background: sc.bg,
                            color: sc.color,
                            border: `1px solid ${sc.border}`,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            fontFamily: 'var(--font-body)',
                          }}>
                            <span style={{
                              width: 5, height: 5, borderRadius: '50%',
                              backgroundColor: sc.color, flexShrink: 0,
                              boxShadow: `0 0 6px ${sc.color}`,
                            }} />
                            {sc.label}
                          </span>
                        </div>

                        {/* Col 5: Rating */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            color: rColor,
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                          }}>
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── New player modal ──────────────────────────────────── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: '1rem', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--navy-2)',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.1)',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                Nuevo jugador
              </h2>
              <button
                onClick={() => { setShowForm(false); setSaveError(''); }}
                style={{
                  background: 'none', border: 'none', color: '#64748B',
                  cursor: 'pointer', fontSize: '1.375rem', lineHeight: 1,
                  padding: '0.25rem',
                }}
              >×</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Nombre *</label>
                  <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" />
                </div>
                <div>
                  <label style={S.label}>Fecha de nacimiento</label>
                  <input type="date" style={S.input} value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Posición</label>
                  <select style={S.input} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value as PlayerPosition }))}>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Pie</label>
                  <select style={S.input} value={form.foot} onChange={e => setForm(f => ({ ...f, foot: e.target.value as PlayerFoot }))}>
                    <option value="derecho">Derecho</option>
                    <option value="izquierdo">Izquierdo</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Altura (cm)</label>
                  <input type="number" style={S.input} value={form.height} onChange={e => setForm(f => ({ ...f, height: Number(e.target.value) }))} min={140} max={220} />
                </div>
                <div>
                  <label style={S.label}>Peso (kg)</label>
                  <input type="number" style={S.input} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))} min={40} max={130} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Club *</label>
                  <input style={S.input} value={form.club} onChange={e => setForm(f => ({ ...f, club: e.target.value }))} placeholder="Club actual" />
                </div>
                <div>
                  <label style={S.label}>Ciudad</label>
                  <input style={S.input} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ciudad" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Categoría</label>
                  <input style={S.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="ej. Juvenil A" />
                </div>
                <div>
                  <label style={S.label}>División</label>
                  <input style={S.input} value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} placeholder="ej. Primera División" />
                </div>
              </div>

              <div>
                <label style={S.label}>Estado</label>
                <select style={S.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PlayerStatus }))}>
                  <option value="activo">Activo</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="espera">En espera</option>
                  <option value="descartado">Descartado</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Etiquetas (separadas por coma)</label>
                <input style={S.input} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="rápido, técnico, liderazgo" />
              </div>

              <div>
                <label style={S.label}>Notas privadas</label>
                <textarea
                  style={{ ...S.input, minHeight: '80px', resize: 'vertical' }}
                  value={form.privateNotes}
                  onChange={e => setForm(f => ({ ...f, privateNotes: e.target.value }))}
                  placeholder="Observaciones del scouting…"
                />
              </div>

              {saveError && (
                <div style={{
                  padding: '0.625rem 0.875rem', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#FCA5A5', fontSize: '0.825rem',
                }}>
                  {saveError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => { setShowForm(false); setSaveError(''); }}
                  style={{
                    background: 'transparent', color: '#94A3B8',
                    border: '1px solid var(--border)', padding: '0.6rem 1.25rem',
                    borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !form.name.trim() || !form.club.trim()}
                  style={{
                    background: saving ? '#5B21B6' : 'var(--purple)',
                    color: 'white', border: 'none',
                    padding: '0.6rem 1.5rem', borderRadius: '8px',
                    fontSize: '0.875rem', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    boxShadow: saving ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
                  }}
                >
                  {saving ? 'Guardando…' : 'Guardar jugador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
