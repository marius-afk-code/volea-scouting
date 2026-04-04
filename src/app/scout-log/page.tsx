'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AppNav from '@/components/AppNav';
import {
  getMatches,
  addMatch,
  updateMatch,
  deleteMatch,
  getSavedCompetitions,
  persistSavedCompetitions,
} from '@/lib/matches';
import { Match, MatchCategory } from '@/types/match';
import { DEMO_MATCHES, DEMO_PLAYERS } from '@/lib/demo-data';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: MatchCategory[] = [
  '', 'Profesional', 'División de Honor', 'Nacional', 'Regional',
  'Juvenil', 'Cadete', 'Infantil', 'Alevín', 'Internacional',
];

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const INITIAL_FORM: Omit<Match, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  date: todayISO(),
  competition: '',
  category: '',
  homeTeam: '',
  awayTeam: '',
  result: '',
  venue: '',
  notes: '',
  linkedPlayers: [],
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '0.625rem 0.875rem',
  color: '#111827',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '0.72rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: '0.375rem',
};

// ─── Stat bar (pure CSS) ──────────────────────────────────────────────────────

function StatBar({ label, value, max, color = '#7C3AED' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
      <span style={{ color: '#6B7280', fontSize: '0.8rem', minWidth: '140px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: '8px', backgroundColor: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '999px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ color: '#111827', fontSize: '0.8rem', fontWeight: '700', minWidth: '24px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ─── Monthly mini-bars ────────────────────────────────────────────────────────

function MonthlyChart({ matches }: { matches: Match[] }) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES[d.getMonth()] };
  });
  const counts = months.map(({ year, month }) =>
    matches.filter(m => {
      if (!m.date) return false;
      const d = new Date(m.date + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    }).length
  );
  const maxCount = Math.max(...counts, 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px', padding: '0 4px' }}>
      {months.map(({ label }, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ color: '#374151', fontSize: '0.65rem', fontWeight: '700', opacity: counts[i] > 0 ? 1 : 0 }}>{counts[i] || ''}</span>
          <div
            style={{
              width: '100%',
              height: `${Math.max((counts[i] / maxCount) * 60, counts[i] > 0 ? 4 : 0)}px`,
              backgroundColor: counts[i] > 0 ? '#7C3AED' : '#F3F4F6',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.4s',
            }}
          />
          <span style={{ color: '#9CA3AF', fontSize: '0.6rem', transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stats Panel ─────────────────────────────────────────────────────────────

function StatsPanel({ matches }: { matches: Match[] }) {
  if (!matches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
        <p>Añade partidos para ver las estadísticas.</p>
      </div>
    );
  }

  // Competition counts
  const compCount: Record<string, number> = {};
  matches.forEach(m => { if (m.competition) compCount[m.competition] = (compCount[m.competition] || 0) + 1; });
  const topComps = Object.entries(compCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Category counts
  const catCount: Record<string, number> = {};
  matches.forEach(m => { if (m.category) catCount[m.category] = (catCount[m.category] || 0) + 1; });
  const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]);

  // Team counts
  const teamCount: Record<string, number> = {};
  matches.forEach(m => {
    if (m.homeTeam) teamCount[m.homeTeam] = (teamCount[m.homeTeam] || 0) + 1;
    if (m.awayTeam) teamCount[m.awayTeam] = (teamCount[m.awayTeam] || 0) + 1;
  });
  const topTeams = Object.entries(teamCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const card: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    padding: '1.5rem',
    marginBottom: '1rem',
  };
  const cardTitle: React.CSSProperties = {
    color: '#6B7280',
    fontSize: '0.72rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 1.25rem',
  };

  return (
    <div>
      {/* Monthly chart */}
      <div style={card}>
        <h3 style={cardTitle}>Partidos por mes (últimos 12 meses)</h3>
        <MonthlyChart matches={matches} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* By competition */}
        {topComps.length > 0 && (
          <div style={card}>
            <h3 style={cardTitle}>Por competición</h3>
            {topComps.map(([name, count]) => (
              <StatBar key={name} label={name} value={count} max={topComps[0][1]} color="#7C3AED" />
            ))}
          </div>
        )}

        {/* By category */}
        {topCats.length > 0 && (
          <div style={card}>
            <h3 style={cardTitle}>Por categoría</h3>
            {topCats.map(([name, count]) => (
              <StatBar key={name} label={name} value={count} max={topCats[0][1]} color="#8B5CF6" />
            ))}
          </div>
        )}
      </div>

      {/* Top teams */}
      {topTeams.length > 0 && (
        <div style={card}>
          <h3 style={cardTitle}>Top 10 equipos vistos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
            {topTeams.map(([name, count]) => (
              <StatBar key={name} label={name} value={count} max={topTeams[0][1]} color="#3B82F6" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScoutLogPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [tab, setTab] = useState<'matches' | 'stats'>('matches');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Delete confirmation
  const [confirmMatch, setConfirmMatch] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Competitions dropdown — Bug fix #1: controlled state, not DOM getElementById
  const [savedComps, setSavedComps] = useState<string[]>([]);
  const [compDropdownOpen, setCompDropdownOpen] = useState(false);
  const compContainerRef = useRef<HTMLDivElement>(null);

  // Filter / search
  const [search, setSearch] = useState('');

  // ── Auth redirect ──
  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  // ── Load matches ──
  useEffect(() => {
    if (isDemo) {
      setMatches(DEMO_MATCHES);
      setLoadingMatches(false);
      return;
    }
    if (!user) return;
    getMatches(user.uid)
      .then(setMatches)
      .catch(err => console.error('Error cargando partidos:', err))
      .finally(() => setLoadingMatches(false));
  }, [user, isDemo]);

  // ── Load saved competitions ──
  useEffect(() => {
    if (isDemo) return;
    if (!user) return;
    getSavedCompetitions(user.uid).then(setSavedComps);
  }, [user, isDemo]);

  // ── Close comp dropdown on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (compContainerRef.current && !compContainerRef.current.contains(e.target as Node)) {
        setCompDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Derived stats ──
  const totalMatches = matches.length;
  const totalComps = new Set(matches.map(m => m.competition).filter(Boolean)).size;
  const totalHours = Math.round(totalMatches * 1.5);

  // ── Filtered list ──
  const filtered = matches.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.homeTeam.toLowerCase().includes(q) ||
      m.awayTeam.toLowerCase().includes(q) ||
      m.competition.toLowerCase().includes(q) ||
      m.venue.toLowerCase().includes(q)
    );
  });

  // ── Handlers ──
  function openAdd() {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, date: todayISO() });
    setCompDropdownOpen(false);
    setShowModal(true);
  }

  // Bug fix #3: edit button opens form pre-filled
  function openEdit(m: Match) {
    setEditingId(m.id);
    setForm({
      date: m.date,
      competition: m.competition,
      category: m.category,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      result: m.result,
      venue: m.venue,
      notes: m.notes,
      linkedPlayers: m.linkedPlayers,
    });
    setCompDropdownOpen(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setCompDropdownOpen(false);
    setSaveError('');
  }

  async function handleSave() {
    if (isDemo) { closeModal(); return; }
    if (!user || !form.date || !form.homeTeam.trim() || !form.awayTeam.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const now = new Date().toISOString();
      if (editingId) {
        await updateMatch(editingId, { ...form, updatedAt: now });
        setMatches(prev => prev.map(m => m.id === editingId ? { ...m, ...form, updatedAt: now } : m));
      } else {
        const id = await addMatch({ ...form, userId: user.uid, createdAt: now, updatedAt: now });
        setMatches(prev => [{ id, ...form, userId: user.uid, createdAt: now, updatedAt: now }, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  // Bug fix #2: confirmMatch holds the full match so the dialog shows the correct name
  async function handleDelete() {
    if (!confirmMatch) return;
    if (isDemo) { setConfirmMatch(null); return; }
    setDeleting(true);
    try {
      await deleteMatch(confirmMatch.id);
      setMatches(prev => prev.filter(m => m.id !== confirmMatch.id));
      setConfirmMatch(null);
    } finally {
      setDeleting(false);
    }
  }

  // Bug fix #1: selecting a competition fills the controlled form state directly
  function selectComp(name: string) {
    setForm(f => ({ ...f, competition: name }));
    setCompDropdownOpen(false);
  }

  async function handleSaveComp() {
    const val = form.competition.trim();
    if (!val || savedComps.includes(val) || !user) return;
    const updated = [...savedComps, val];
    setSavedComps(updated);
    await persistSavedCompetitions(user.uid, updated);
  }

  async function handleRemoveComp(idx: number) {
    if (!user) return;
    const updated = savedComps.filter((_, i) => i !== idx);
    setSavedComps(updated);
    await persistSavedCompetitions(user.uid, updated);
  }

  // ── Loading ──
  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#475569' }}>Cargando…</p>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', background: '#0B0F1A' }}>
      <AppNav activePage="scout-log" />

      {/* ── Hero band ── */}
      <div style={{
        background: '#0B0F1A',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        position: 'relative', overflow: 'hidden',
        paddingTop: '7rem', paddingBottom: '3.5rem',
        paddingLeft: '1.5rem', paddingRight: '1.5rem',
      }}>
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1150px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--purple-2)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem', fontFamily: 'var(--font-body)' }}>Diario de campo</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
              Scout Log
            </h1>
            <button onClick={openAdd} className="mm-btn-primary">
              + Partido
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Partidos vistos', value: totalMatches, color: 'white' },
              { label: 'Competiciones', value: totalComps, color: '#A78BFA' },
              { label: 'Horas estimadas', value: `${totalHours}h`, color: '#60A5FA' },
              { label: 'Este mes', value: matches.filter(m => { const d = new Date(m.date + 'T12:00:00'); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: '#10B981' },
            ].map(({ label, value, color }, idx) => (
              <div key={label} className={`mm-fade-up-${Math.min(idx + 1, 4)}`} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.1rem 1.25rem', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                <p style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.4rem', fontFamily: 'var(--font-body)' }}>{label}</p>
                <p className="mm-stat-num" style={{ color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── White content panel ── */}
      <div style={{ background: '#FFFFFF', borderRadius: '2rem 2rem 0 0', marginTop: '-1.5rem', boxShadow: '0 -12px 40px rgba(0,0,0,0.18)', minHeight: '60vh', paddingTop: '2rem', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0' }}>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '3px', background: '#F3F4F6', borderRadius: '10px', padding: '4px', marginBottom: '1.25rem', border: '1px solid #E5E7EB', width: 'fit-content' }}>
          {(['matches', 'stats'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: tab === t ? '#7C3AED' : 'transparent',
                color: tab === t ? 'white' : '#6B7280',
                transition: 'all 0.15s',
              }}
            >
              {t === 'matches' ? '🗓️ Partidos' : '📊 Estadísticas'}
            </button>
          ))}
        </div>

        {/* ── Matches panel ── */}
        {tab === 'matches' && (
          <div className="mm-fade-in">
            {/* Search */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Buscar por equipo, competición, campo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, maxWidth: '320px', padding: '0.5rem 0.875rem' }}
              />
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingMatches ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Cargando partidos...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
                  <div style={{ fontWeight: '600', marginBottom: '0.375rem' }}>Sin partidos registrados</div>
                  <div style={{ fontSize: '0.8rem' }}>Añade tu primer partido con el botón de arriba</div>
                </div>
              ) : filtered.map(m => {
                const d = m.date ? new Date(m.date + 'T12:00:00') : null;
                const day = d ? d.getDate() : '?';
                const mon = d ? MONTH_NAMES[d.getMonth()] : '';
                return (
                  <div
                    key={m.id}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E5E7EB', transition: 'border-color 0.15s, transform 0.18s, box-shadow 0.18s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Date block */}
                    <div style={{ minWidth: '52px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#111827', lineHeight: 1 }}>{day}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mon}</div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#111827', fontSize: '0.925rem', fontWeight: '600' }}>
                          {m.homeTeam}
                        </span>
                        {m.result && (
                          <span style={{ color: '#6B7280', fontSize: '0.8rem', fontWeight: '400' }}>{m.result}</span>
                        )}
                        <span style={{ color: '#111827', fontSize: '0.925rem', fontWeight: '600' }}>
                          {m.awayTeam}
                        </span>
                      </div>
                      <div style={{ color: '#6B7280', fontSize: '0.78rem', marginBottom: m.notes ? '0.375rem' : 0 }}>
                        {[m.competition, m.category, m.venue].filter(Boolean).join(' · ')}
                      </div>
                      {m.notes && (
                        <div style={{ color: '#9CA3AF', fontSize: '0.78rem', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions — Bug fix #3: edit button exists */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => openEdit(m)}
                        title="Editar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '14px', padding: '4px 6px', borderRadius: '6px', lineHeight: 1 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setConfirmMatch(m)}
                        title="Eliminar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '14px', padding: '4px 6px', borderRadius: '6px', lineHeight: 1 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Stats panel ── */}
        {tab === 'stats' && <StatsPanel matches={matches} />}
      </div>
      </div>

      {/* ══════════════════════════════════════════════
          MATCH FORM MODAL
      ══════════════════════════════════════════════ */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, overflowY: 'auto', padding: '2rem 1rem' }}
          onMouseDown={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: 'var(--navy-2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '560px', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

            {/* Modal header */}
            <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                {editingId ? 'Editar partido' : 'Añadir partido'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '2px 6px' }}>×</button>
            </div>

            <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

              {/* Row: date + result */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Fecha *</label>
                  <input type="date" style={inputStyle} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Resultado</label>
                  <input style={inputStyle} value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))} placeholder="ej: 2-1" />
                </div>
              </div>

              {/* Competition with dropdown — Bug fix #1 */}
              <div>
                <label style={labelStyle}>Competición</label>
                <div ref={compContainerRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {/* Controlled input — value comes from form state, no DOM lookups */}
                    <input
                      type="text"
                      style={{ ...inputStyle, flex: 1 }}
                      value={form.competition}
                      onChange={e => setForm(f => ({ ...f, competition: e.target.value }))}
                      placeholder="ej: Liga Autonómica Cadete"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setCompDropdownOpen(o => !o)}
                      title="Mis competiciones"
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backgroundColor: '#0B0F1A', color: '#94A3B8', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}
                    >
                      ☰
                    </button>
                  </div>

                  {/* Bug fix #1: selectComp sets React state — no getElementById needed */}
                  {compDropdownOpen && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', backgroundColor: '#1E2538', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', zIndex: 60, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                      {savedComps.length === 0 ? (
                        <div style={{ padding: '1rem', fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
                          Aún no tienes competiciones guardadas — escribe una y pulsa Guardar.
                        </div>
                      ) : (
                        savedComps.map((c, i) => (
                          <div
                            key={i}
                            style={{ display: 'flex', alignItems: 'center', padding: '0.625rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span
                              style={{ flex: 1, color: 'white', fontSize: '0.875rem' }}
                              onClick={() => selectComp(c)}
                            >
                              {c}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); handleRemoveComp(i); }}
                              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '12px', padding: '0 4px', lineHeight: 1 }}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Save competition button */}
                  {form.competition.trim() && !savedComps.includes(form.competition.trim()) && (
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={handleSaveComp}
                        style={{ fontSize: '0.72rem', padding: '3px 10px', border: '1px dashed #7C3AED', borderRadius: '6px', backgroundColor: 'rgba(124,58,237,0.08)', color: '#A78BFA', cursor: 'pointer' }}
                      >
                        ＋ Guardar en Mis competiciones
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Categoría</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MatchCategory }))}>
                  <option value="">Seleccionar...</option>
                  {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Teams */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Equipo local *</label>
                  <input style={inputStyle} value={form.homeTeam} onChange={e => setForm(f => ({ ...f, homeTeam: e.target.value }))} placeholder="Equipo local" />
                </div>
                <div>
                  <label style={labelStyle}>Equipo visitante *</label>
                  <input style={inputStyle} value={form.awayTeam} onChange={e => setForm(f => ({ ...f, awayTeam: e.target.value }))} placeholder="Equipo visitante" />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label style={labelStyle}>Campo / Lugar</label>
                <input style={inputStyle} value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Nombre del estadio o campo" />
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones, contexto del partido..."
                />
              </div>

              {/* Error message */}
              {saveError && (
                <p style={{ color: '#EF4444', fontSize: '0.8rem', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem', margin: 0 }}>
                  ⚠️ {saveError}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button onClick={closeModal} style={{ backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.date || !form.homeTeam.trim() || !form.awayTeam.trim()}
                  style={{ backgroundColor: saving ? '#5B21B6' : '#7C3AED', color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Guardando...' : 'Guardar partido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          Bug fix #2: shows actual match name, not generic text
      ══════════════════════════════════════════════ */}
      {confirmMatch && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
          <div style={{ backgroundColor: '#141928', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🗑️</div>
            <h2 style={{ color: 'white', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.625rem' }}>¿Eliminar partido?</h2>
            {/* Bug fix #2: show the actual match title */}
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              <strong style={{ color: 'white' }}>{confirmMatch.homeTeam} vs {confirmMatch.awayTeam}</strong>
            </p>
            {confirmMatch.date && (
              <p style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                {new Date(confirmMatch.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                {confirmMatch.competition ? ` · ${confirmMatch.competition}` : ''}
              </p>
            )}
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginBottom: '1.5rem' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmMatch(null)} style={{ backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
