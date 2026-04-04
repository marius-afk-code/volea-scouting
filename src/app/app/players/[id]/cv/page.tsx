'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayer, updatePlayer } from '@/lib/players';
import { getVisits } from '@/lib/visits';
import { Player } from '@/types/player';
import { Visit } from '@/types/visit';

// ─── Types ─────────────────────────────────────────────────────────────────

interface CvClub { club: string; etapa: string; categoria: string; }

// ─── Helpers ───────────────────────────────────────────────────────────────

function avgMetrics(p: Player) {
  const { technical, tactical, physical, attitude } = p.metrics;
  return Math.round(((technical + tactical + physical + attitude) / 4) * 10) / 10;
}

function ratingColor(v: number) {
  return v >= 8 ? '#059669' : v >= 6 ? '#D97706' : '#DC2626';
}

function formatDate(iso: string) {
  if (!iso) return '—';
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return iso; }
}

function esc(s: string | number) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  return Math.floor((Date.now() - new Date(birthDate + 'T12:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// ─── Radar SVG for CV (light background) ───────────────────────────────────

function buildCvRadarSvg(metrics: Player['metrics']): string {
  const dims = ['Técnica','Táctica','Físico','Actitud'];
  const vals = [metrics.technical, metrics.tactical, metrics.physical, metrics.attitude];
  const size = 200, cx = size / 2, cy = size / 2, R = size * 0.32;
  const n = 4, sa = -Math.PI / 2, step = (2 * Math.PI) / n;
  const po = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];

  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
  for (let l = 1; l <= 5; l++) {
    const r = R * l / 5;
    const pts = Array.from({length:n}, (_,i) => po(sa+i*step,r).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="${l===5?'#D1D5DB':'#E5E7EB'}" stroke-width="${l===5?1.5:0.8}"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x,y] = po(sa+i*step, R);
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E5E7EB" stroke-width="0.8"/>`;
    const [lx,ly] = po(sa+i*step, R+22);
    const anc = Math.abs(lx-cx)<5?'middle':lx>cx?'start':'end';
    s += `<text x="${lx}" y="${ly+4}" text-anchor="${anc}" font-size="11" font-weight="600" fill="#64748B" font-family="system-ui">${dims[i]}</text>`;
  }
  const dp = vals.map((v,i) => po(sa+i*step, R*Math.max(0.5,v)/10).join(',')).join(' ');
  s += `<polygon points="${dp}" fill="rgba(124,58,237,0.2)" stroke="#7C3AED" stroke-width="2.5" stroke-linejoin="round"/>`;
  vals.forEach((v,i) => {
    const [x,y] = po(sa+i*step, R*Math.max(0.5,v)/10);
    s += `<circle cx="${x}" cy="${y}" r="5" fill="#7C3AED" stroke="#fff" stroke-width="2"/>`;
    s += `<text x="${x}" y="${y-9}" text-anchor="middle" font-size="10" font-weight="800" fill="#7C3AED" font-family="system-ui">${v}</text>`;
  });
  return s + '</svg>';
}

// ─── CV HTML builder ────────────────────────────────────────────────────────

function buildCvHtml(player: Player, clubs: CvClub[], description: string, visits: Visit[]): string {
  const avg = avgMetrics(player);
  const rc  = ratingColor;
  const age = calcAge(player.birthDate);
  const metricDefs = [
    { key: 'technical' as const, label: 'Técnica',  color: '#7C3AED' },
    { key: 'tactical'  as const, label: 'Táctica',  color: '#3B82F6' },
    { key: 'physical'  as const, label: 'Físico',   color: '#10B981' },
    { key: 'attitude'  as const, label: 'Actitud',  color: '#F59E0B' },
  ];

  const tagsHtml = player.tags.map(t =>
    `<span style="font-size:10px;padding:3px 10px;border-radius:99px;background:#EDE9FE;color:#5B21B6;font-weight:600">${esc(t)}</span>`
  ).join(' ');

  const scoreBar = (label: string, v: number, color: string) =>
    `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <span style="font-size:11px;color:#64748B;font-weight:500">${label}</span>
        <span style="font-size:12px;font-weight:800;color:${rc(v)}">${v}/10</span>
      </div>
      <div style="height:6px;border-radius:3px;background:#F1F5F9">
        <div style="height:6px;border-radius:3px;background:${color};width:${v*10}%"></div>
      </div>
    </div>`;

  const ir = (label: string, value: string) =>
    `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #F8FAFC">
      <span style="font-size:12px;color:#64748B;min-width:90px">${label}</span>
      <span style="font-size:13px;font-weight:600;color:#1e293b">${value}</span>
    </div>`;

  const clubsHtml = clubs.length ? `
    <div style="margin-bottom:20px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7C3AED;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #F5F3FF">Trayectoria deportiva</div>
      <div style="position:relative;padding-left:22px">
        ${clubs.map((c,i) => `
          <div style="position:relative;padding-bottom:${i<clubs.length-1?'14':'0'}px">
            <div style="position:absolute;left:-22px;top:3px;width:12px;height:12px;border-radius:50%;background:#7C3AED;border:2px solid #fff;z-index:1"></div>
            ${i<clubs.length-1?'<div style="position:absolute;left:-17px;top:14px;bottom:0;width:2px;background:#E2E8F0"></div>':''}
            <div style="font-size:13px;font-weight:700;color:#1e293b">${esc(c.club)}</div>
            <div style="font-size:11px;color:#64748B">${esc(c.etapa)}${c.categoria?' · '+esc(c.categoria):''}</div>
          </div>`).join('')}
      </div>
    </div>` : '';

  const descHtml = description ? `
    <div style="margin-bottom:20px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7C3AED;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #F5F3FF">Perfil del jugador</div>
      <div style="font-size:13.5px;line-height:1.8;color:#1e293b;background:#F5F3FF;border-left:4px solid #7C3AED;padding:16px 20px;border-radius:0 10px 10px 0">${esc(description)}</div>
    </div>` : '';

  const recentVisits = visits.filter(v => v.valoracion > 0).slice(0, 5);
  const visitsHtml = recentVisits.length ? `
    <div style="margin-bottom:20px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7C3AED;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #F5F3FF">Últimas observaciones</div>
      ${recentVisits.map(v => `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:800;color:${rc(v.valoracion)};background:${v.valoracion>=8?'#D1FAE5':v.valoracion>=6?'#FEF3C7':'#FEE2E2'};padding:2px 8px;border-radius:6px;white-space:nowrap;flex-shrink:0">${v.valoracion}/10</div>
          <div>
            <div style="font-size:12px;font-weight:700;color:#1e293b">${esc(v.partido)}</div>
            <div style="font-size:11px;color:#64748B">${formatDate(v.fecha)}</div>
            ${v.nota?`<div style="font-size:11px;color:#374151;margin-top:2px">${esc(v.nota)}</div>`:''}
          </div>
        </div>`).join('')}
    </div>` : '';

  const today = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Sports CV — ${esc(player.name)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:10mm;size:A4}
  .pbtns{position:fixed;top:16px;right:16px;z-index:100;display:flex;gap:8px}
  .pbtns button{font-family:system-ui;font-size:13px;padding:10px 20px;border-radius:8px;cursor:pointer;border:none;font-weight:700}
  @media print{.pbtns{display:none!important}body{background:#fff}}
</style>
</head>
<body>
<div class="pbtns">
  <button onclick="window.print()" style="background:#7C3AED;color:#fff">🖨️ Guardar como PDF</button>
  <button onclick="window.close()" style="background:#fff;color:#374151;border:1px solid #d1d5db">✕ Cerrar</button>
</div>
<div style="max-width:720px;margin:0 auto;padding:20px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0B0F1A 0%,#1a103a 100%);border-radius:20px;padding:28px 32px;margin-bottom:20px;position:relative;overflow:hidden">
    <div style="position:absolute;right:-40px;top:-40px;width:180px;height:180px;border-radius:50%;background:rgba(124,58,237,.1)"></div>
    <div style="display:flex;align-items:center;gap:20px;position:relative;z-index:1;flex-wrap:wrap">
      <div style="width:82px;height:82px;border-radius:18px;background:rgba(124,58,237,.2);border:3px solid rgba(124,58,237,.4);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#c4b5fd;flex-shrink:0">
        ${esc(player.name.charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;min-width:180px">
        <div style="font-size:9px;letter-spacing:.14em;color:#94a3b8;text-transform:uppercase;margin-bottom:5px;font-weight:600">Sports CV · Fútbol Base · Volea Scouting</div>
        <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;margin-bottom:4px">${esc(player.name)}</div>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:8px">${esc(player.position)} · ${esc(player.club||'—')}</div>
        ${player.tags.length?`<div style="display:flex;gap:5px;flex-wrap:wrap">${tagsHtml}</div>`:''}
      </div>
      <div style="text-align:center;background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.35);border-radius:14px;padding:12px 16px;flex-shrink:0">
        <div style="font-size:9px;letter-spacing:.1em;color:#c4b5fd;text-transform:uppercase;font-weight:700;margin-bottom:2px">Nota</div>
        <div style="font-size:40px;font-weight:800;color:${rc(avg)};line-height:1">${avg}</div>
        <div style="font-size:9px;color:#94a3b8;margin-top:2px">/10</div>
      </div>
    </div>
  </div>

  <!-- 2-col grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <!-- Personal data -->
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7C3AED;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #F5F3FF">Datos personales</div>
      ${ir('Nacimiento', `${formatDate(player.birthDate)}${age?` (${age} años)`:''}`)}
      ${ir('Localidad', esc(player.city||'—'))}
      ${ir('Club actual', esc(player.club||'—'))}
      ${ir('Categoría', esc(player.category||'—'))}
      ${ir('División', esc(player.division||'—'))}
      ${ir('Pie dominante', esc(player.foot||'—'))}
      ${ir('Altura', player.height?`${player.height} cm`:'—')}
      ${ir('Peso', player.weight?`${player.weight} kg`:'—')}
    </div>
    <!-- Valoración técnica -->
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7C3AED;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #F5F3FF">Valoración técnica</div>
      <div style="text-align:center;margin-bottom:12px">${buildCvRadarSvg(player.metrics)}</div>
      ${metricDefs.map(m => scoreBar(m.label, player.metrics[m.key], m.color)).join('')}
    </div>
  </div>

  ${clubsHtml}
  ${descHtml}
  ${visitsHtml}

  <!-- Footer -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:1px solid #f1f5f9">
    <div style="display:flex;align-items:center;gap:6px">
      <div style="width:6px;height:6px;border-radius:50%;background:#7C3AED"></div>
      <span style="font-size:11px;color:#64748B;font-weight:600">Volea Scouting · Sports CV</span>
    </div>
    <span style="font-size:10px;color:#94a3b8">Generado el ${today}</span>
  </div>

</div>
</body>
</html>`;
}

// ─── Shared input styles ─────────────────────────────────────────────────────

const inputS: React.CSSProperties = {
  width: '100%', backgroundColor: '#0B0F1A',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  padding: '0.6rem 0.875rem', color: 'white', fontSize: '0.875rem',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};
const labelS: React.CSSProperties = {
  color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: '0.375rem',
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CvPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer]   = useState<Player | null>(null);
  const [visits, setVisits]   = useState<Visit[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Club history
  const [clubs, setClubs]     = useState<CvClub[]>([]);
  const [newClub, setNewClub] = useState({ club: '', etapa: '', categoria: '' });

  // Description
  const [description, setDescription] = useState('');
  const [polishing, setPolishing]      = useState(false);
  const [generating, setGenerating]    = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!playerId) return;
    Promise.all([getPlayer(playerId), getVisits(playerId)])
      .then(([p, v]) => {
        if (p) {
          setPlayer(p);
          setClubs(p.cvClubs ?? []);
        }
        setVisits(v);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingData(false));
  }, [playerId]);

  function addClub() {
    if (!newClub.club.trim()) return;
    setClubs(prev => [...prev, { ...newClub }]);
    setNewClub({ club: '', etapa: '', categoria: '' });
  }

  function removeClub(i: number) {
    setClubs(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    if (!player) return;
    setGenerating(true);

    let polishedDesc = description;

    // Polish description with Claude if one was provided
    if (description.trim()) {
      setPolishing(true);
      try {
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Eres un redactor de informes de fútbol base profesional. Reescribe esta descripción de un jugador de forma profesional, en tercera persona, fluida y concisa (máximo 80 palabras). No inventes datos, solo mejora la redacción y el estilo:\n\n"${description}"\n\nJugador: ${player.name}, ${player.position}, ${player.category}. Nota global: ${avgMetrics(player)}/10.`,
            maxTokens: 300,
          }),
        });
        const data = await res.json() as { text?: string };
        if (data.text) polishedDesc = data.text.trim();
      } catch { /* keep original */ }
      finally { setPolishing(false); }
    }

    // Persist club history to Firestore
    try {
      await updatePlayer(player.id, { cvClubs: clubs });
    } catch { /* non-critical */ }

    // Open CV in new window
    const html = buildCvHtml(player, clubs, polishedDesc, visits);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);

    setGenerating(false);
  }

  if (loading || loadingData) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94A3B8' }}>Cargando…</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#94A3B8' }}>Jugador no encontrado.</p>
        <Link href="/app" style={{ color: '#7C3AED' }}>← Volver</Link>
      </main>
    );
  }

  const avg = avgMetrics(player);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A' }}>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/app" style={{ textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#7C3AED', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12, fontWeight: 'bold' }}>V</div>
            </Link>
            <span style={{ color: '#64748B' }}>/</span>
            <Link href="/app" style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}>Jugadores</Link>
            <span style={{ color: '#64748B' }}>/</span>
            <Link href={`/app/players/${player.id}`} style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}>
              {player.name}
            </Link>
            <span style={{ color: '#64748B' }}>/</span>
            <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>Sports CV</span>
          </div>
          <Link href={`/app/players/${player.id}`} style={{
            color: '#94A3B8', fontSize: '0.8rem', textDecoration: 'none',
            padding: '0.4rem 0.875rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          }}>← Volver al jugador</Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

        {/* Player hero (mini) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'linear-gradient(135deg,#0B0F1A,#160b2e)',
          border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14,
          padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12,
            background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#C4B5FD' }}>
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{player.name}</p>
            <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
              {player.position} · {player.club || '—'} · {player.category || '—'}
            </p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10,
            padding: '0.625rem 1rem' }}>
            <p style={{ color: '#C4B5FD', fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Nota</p>
            <p style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{avg}</p>
          </div>
        </div>

        {/* Club history */}
        <div style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.875rem' }}>
            Trayectoria en clubes
          </p>

          {/* Existing clubs */}
          {clubs.length === 0 && (
            <p style={{ color: '#64748B', fontSize: '0.825rem', marginBottom: '0.75rem' }}>
              Aún no has añadido clubes
            </p>
          )}
          {clubs.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.03)',
              borderRadius: 8, marginBottom: '0.375rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', flex: 1 }}>{c.club}</span>
              <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{c.etapa}</span>
              {c.categoria && <span style={{ color: '#A78BFA', fontSize: '0.8rem', fontWeight: 600 }}>{c.categoria}</span>}
              <button onClick={() => removeClub(i)} style={{
                background: 'none', border: 'none', color: '#64748B', cursor: 'pointer',
                fontSize: 14, lineHeight: 1, padding: '2px 4px', borderRadius: 4,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
              >✕</button>
            </div>
          ))}

          {/* Add club form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px auto',
            gap: '0.625rem', marginTop: '0.75rem', alignItems: 'flex-end' }}>
            <div>
              <label style={labelS}>Club</label>
              <input style={inputS} value={newClub.club} placeholder="CF Lorca"
                onChange={e => setNewClub(n => ({ ...n, club: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addClub()} />
            </div>
            <div>
              <label style={labelS}>Etapa</label>
              <input style={inputS} value={newClub.etapa} placeholder="Alevín"
                onChange={e => setNewClub(n => ({ ...n, etapa: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addClub()} />
            </div>
            <div>
              <label style={labelS}>Categoría</label>
              <input style={inputS} value={newClub.categoria} placeholder="Superliga"
                onChange={e => setNewClub(n => ({ ...n, categoria: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addClub()} />
            </div>
            <button onClick={addClub} style={{
              background: '#7C3AED', border: 'none', borderRadius: 8, color: 'white',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              padding: '0.6rem 0.875rem', height: 40,
            }}>+</button>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.875rem' }}>
            Descripción del jugador
          </p>
          <textarea
            rows={4}
            style={{ ...inputS, resize: 'vertical', marginBottom: '0.5rem' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Jugador con buen manejo de balón, destaca en la conducción y el regate. Líder en el vestuario..."
          />
          <p style={{ color: '#64748B', fontSize: '0.75rem', margin: 0 }}>
            {polishing ? '🤖 La IA está puliendo la descripción…' : 'La IA mejorará el texto al generar el CV (si hay una clave configurada).'}
          </p>
        </div>

        {/* Generate button */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={handleGenerate} disabled={generating} style={{
            background: generating ? '#5B21B6' : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
            color: 'white', border: 'none', padding: '0.875rem 2.5rem', borderRadius: 10,
            fontWeight: 700, fontSize: '1rem', cursor: generating ? 'not-allowed' : 'pointer',
            boxShadow: generating ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
          }}>
            {generating ? '⏳ Generando…' : '📋 Generar Sports CV'}
          </button>
          <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '0.75rem' }}>
            Se abrirá en una nueva ventana. Usa el botón 🖨️ para guardar como PDF.
          </p>
        </div>

      </div>
    </main>
  );
}
