'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayers } from '@/lib/players';
import { DEMO_PLAYERS, DEMO_ALERTS } from '@/lib/demo-data';
import {
  getAlerts, addAlert, completeAlert as completeAlertFn,
  postponeAlert as postponeAlertFn, snoozeAlert, deleteAlert as deleteAlertFn,
  updateAlert,
} from '@/lib/alerts';
import { Player } from '@/types/player';
import { Alert, AlertPriority } from '@/types/alert';
import AppNav from '@/components/AppNav';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().split('T')[0]; }

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

const PRIORITY_CFG: Record<AlertPriority, { dot: string; label: string; bg: string; color: string; border: string }> = {
  urgent: { dot: '#F87171', label: 'Urgente',    bg: 'rgba(248,113,113,0.08)', color: '#F87171', border: 'rgba(248,113,113,0.25)' },
  warning:{ dot: '#FBBF24', label: 'Importante', bg: 'rgba(251,191,36,0.08)',  color: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  info:   { dot: '#818CF8', label: 'Normal',     bg: 'rgba(129,140,248,0.08)', color: '#818CF8', border: 'rgba(129,140,248,0.25)' },
};

const INITIAL_FORM = { playerId: '', date: '', message: '', priority: 'info' as AlertPriority };

const S = {
  input: {
    width: '100%', background: '#FFFFFF', border: '1px solid #D1D5DB',
    borderRadius: '8px', padding: '0.6rem 0.875rem', color: '#111827',
    fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-body)',
  } as React.CSSProperties,
  label: {
    color: '#6B7280', fontSize: '0.69rem', fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
    display: 'block', marginBottom: '0.35rem',
  } as React.CSSProperties,
};

// ─── Alert item ───────────────────────────────────────────────────────────────

function AlertItem({ alert, players, today, onComplete, onPostpone, onSnooze, onDelete }: {
  alert: Alert; players: Player[]; today: string;
  onComplete: () => void; onPostpone: () => void;
  onSnooze: (days: number) => void; onDelete: () => void;
}) {
  const cfg = PRIORITY_CFG[alert.priority];
  const player = players.find(p => p.id === alert.playerId);
  const overdue = !alert.done && alert.date && alert.date < today;
  const [showSnooze, setShowSnooze] = useState(false);

  return (
    <div style={{
      display: 'flex', gap: '0.875rem',
      padding: '1rem',
      borderRadius: '10px',
      marginBottom: '0.375rem',
      background: overdue ? 'rgba(239,68,68,0.04)' : '#FAFAFA',
      border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : '#E5E7EB'}`,
      opacity: alert.done ? 0.6 : 1,
    }}>
      {/* Priority dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: alert.done ? '#334155' : cfg.dot,
        flexShrink: 0, marginTop: '0.35rem',
      }} />

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-body)',
          color: overdue ? '#DC2626' : alert.done ? '#9CA3AF' : '#111827',
          textDecoration: alert.done ? 'line-through' : 'none',
          display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
        }}>
          {alert.message || '—'}
          {overdue && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, color: '#F87171',
              border: '1px solid rgba(248,113,113,0.4)', borderRadius: '4px',
              padding: '0.1rem 0.375rem', letterSpacing: '0.06em',
            }}>VENCIDA</span>
          )}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {player && (
            <Link href={`/app/players/${player.id}`}
              style={{ color: 'var(--purple-3)', fontWeight: 600, textDecoration: 'none' }}>
              {player.name}
            </Link>
          )}
          {alert.date && <span>Límite: {formatDate(alert.date)}</span>}
        </div>

        {!alert.done && (
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <ActionBtn onClick={onComplete} color="#34D399" bg="rgba(52,211,153,0.1)" border="rgba(52,211,153,0.2)">
              Completar
            </ActionBtn>
            <ActionBtn onClick={onPostpone} color="#94A3B8" bg="rgba(255,255,255,0.05)" border="var(--border)">
              Posponer 7d
            </ActionBtn>
            <div style={{ position: 'relative' }}>
              <ActionBtn onClick={() => setShowSnooze(v => !v)} color="#94A3B8" bg="rgba(255,255,255,0.05)" border="var(--border)">
                Snooze
              </ActionBtn>
              {showSnooze && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4,
                  background: '#FFFFFF', border: '1px solid #E5E7EB',
                  borderRadius: '9px', padding: '0.375rem', zIndex: 10, minWidth: 110,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}>
                  {[1, 3, 7, 14].map(d => (
                    <button key={d} onClick={() => { onSnooze(d); setShowSnooze(false); }}
                      style={{
                        display: 'block', width: '100%', padding: '0.375rem 0.625rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#374151', fontSize: '0.8rem', textAlign: 'left',
                        borderRadius: '6px', fontFamily: 'var(--font-body)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      {d === 1 ? 'Mañana' : `${d} días`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ActionBtn onClick={onDelete} color="#F87171" bg="rgba(248,113,113,0.08)" border="rgba(248,113,113,0.2)">
              Eliminar
            </ActionBtn>
          </div>
        )}

        {alert.done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#334155' }}>
              Completada {alert.doneAt ? formatDate(alert.doneAt.split('T')[0]) : ''}
            </span>
            <ActionBtn onClick={onDelete} color="#F87171" bg="transparent" border="transparent">
              Eliminar
            </ActionBtn>
          </div>
        )}
      </div>

      {/* Badge */}
      <span style={{
        flexShrink: 0, alignSelf: 'flex-start',
        padding: '0.15rem 0.55rem', borderRadius: '6px',
        fontSize: '0.69rem', fontWeight: 700, letterSpacing: '0.04em',
        background: alert.done ? 'rgba(255,255,255,0.04)' : cfg.bg,
        color: alert.done ? '#334155' : cfg.color,
        border: `1px solid ${alert.done ? 'var(--border)' : cfg.border}`,
        fontFamily: 'var(--font-body)',
      }}>
        {cfg.label}
      </span>
    </div>
  );
}

function ActionBtn({ onClick, color, bg, border, children }: {
  onClick: () => void; color: string; bg: string; border: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '0.25rem 0.625rem', borderRadius: '6px',
      border: `1px solid ${border}`, cursor: 'pointer',
      background: bg, color, fontSize: '0.75rem', fontWeight: 600,
      fontFamily: 'var(--font-body)',
    }}>
      {children}
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, badge, children, className }: { title: string; badge?: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      background: '#FFFFFF', border: '1px solid #E5E7EB',
      borderRadius: '14px', padding: '1.375rem', marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <p style={{ color: '#6B7280', fontSize: '0.69rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0, fontFamily: 'var(--font-body)' }}>
          {title}
        </p>
        {badge !== undefined && badge > 0 && (
          <span style={{ padding: '0.1rem 0.5rem', borderRadius: '99px', background: '#DC2626', color: 'white', fontSize: '0.69rem', fontWeight: 800 }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Alert | null>(null);

  const today = todayISO();

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (isDemo) {
      setPlayers(DEMO_PLAYERS);
      setAlerts(DEMO_ALERTS);
      setLoadingData(false);
      return;
    }
    if (!user) return;
    Promise.all([getPlayers(user.uid), getAlerts(user.uid)])
      .then(([ps, as]) => { setPlayers(ps); setAlerts(as); })
      .catch(err => console.error('alerts load error:', err))
      .finally(() => setLoadingData(false));
  }, [user, isDemo]);

  const visibleAlerts = alerts.filter(a => !a.snoozedUntil || a.snoozedUntil <= today);
  const pending    = visibleAlerts.filter(a => !a.done);
  const done       = visibleAlerts.filter(a => a.done);
  const urgentCount = pending.filter(a => a.priority === 'urgent').length;

  const handleCreate = async () => {
    if (isDemo) { setSaveError('No se pueden crear alertas en modo demo.'); return; }
    if (!user || !form.message.trim()) return;
    setSaving(true); setSaveError('');
    try {
      const now = new Date().toISOString();
      const newAlert: Omit<Alert, 'id'> = { ...form, done: false, createdAt: now };
      const id = await addAlert(user.uid, newAlert);
      setAlerts(prev => [{ id, ...newAlert }, ...prev]);
      setForm(INITIAL_FORM);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setSaveError(`No se pudo crear la alerta: ${msg}`);
    } finally { setSaving(false); }
  };

  const handleComplete = async (a: Alert) => {
    if (!user) return;
    try {
      await completeAlertFn(user.uid, a.id);
      setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, done: true, doneAt: new Date().toISOString() } : x));
    } catch (err) { console.error(err); }
  };

  const handlePostpone = async (a: Alert) => {
    if (!user) return;
    try {
      await postponeAlertFn(user.uid, a.id, a.date);
      const base = a.date ? new Date(a.date + 'T00:00:00') : new Date();
      base.setDate(base.getDate() + 7);
      const newDate = base.toISOString().split('T')[0];
      setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, date: newDate } : x));
    } catch (err) { console.error(err); }
  };

  const handleSnooze = async (a: Alert, days: number) => {
    if (!user) return;
    try {
      const until = new Date(); until.setDate(until.getDate() + days);
      const snoozedUntil = until.toISOString().split('T')[0];
      await updateAlert(user.uid, a.id, { snoozedUntil });
      setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, snoozedUntil } : x));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (a: Alert) => {
    if (!user) return;
    setConfirmDelete(null);
    try {
      await deleteAlertFn(user.uid, a.id);
      setAlerts(prev => prev.filter(x => x.id !== a.id));
    } catch (err) { console.error(err); }
  };

  if (loading || loadingData) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#475569' }}>Cargando…</p>
      </main>
    );
  }

  // Suppress unused import warning
  void snoozeAlert;

  return (
    <main style={{ minHeight: '100vh', background: '#0B0F1A' }}>
      <AppNav activePage="alerts" urgentCount={urgentCount} />

      {/* ── Hero band ── */}
      <div style={{
        background: '#0B0F1A',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        position: 'relative', overflow: 'hidden',
        paddingTop: '7rem', paddingBottom: '3.5rem',
        paddingLeft: '1.5rem', paddingRight: '1.5rem',
      }}>
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(248,113,113,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--purple-2)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem', fontFamily: 'var(--font-body)' }}>Seguimiento</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
              Alertas
            </h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Pendientes', value: pending.length, color: '#F59E0B' },
              { label: 'Urgentes', value: urgentCount, color: '#EF4444' },
              { label: 'Completadas', value: done.length, color: '#10B981' },
            ].map((stat, idx) => (
              <div key={stat.label} className={`mm-fade-up-${idx + 1}`} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.1rem 1.25rem', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                <p style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.4rem', fontFamily: 'var(--font-body)' }}>{stat.label}</p>
                <p className="mm-stat-num" style={{ color: stat.color, margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── White content panel ── */}
      <div style={{ background: '#FFFFFF', borderRadius: '2rem 2rem 0 0', marginTop: '-1.5rem', boxShadow: '0 -12px 40px rgba(0,0,0,0.18)', minHeight: '60vh', paddingTop: '2rem', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0' }}>

        {/* Create form */}
        <SectionCard title="Nueva alerta" className="mm-fade-up-1">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={S.label}>Jugador (opcional)</label>
              <select style={S.input} value={form.playerId} onChange={e => setForm(f => ({ ...f, playerId: e.target.value }))}>
                <option value="">Sin jugador asociado</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.club || p.position}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Fecha límite</label>
              <input type="date" style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Mensaje *</label>
              <input style={S.input} value={form.message} placeholder="Ej: Revisar antes del cierre de mercado"
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>Prioridad</label>
              <select style={S.input} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as AlertPriority }))}>
                <option value="info">Normal</option>
                <option value="warning">Importante</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={handleCreate}
                disabled={saving || !form.message.trim()}
                style={{
                  width: '100%', padding: '0.6rem', borderRadius: '8px', border: 'none',
                  background: saving || !form.message.trim() ? '#5B21B6' : 'var(--purple)',
                  color: 'white', fontWeight: 600, fontSize: '0.875rem',
                  cursor: saving || !form.message.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  boxShadow: saving || !form.message.trim() ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
                }}>
                {saving ? 'Creando…' : '+ Crear alerta'}
              </button>
            </div>
          </div>
          {saveError && (
            <div style={{ marginTop: '0.75rem', padding: '0.625rem', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#FCA5A5', fontSize: '0.825rem' }}>
              {saveError}
            </div>
          )}
        </SectionCard>

        {/* Pending */}
        <SectionCard title="Pendientes" badge={pending.length} className="mm-fade-up-2">
          {pending.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem 0' }}>
              Sin alertas pendientes
            </p>
          ) : (
            pending.map(a => (
              <AlertItem key={a.id} alert={a} players={players} today={today}
                onComplete={() => handleComplete(a)}
                onPostpone={() => handlePostpone(a)}
                onSnooze={(days) => handleSnooze(a, days)}
                onDelete={() => setConfirmDelete(a)}
              />
            ))
          )}
        </SectionCard>

        {/* Completed */}
        {done.length > 0 && (
          <div style={{ opacity: 0.7 }}>
            <SectionCard title={`Completadas (${done.length})`}>
              {done.slice(0, 10).map(a => (
                <AlertItem key={a.id} alert={a} players={players} today={today}
                  onComplete={() => {}} onPostpone={() => {}} onSnooze={() => {}}
                  onDelete={() => setConfirmDelete(a)}
                />
              ))}
            </SectionCard>
          </div>
        )}
      </div>
      </div>

      {/* Delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '1.75rem', maxWidth: 400, width: '90%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <h3 style={{ color: 'white', margin: '0 0 0.5rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Eliminar alerta
            </h3>
            <p style={{ color: '#64748B', margin: '0 0 1.5rem', fontSize: '0.875rem' }}>
              ¿Eliminar esta alerta? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                background: 'transparent', color: '#94A3B8',
                border: '1px solid var(--border)', padding: '0.5rem 1rem',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem',
                fontFamily: 'var(--font-body)',
              }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                background: '#DC2626', color: 'white', border: 'none',
                padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
