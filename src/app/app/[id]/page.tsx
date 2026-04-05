'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getPlayer, updatePlayer, deletePlayer } from '@/lib/players';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DEMO_PLAYERS } from '@/lib/demo-data';
import { Player, PlayerPosition, PlayerFoot, PlayerStatus } from '@/types/player';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0B0F1A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '0.625rem 0.875rem',
  color: 'white',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  color: '#94A3B8',
  fontSize: '0.7rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: '0.375rem',
  fontFamily: 'var(--font-body)',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#141928',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '1.5rem',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: '#64748B',
      fontSize: '0.68rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      margin: '0 0 1.25rem',
      fontFamily: 'var(--font-body)',
    }}>
      {children}
    </p>
  );
}

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

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (!playerId) return;
    if (isDemo) {
      const p = DEMO_PLAYERS.find(pl => pl.id === playerId) ?? null;
      setPlayer(p);
      if (p) {
        setEditForm(p);
        setTagsInput(p.tags.join(', '));
        setPhotoPreview(p.photo || '');
      }
      setLoadingPlayer(false);
      return;
    }
    getPlayer(playerId)
      .then(p => {
        setPlayer(p);
        if (p) {
          setEditForm(p);
          setTagsInput(p.tags.join(', '));
          setPhotoPreview(p.photo || '');
        }
      })
      .finally(() => setLoadingPlayer(false));
  }, [playerId, isDemo]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleSave = async () => {
    if (!player) return;
    if (isDemo) {
      router.push(`/app/players/${player.id}`);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      let photoUrl = editForm.photo ?? '';

      // Upload new photo to Firebase Storage if one was selected
      if (photoFile && user) {
        setUploadingPhoto(true);
        const storageRef = ref(storage, `players/${user.uid}/${player.id}`);
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef);
        setUploadingPhoto(false);
      }

      const updatedData = {
        ...editForm,
        photo: photoUrl,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      };
      await updatePlayer(player.id, updatedData);
      router.push(`/app/players/${player.id}`);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
      setSaving(false);
      setUploadingPhoto(false);
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
      <p style={{ color: '#94A3B8', fontFamily: 'var(--font-body)' }}>Cargando...</p>
    </main>
  );

  if (!player) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <p style={{ color: '#94A3B8', fontFamily: 'var(--font-body)' }}>Jugador no encontrado.</p>
      <Link href="/app" style={{ color: '#7C3AED', fontSize: '0.875rem' }}>← Volver a la lista</Link>
    </main>
  );

  const savingLabel = uploadingPhoto ? 'Subiendo foto…' : saving ? 'Guardando…' : 'Guardar cambios';

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 2rem', position: 'sticky', top: 0, backgroundColor: '#0B0F1A', zIndex: 30 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href={`/app/players/${player.id}`} style={{ color: '#64748B', fontSize: '0.82rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              ← {player.name}
            </Link>
            <span style={{ color: '#374151', fontSize: '0.82rem' }}>/</span>
            <span style={{ color: 'white', fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>Editar</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
              color: 'white', border: 'none', padding: '0.5rem 1.25rem',
              borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: saving ? 'none' : '0 2px 12px rgba(124,58,237,0.3)',
            }}
          >
            {savingLabel}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 2rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Photo + name hero ── */}
        <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar / photo */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: 16,
                overflow: 'hidden', cursor: 'pointer',
                background: photoPreview ? 'transparent' : 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(109,40,217,0.5))',
                border: '2px dashed rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 0.15s',
              }}
              title="Cambiar foto"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                />
              ) : (
                <span style={{ color: '#A78BFA', fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  {player.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Camera overlay */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: '#7C3AED', border: '2px solid #0B0F1A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 11,
              }}
              title="Cambiar foto"
            >
              📷
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ ...labelStyle, marginBottom: '0.375rem' }}>Nombre del jugador</p>
            <input
              style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600 }}
              value={editForm.name ?? ''}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre completo"
            />
            <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.4rem', fontFamily: 'var(--font-body)' }}>
              Haz clic en el avatar para cambiar la foto · JPG, PNG o WebP
            </p>
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

        {/* ── Métricas ── */}
        <div style={sectionStyle}>
          <SectionTitle>Valoración técnica (0–10)</SectionTitle>
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
                    type="range" min={0} max={10} step={1}
                    value={val}
                    onChange={e => setEditForm(f => ({ ...f, metrics: { ...f.metrics!, [key]: Number(e.target.value) } }))}
                    style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
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

        {/* ── Nota global y etiquetas ── */}
        <div style={sectionStyle}>
          <SectionTitle>Notas y etiquetas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Etiquetas (separadas por coma)</label>
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
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.02em',
            boxShadow: saving ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
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

      {/* Delete confirmation modal */}
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
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
