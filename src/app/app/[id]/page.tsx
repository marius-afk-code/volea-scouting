'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getPlayer, updatePlayer, deletePlayer } from '@/lib/players';
import { DEMO_PLAYERS } from '@/lib/demo-data';
import {
  Player, PlayerPosition, PlayerFoot, PlayerStatus,
  DetailedMetrics, ClubHistoryEntry, VideoLink,
} from '@/types/player';

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITIONS: PlayerPosition[] = [
  'Portero', 'Lateral Derecho', 'Lateral Izquierdo', 'Central',
  'Mediocentro Defensivo', 'Mediocentro', 'Mediocentro Ofensivo',
  'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro', 'Segunda Punta',
];

const METRIC_LABELS: { key: keyof Player['metrics']; label: string; color: string }[] = [
  { key: 'technical', label: 'Técnica',  color: '#7C3AED' },
  { key: 'tactical',  label: 'Táctica',  color: '#3B82F6' },
  { key: 'physical',  label: 'Físico',   color: '#10B981' },
  { key: 'attitude',  label: 'Actitud',  color: '#F59E0B' },
];

const PRESET_TAGS = [
  'Rápido', 'Líder', 'Goleador', 'Creativo', 'Lesionado', 'Canterano',
  'Polivalente', 'Disciplinado', 'Técnico', 'Físico', 'Zurdo',
  'Buen regate', 'Visión de juego', 'Presión alta', 'Buen pase',
];

const DETAILED_GROUPS: {
  dim: keyof DetailedMetrics;
  label: string;
  color: string;
  subs: { key: string; label: string }[];
}[] = [
  {
    dim: 'technical', label: 'Técnica', color: '#7C3AED',
    subs: [
      { key: 'passing',   label: 'Pase' },
      { key: 'control',   label: 'Control' },
      { key: 'vision',    label: 'Visión de juego' },
      { key: 'dribbling', label: 'Conducción' },
      { key: 'pressing',  label: 'Pressing' },
    ],
  },
  {
    dim: 'tactical', label: 'Táctica', color: '#3B82F6',
    subs: [
      { key: 'balance',    label: 'Equilibrio' },
      { key: 'transition', label: 'Transición' },
      { key: 'recovery',   label: 'Recuperación' },
      { key: 'creation',   label: 'Creación' },
      { key: 'highPress',  label: 'Presión alta' },
    ],
  },
  {
    dim: 'physical', label: 'Físico', color: '#10B981',
    subs: [
      { key: 'speed',      label: 'Velocidad' },
      { key: 'resistance', label: 'Resistencia' },
      { key: 'strength',   label: 'Fuerza' },
      { key: 'jump',       label: 'Salto' },
    ],
  },
  {
    dim: 'attitude', label: 'Actitud', color: '#F59E0B',
    subs: [
      { key: 'leadership',      label: 'Liderazgo' },
      { key: 'competitiveness', label: 'Competitividad' },
      { key: 'coachability',    label: 'Receptividad al entrenador' },
    ],
  },
];

const INITIAL_DETAILED: DetailedMetrics = {
  technical: { passing: 5, control: 5, vision: 5, dribbling: 5, pressing: 5 },
  tactical:  { balance: 5, transition: 5, recovery: 5, creation: 5, highPress: 5 },
  physical:  { speed: 5, resistance: 5, strength: 5, jump: 5 },
  attitude:  { leadership: 5, competitiveness: 5, coachability: 5 },
};

const EMPTY_CLUB_ENTRY: ClubHistoryEntry = { club: '', category: '', season: '' };
const EMPTY_VIDEO_LINK: VideoLink = { label: '', url: '' };

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '0.625rem 0.875rem',
  color: '#111827',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '0.7rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: '0.375rem',
  fontFamily: 'var(--font-body)',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  padding: '1.5rem',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: '#64748B', fontSize: '0.68rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: '0 0 1.25rem', fontFamily: 'var(--font-body)',
    }}>
      {children}
    </p>
  );
}

function SubSlider({ label, val, color, onChange }: {
  label: string; val: number; color: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span style={{ color: '#6B7280', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>{label}</span>
        <span style={{ color, fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-heading)', minWidth: 28, textAlign: 'right' }}>{val}</span>
      </div>
      <input
        type="range" min={0} max={10} step={1} value={val}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditPlayerPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [tagsInput, setTagsInput] = useState('');
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);

  // Photo
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (!playerId) return;
    if (isDemo) {
      const p = DEMO_PLAYERS.find(pl => pl.id === playerId) ?? null;
      setPlayer(p);
      if (p) { setEditForm(p); setTagsInput(p.tags.join(', ')); setPhotoBase64(p.photoBase64 || ''); }
      setLoadingPlayer(false);
      return;
    }
    getPlayer(playerId)
      .then(p => {
        setPlayer(p);
        if (p) { setEditForm(p); setTagsInput(p.tags.join(', ')); setPhotoBase64(p.photoBase64 || ''); }
      })
      .catch(err => {
        console.error('getPlayer error:', err);
        setSaveError(err instanceof Error ? err.message : 'Error al cargar el jugador');
      })
      .finally(() => setLoadingPlayer(false));
  }, [playerId, isDemo]);

  // ── Photo handler ──
  const MAX_PHOTO_BYTES = 500 * 1024;
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(`La imagen pesa ${(file.size / 1024).toFixed(0)} KB. El máximo es 500 KB.`);
      return;
    }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => setPhotoBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Tag chip toggle ──
  const currentTagSet = new Set(
    tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  );
  const togglePresetTag = (tag: string) => {
    const current = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const lower = tag.toLowerCase();
    if (current.some(t => t.toLowerCase() === lower)) {
      setTagsInput(current.filter(t => t.toLowerCase() !== lower).join(', '));
    } else {
      setTagsInput([...current, tag].join(', '));
    }
  };

  // ── Detailed metrics update (auto-recalculates parent metric) ──
  const updateDetailedMetric = (dim: keyof DetailedMetrics, sub: string, val: number) => {
    setEditForm(f => {
      const base = f.detailedMetrics ?? INITIAL_DETAILED;
      const dimVals = base[dim] as Record<string, number>;
      const updatedDim = { ...dimVals, [sub]: val };
      const newDetailed = { ...base, [dim]: updatedDim } as DetailedMetrics;
      const subVals = Object.values(updatedDim);
      const avg = Math.round(subVals.reduce((a, b) => a + b, 0) / subVals.length);
      const baseMetrics = f.metrics ?? { technical: 5, tactical: 5, physical: 5, attitude: 5 };
      return { ...f, detailedMetrics: newDetailed, metrics: { ...baseMetrics, [dim]: avg } };
    });
  };

  // ── Club history helpers ──
  const addClubEntry = () => {
    setEditForm(f => ({ ...f, clubHistory: [...(f.clubHistory ?? []), { ...EMPTY_CLUB_ENTRY }] }));
  };
  const removeClubEntry = (idx: number) => {
    setEditForm(f => ({ ...f, clubHistory: (f.clubHistory ?? []).filter((_, i) => i !== idx) }));
  };
  const updateClubEntry = (idx: number, field: keyof ClubHistoryEntry, val: string | number) => {
    setEditForm(f => {
      const arr = [...(f.clubHistory ?? [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...f, clubHistory: arr };
    });
  };

  // ── Video link helpers ──
  const addVideoLink = () => {
    setEditForm(f => ({ ...f, videoLinks: [...(f.videoLinks ?? []), { ...EMPTY_VIDEO_LINK }] }));
  };
  const removeVideoLink = (idx: number) => {
    setEditForm(f => ({ ...f, videoLinks: (f.videoLinks ?? []).filter((_, i) => i !== idx) }));
  };
  const updateVideoLink = (idx: number, field: keyof VideoLink, val: string) => {
    setEditForm(f => {
      const arr = [...(f.videoLinks ?? [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...f, videoLinks: arr };
    });
  };

  // ── Save ──
  const handleSave = async () => {
    if (!player) return;
    if (isDemo) { router.push(`/app/players/${player.id}`); return; }
    setSaving(true);
    setSaveError('');
    try {
      await updatePlayer(player.id, {
        ...editForm,
        photoBase64,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      });
      router.push(`/app/players/${player.id}`);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!player) return;
    if (isDemo) { setConfirmDelete(false); return; }
    setDeleting(true);
    try {
      await deletePlayer(player.id);
      router.push('/app');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Early returns ────────────────────────────────────────────────────────

  if (loading || loadingPlayer) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#94A3B8', fontFamily: 'var(--font-body)' }}>Cargando…</p>
    </main>
  );

  if (!player) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <p style={{ color: '#94A3B8', fontFamily: 'var(--font-body)' }}>Jugador no encontrado.</p>
      <Link href="/app" style={{ color: '#7C3AED', fontSize: '0.875rem' }}>← Volver a la lista</Link>
    </main>
  );

  const savingLabel = saving ? 'Guardando…' : 'Guardar cambios';
  const isGoalkeeper = (editForm.position ?? player.position) === 'Portero';
  const detailedMetrics = editForm.detailedMetrics ?? INITIAL_DETAILED;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>

      {/* ── Sticky header ── */}
      <header style={{ borderBottom: '1px solid #E5E7EB', padding: '0 2rem', position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 30 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href={`/app/players/${player.id}`} style={{ color: '#64748B', fontSize: '0.82rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              ← {player.name}
            </Link>
            <span style={{ color: '#374151', fontSize: '0.82rem' }}>/</span>
            <span style={{ color: '#111827', fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>Editar</span>
          </div>
          <button onClick={handleSave} disabled={saving} style={{
            background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
            color: 'white', border: 'none', padding: '0.5rem 1.25rem',
            borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
            boxShadow: saving ? 'none' : '0 2px 12px rgba(124,58,237,0.3)',
          }}>
            {savingLabel}
          </button>
        </div>
      </header>

      {/* ── Form content ── */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 2rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Photo + name hero ── */}
        <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                background: photoBase64 ? 'transparent' : 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(109,40,217,0.5))',
                border: '2px dashed rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Cambiar foto"
            >
              {photoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoBase64} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              ) : (
                <span style={{ color: '#A78BFA', fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  {player.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#7C3AED', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11 }}
              title="Cambiar foto"
            >📷</div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoSelect} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ ...labelStyle, marginBottom: '0.375rem' }}>Nombre del jugador</p>
            <input
              style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600 }}
              value={editForm.name ?? ''}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre completo"
            />
            {photoError ? (
              <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.4rem', fontFamily: 'var(--font-body)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '0.35rem 0.6rem' }}>
                {photoError}
              </p>
            ) : (
              <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.4rem', fontFamily: 'var(--font-body)' }}>
                Haz clic en el avatar para cambiar la foto · JPG, PNG o WebP · máx. 500 KB
              </p>
            )}
          </div>
        </div>

        {/* ── Datos personales ── */}
        <div style={sectionStyle}>
          <SectionTitle>Datos personales</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Fecha de nacimiento</label>
              <input type="date" style={inputStyle} value={editForm.birthDate ?? ''} onChange={e => setEditForm(f => ({ ...f, birthDate: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Posición</label>
              <select style={inputStyle} value={editForm.position ?? ''} onChange={e => setEditForm(f => ({ ...f, position: e.target.value as PlayerPosition }))}>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pie dominante</label>
              <select style={inputStyle} value={editForm.foot ?? 'derecho'} onChange={e => setEditForm(f => ({ ...f, foot: e.target.value as PlayerFoot }))}>
                <option value="derecho">Derecho</option>
                <option value="izquierdo">Izquierdo</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input style={inputStyle} value={editForm.city ?? ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="Lorca, Murcia…" />
            </div>
            <div>
              <label style={labelStyle}>Altura (cm)</label>
              <input type="number" style={inputStyle} value={editForm.height ?? ''} onChange={e => setEditForm(f => ({ ...f, height: Number(e.target.value) }))} placeholder="175" />
            </div>
            <div>
              <label style={labelStyle}>Peso (kg)</label>
              <input type="number" style={inputStyle} value={editForm.weight ?? ''} onChange={e => setEditForm(f => ({ ...f, weight: Number(e.target.value) }))} placeholder="70" />
            </div>
          </div>
        </div>

        {/* ── Club y competición ── */}
        <div style={sectionStyle}>
          <SectionTitle>Club y competición</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Club actual</label>
              <input style={inputStyle} value={editForm.club ?? ''} onChange={e => setEditForm(f => ({ ...f, club: e.target.value }))} placeholder="CF Lorca" />
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <input style={inputStyle} value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} placeholder="Cadete A" />
            </div>
            <div>
              <label style={labelStyle}>División / Liga</label>
              <input style={inputStyle} value={editForm.division ?? ''} onChange={e => setEditForm(f => ({ ...f, division: e.target.value }))} placeholder="Liga Autonómica" />
            </div>
            <div>
              <label style={labelStyle}>Estado de seguimiento</label>
              <select style={inputStyle} value={editForm.status ?? 'seguimiento'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as PlayerStatus }))}>
                <option value="activo">Activo</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="espera">En espera</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Estadísticas de temporada ── */}
        <div style={sectionStyle}>
          <SectionTitle>Estadísticas de temporada</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Partidos</label>
              <input type="number" style={inputStyle} min={0} value={editForm.matchesPlayed ?? ''} onChange={e => setEditForm(f => ({ ...f, matchesPlayed: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Minutos</label>
              <input type="number" style={inputStyle} min={0} value={editForm.minutesPlayed ?? ''} onChange={e => setEditForm(f => ({ ...f, minutesPlayed: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Goles</label>
              <input type="number" style={inputStyle} min={0} value={editForm.goals ?? ''} onChange={e => setEditForm(f => ({ ...f, goals: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Asistencias</label>
              <input type="number" style={inputStyle} min={0} value={editForm.assists ?? ''} onChange={e => setEditForm(f => ({ ...f, assists: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Amarillas</label>
              <input type="number" style={inputStyle} min={0} value={editForm.yellowCards ?? ''} onChange={e => setEditForm(f => ({ ...f, yellowCards: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Rojas</label>
              <input type="number" style={inputStyle} min={0} value={editForm.redCards ?? ''} onChange={e => setEditForm(f => ({ ...f, redCards: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
            </div>
            {isGoalkeeper && (
              <>
                <div>
                  <label style={labelStyle}>Paradas</label>
                  <input type="number" style={inputStyle} min={0} value={editForm.saves ?? ''} onChange={e => setEditForm(f => ({ ...f, saves: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Goles encajados</label>
                  <input type="number" style={inputStyle} min={0} value={editForm.goalsConceded ?? ''} onChange={e => setEditForm(f => ({ ...f, goalsConceded: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Métricas principales ── */}
        <div style={sectionStyle}>
          <SectionTitle>Valoración técnica (0–10)</SectionTitle>
          {editForm.detailedMetrics && (
            <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '-0.875rem', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
              Calculadas automáticamente desde métricas detalladas
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {METRIC_LABELS.map(({ key, label, color }) => {
              const val = editForm.metrics?.[key] ?? 5;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
                    <span style={{ color, fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', minWidth: 40, textAlign: 'right' }}>
                      {val}/10
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={10} step={1} value={val}
                    onChange={e => setEditForm(f => ({ ...f, metrics: { ...f.metrics!, [key]: Number(e.target.value) } }))}
                    style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
                    disabled={!!editForm.detailedMetrics}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    {Array.from({ length: 11 }, (_, i) => (
                      <span key={i} style={{ fontSize: '9px', color: i === val ? color : '#334155', fontWeight: i === val ? 700 : 400 }}>{i}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Métricas detalladas (colapsable) ── */}
        <div style={sectionStyle}>
          <button
            onClick={() => setShowDetailedMetrics(s => !s)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', width: '100%',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 0, marginBottom: showDetailedMetrics ? '1.25rem' : 0,
            }}
          >
            <span style={{ color: '#64748B', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-body)' }}>
              Métricas detalladas (subcategorías)
            </span>
            <span style={{ color: '#475569', fontSize: '0.75rem' }}>{showDetailedMetrics ? '▲ Ocultar' : '▼ Expandir'}</span>
          </button>

          {showDetailedMetrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {DETAILED_GROUPS.map(({ dim, label, color, subs }) => (
                <div key={dim}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-body)' }}>{label}</span>
                    <span style={{ color, fontSize: '0.75rem', fontWeight: 800, marginLeft: 'auto', fontFamily: 'var(--font-heading)' }}>
                      Media: {editForm.metrics?.[dim] ?? 5}/10
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {subs.map(({ key, label: subLabel }) => (
                      <SubSlider
                        key={key}
                        label={subLabel}
                        val={(detailedMetrics[dim] as Record<string, number>)[key] ?? 5}
                        color={color}
                        onChange={v => updateDetailedMetric(dim, key, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Notas y etiquetas ── */}
        <div style={sectionStyle}>
          <SectionTitle>Notas y etiquetas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Chips predefinidos */}
            <div>
              <p style={{ ...labelStyle, marginBottom: '0.625rem' }}>Etiquetas rápidas</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {PRESET_TAGS.map(tag => {
                  const active = currentTagSet.has(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => togglePresetTag(tag)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        background: active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#A78BFA' : '#64748B',
                        transition: 'all 0.15s',
                      }}
                    >
                      {active ? '✓ ' : ''}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo de texto */}
            <div>
              <label style={labelStyle}>Etiquetas personalizadas (separadas por coma)</label>
              <input
                style={inputStyle}
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="Rápido, Buen regate, Liderazgo…"
              />
            </div>

            <div>
              <label style={labelStyle}>Notas del scout (privadas)</label>
              <textarea
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                value={editForm.privateNotes ?? ''}
                onChange={e => setEditForm(f => ({ ...f, privateNotes: e.target.value }))}
                placeholder="Observaciones internas, contactos, próximos partidos…"
              />
            </div>
          </div>
        </div>

        {/* ── Contacto y entorno ── */}
        <div style={sectionStyle}>
          <SectionTitle>Contacto y entorno</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nombre del contacto</label>
              <input style={inputStyle} value={editForm.contactName ?? ''} onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Juan García" />
            </div>
            <div>
              <label style={labelStyle}>Relación</label>
              <select style={inputStyle} value={editForm.contactRelation ?? ''} onChange={e => setEditForm(f => ({ ...f, contactRelation: e.target.value }))}>
                <option value="">— Seleccionar —</option>
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Representante">Representante</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Teléfono de contacto</label>
              <input type="tel" style={inputStyle} value={editForm.contactPhone ?? ''} onChange={e => setEditForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+34 600 000 000" />
            </div>
            <div>
              <label style={labelStyle}>Agente / Representante</label>
              <input style={inputStyle} value={editForm.agentName ?? ''} onChange={e => setEditForm(f => ({ ...f, agentName: e.target.value }))} placeholder="Nombre del agente (si tiene)" />
            </div>
          </div>
        </div>

        {/* ── Disponibilidad ── */}
        <div style={sectionStyle}>
          <SectionTitle>Disponibilidad</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Fin de contrato</label>
              <input type="date" style={inputStyle} value={editForm.contractEnd ?? ''} onChange={e => setEditForm(f => ({ ...f, contractEnd: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Interés en cambio de club</label>
              <select style={inputStyle} value={editForm.transferInterest ?? 'desconocido'} onChange={e => setEditForm(f => ({ ...f, transferInterest: e.target.value as Player['transferInterest'] }))}>
                <option value="desconocido">Desconocido</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Cláusula (€)</label>
              <input type="number" style={inputStyle} min={0} value={editForm.clauseAmount ?? ''} onChange={e => setEditForm(f => ({ ...f, clauseAmount: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="Opcional" />
            </div>
          </div>
        </div>

        {/* ── Historial de clubes ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <SectionTitle>Historial de clubes</SectionTitle>
            <button
              type="button"
              onClick={addClubEntry}
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA', padding: '0.35rem 0.875rem', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              + Añadir club
            </button>
          </div>

          {(editForm.clubHistory ?? []).length === 0 ? (
            <p style={{ color: '#334155', fontSize: '0.8rem', fontFamily: 'var(--font-body)', textAlign: 'center', padding: '1rem 0' }}>
              Sin clubes anteriores registrados.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {(editForm.clubHistory ?? []).map((entry, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px 60px 32px', gap: '0.625rem', alignItems: 'flex-end' }}>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Club</label>}
                    <input style={inputStyle} value={entry.club} onChange={e => updateClubEntry(idx, 'club', e.target.value)} placeholder="CF Ejemplo" />
                  </div>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Categoría</label>}
                    <input style={inputStyle} value={entry.category} onChange={e => updateClubEntry(idx, 'category', e.target.value)} placeholder="Cadete A" />
                  </div>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Temporada</label>}
                    <input style={inputStyle} value={entry.season} onChange={e => updateClubEntry(idx, 'season', e.target.value)} placeholder="2023/24" />
                  </div>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Goles</label>}
                    <input type="number" min={0} style={inputStyle} value={entry.goals ?? ''} onChange={e => updateClubEntry(idx, 'goals', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
                  </div>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Asist.</label>}
                    <input type="number" min={0} style={inputStyle} value={entry.assists ?? ''} onChange={e => updateClubEntry(idx, 'assists', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => removeClubEntry(idx)}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.5rem 0.25rem', fontFamily: 'var(--font-body)' }}
                      title="Eliminar"
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Vídeos ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <SectionTitle>Vídeos</SectionTitle>
            <button
              type="button"
              onClick={addVideoLink}
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA', padding: '0.35rem 0.875rem', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              + Añadir vídeo
            </button>
          </div>

          {(editForm.videoLinks ?? []).length === 0 ? (
            <p style={{ color: '#334155', fontSize: '0.8rem', fontFamily: 'var(--font-body)', textAlign: 'center', padding: '1rem 0' }}>
              Sin enlaces de vídeo registrados.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(editForm.videoLinks ?? []).map((link, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 32px', gap: '0.625rem', alignItems: 'flex-end' }}>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Etiqueta</label>}
                    <input style={inputStyle} value={link.label} onChange={e => updateVideoLink(idx, 'label', e.target.value)} placeholder="Highlights 2024" />
                  </div>
                  <div>
                    {idx === 0 && <label style={labelStyle}>URL del vídeo</label>}
                    <input type="url" style={inputStyle} value={link.url} onChange={e => updateVideoLink(idx, 'url', e.target.value)} placeholder="https://youtube.com/..." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => removeVideoLink(idx)}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.5rem 0.25rem' }}
                      title="Eliminar"
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {saveError && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <p style={{ color: '#FCA5A5', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)' }}>{saveError}</p>
          </div>
        )}

        {/* ── Save button ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
            color: 'white', border: 'none', padding: '0.875rem',
            borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
            letterSpacing: '0.02em', boxShadow: saving ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
          }}
        >
          {savingLabel}
        </button>

        {/* ── Danger zone ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            Eliminar jugador
          </button>
        </div>

      </div>

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#141928', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>¿Eliminar jugador?</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
              Se eliminará permanentemente a <strong style={{ color: 'white' }}>{player.name}</strong> y todas sus visitas. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
