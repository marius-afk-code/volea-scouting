'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayer, updatePlayer, deletePlayer } from '@/lib/players';
import { DEMO_PLAYERS } from '@/lib/demo-data';
import { Player, PlayerPosition, PlayerFoot, PlayerStatus } from '@/types/player';

const POSITIONS: PlayerPosition[] = [
  'Portero', 'Lateral Derecho', 'Lateral Izquierdo', 'Central',
  'Mediocentro Defensivo', 'Mediocentro', 'Mediocentro Ofensivo',
  'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro', 'Segunda Punta',
];

const STATUS_CONFIG: Record<PlayerStatus, { color: string; bg: string; label: string }> = {
  activo:      { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: 'Activo' },
  seguimiento: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: 'Seguimiento' },
  espera:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: 'En espera' },
  descartado:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Descartado' },
};

const METRIC_LABELS: { key: keyof Player['metrics']; label: string }[] = [
  { key: 'technical', label: 'Técnica' },
  { key: 'tactical',  label: 'Táctica' },
  { key: 'physical',  label: 'Físico' },
  { key: 'attitude',  label: 'Actitud' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0B0F1A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '0.625rem 0.875rem',
  color: 'white',
  fontSize: '0.875rem',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: '#94A3B8',
  fontSize: '0.72rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: '0.375rem',
};

export default function PlayerDetailPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [tagsInput, setTagsInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (!playerId) return;
    if (isDemo) {
      const p = DEMO_PLAYERS.find(pl => pl.id === playerId) ?? null;
      setPlayer(p);
      if (p) { setEditForm(p); setTagsInput(p.tags.join(', ')); }
      setLoadingPlayer(false);
      return;
    }
    getPlayer(playerId)
      .then(p => {
        setPlayer(p);
        if (p) {
          setEditForm(p);
          setTagsInput(p.tags.join(', '));
        }
      })
      .finally(() => setLoadingPlayer(false));
  }, [playerId, isDemo]);

  const handleSave = async () => {
    if (!player) return;
    if (isDemo) { setEditing(false); return; }
    setSaving(true);
    try {
      const updatedData = {
        ...editForm,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      };
      await updatePlayer(player.id, updatedData);
      setPlayer(prev => prev ? { ...prev, ...updatedData } as Player : prev);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading || loadingPlayer) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#94A3B8' }}>Cargando...</p>
    </main>
  );

  if (!player) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <p style={{ color: '#94A3B8' }}>Jugador no encontrado.</p>
      <Link href="/app" style={{ color: '#7C3AED', fontSize: '0.875rem' }}>← Volver a la lista</Link>
    </main>
  );

  const sc = STATUS_CONFIG[player.status];

  if (editing) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A' }}>
        {/* Edit header */}
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 2rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/app" style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}>← Lista</Link>
              <span style={{ color: '#64748B' }}>/</span>
              <span style={{ color: 'white', fontWeight: '500' }}>Editar: {player.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setEditing(false)} style={{ backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{ backgroundColor: saving ? '#5B21B6' : '#7C3AED', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Edit form */}
          <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '0.95rem' }}>Datos personales</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input style={inputStyle} value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
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
                <label style={labelStyle}>Pie</label>
                <select style={inputStyle} value={editForm.foot ?? 'derecho'} onChange={e => setEditForm(f => ({ ...f, foot: e.target.value as PlayerFoot }))}>
                  <option value="derecho">Derecho</option>
                  <option value="izquierdo">Izquierdo</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Altura (cm)</label>
                <input type="number" style={inputStyle} value={editForm.height ?? ''} onChange={e => setEditForm(f => ({ ...f, height: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Peso (kg)</label>
                <input type="number" style={inputStyle} value={editForm.weight ?? ''} onChange={e => setEditForm(f => ({ ...f, weight: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Club</label>
                <input style={inputStyle} value={editForm.club ?? ''} onChange={e => setEditForm(f => ({ ...f, club: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input style={inputStyle} value={editForm.city ?? ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Categoría</label>
                <input style={inputStyle} value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>División</label>
                <input style={inputStyle} value={editForm.division ?? ''} onChange={e => setEditForm(f => ({ ...f, division: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Estado</label>
              <select style={{ ...inputStyle, maxWidth: '240px' }} value={editForm.status ?? 'seguimiento'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as PlayerStatus }))}>
                <option value="activo">Activo</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="espera">En espera</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
          </div>

          {/* Metrics edit */}
          <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
            <h3 style={{ color: 'white', margin: '0 0 1rem', fontSize: '0.95rem' }}>Métricas (0–10)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {METRIC_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={editForm.metrics?.[key] ?? 5}
                    onChange={e => setEditForm(f => ({ ...f, metrics: { ...f.metrics!, [key]: Number(e.target.value) } }))}
                    style={{ width: '100%', accentColor: '#7C3AED' }}
                  />
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{editForm.metrics?.[key] ?? 5}/10</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags + Notes edit */}
          <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Etiquetas (separadas por coma)</label>
              <input style={inputStyle} value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Notas privadas</label>
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                value={editForm.privateNotes ?? ''}
                onChange={e => setEditForm(f => ({ ...f, privateNotes: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/app" style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}>← Lista de jugadores</Link>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setEditing(true)} style={{ backgroundColor: '#7C3AED', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
              Editar
            </button>
            <button onClick={() => setConfirmDelete(true)} style={{ backgroundColor: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
              Eliminar
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Player card */}
        <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{player.name.charAt(0).toUpperCase()}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
              <h1 style={{ color: 'white', fontSize: '1.5rem', margin: 0 }}>{player.name}</h1>
              <span style={{ backgroundColor: sc.bg, color: sc.color, padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                {sc.label}
              </span>
            </div>
            <p style={{ color: '#94A3B8', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{player.position}</p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {player.club && <span style={{ color: '#64748B', fontSize: '0.8rem' }}>🏟 {player.club}</span>}
              {player.city && <span style={{ color: '#64748B', fontSize: '0.8rem' }}>📍 {player.city}</span>}
              {player.category && <span style={{ color: '#64748B', fontSize: '0.8rem' }}>🏅 {player.category}</span>}
              {player.division && <span style={{ color: '#64748B', fontSize: '0.8rem' }}>⚽ {player.division}</span>}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Personal data */}
          <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
            <h3 style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>Datos personales</h3>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Fecha nacimiento', value: player.birthDate || '—' },
                { label: 'Pie dominante', value: player.foot.charAt(0).toUpperCase() + player.foot.slice(1) },
                { label: 'Altura', value: player.height ? `${player.height} cm` : '—' },
                { label: 'Peso', value: player.weight ? `${player.weight} kg` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <dt style={{ color: '#64748B', fontSize: '0.8rem' }}>{label}</dt>
                  <dd style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Club data */}
          <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
            <h3 style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>Club</h3>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Club', value: player.club || '—' },
                { label: 'Ciudad', value: player.city || '—' },
                { label: 'Categoría', value: player.category || '—' },
                { label: 'División', value: player.division || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <dt style={{ color: '#64748B', fontSize: '0.8rem' }}>{label}</dt>
                  <dd style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
          <h3 style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1.25rem' }}>Métricas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {METRIC_LABELS.map(({ key, label }) => {
              const val = player.metrics?.[key] ?? 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{label}</span>
                    <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: '700' }}>{val}/10</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${val * 10}%`, height: '100%', backgroundColor: '#7C3AED', borderRadius: '999px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        {player.tags.length > 0 && (
          <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
            <h3 style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>Etiquetas</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {player.tags.map(tag => (
                <span key={tag} style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '500' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {player.privateNotes && (
          <div style={{ backgroundColor: '#141928', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
            <h3 style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>Notas privadas</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{player.privateNotes}</p>
          </div>
        )}

        {/* Metadata */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Creado: {new Date(player.createdAt).toLocaleDateString('es-ES')}</span>
          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Actualizado: {new Date(player.updatedAt).toLocaleDateString('es-ES')}</span>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#141928', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.75rem' }}>¿Eliminar jugador?</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Se eliminará permanentemente a <strong style={{ color: 'white' }}>{player.name}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
