'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayer, updatePlayer } from '@/lib/players';
import { DEMO_PLAYERS } from '@/lib/demo-data';
import { Player } from '@/types/player';

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
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function esc(s: string | number) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  return Math.floor((Date.now() - new Date(birthDate + 'T12:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// ─── Compact Radar SVG ──────────────────────────────────────────────────────

function buildRadar(metrics: Player['metrics']): string {
  const dims = ['Técnica', 'Táctica', 'Físico', 'Actitud'];
  const vals = [metrics.technical, metrics.tactical, metrics.physical, metrics.attitude];
  const size = 120, cx = size / 2, cy = size / 2, R = size * 0.31;
  const n = 4, sa = -Math.PI / 2, step = (2 * Math.PI) / n;
  const po = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];

  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0">`;
  for (let l = 1; l <= 5; l++) {
    const r = R * l / 5;
    const pts = Array.from({ length: n }, (_, i) => po(sa + i * step, r).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="${l === 5 ? '#CBD5E1' : '#E2E8F0'}" stroke-width="${l === 5 ? 1 : 0.5}"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = po(sa + i * step, R);
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E2E8F0" stroke-width="0.5"/>`;
    const [lx, ly] = po(sa + i * step, R + 15);
    const anc = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end';
    s += `<text x="${lx}" y="${ly + 3}" text-anchor="${anc}" font-size="7" font-weight="600" fill="#94A3B8" font-family="system-ui">${dims[i]}</text>`;
  }
  const dp = vals.map((v, i) => po(sa + i * step, R * Math.max(0.5, v) / 10).join(',')).join(' ');
  s += `<polygon points="${dp}" fill="rgba(124,58,237,0.18)" stroke="#7C3AED" stroke-width="1.8" stroke-linejoin="round"/>`;
  vals.forEach((v, i) => {
    const [x, y] = po(sa + i * step, R * Math.max(0.5, v) / 10);
    s += `<circle cx="${x}" cy="${y}" r="3" fill="#7C3AED" stroke="#fff" stroke-width="1.5"/>`;
    s += `<text x="${x}" y="${y - 5}" text-anchor="middle" font-size="7.5" font-weight="800" fill="#7C3AED" font-family="system-ui">${v}</text>`;
  });
  return s + '</svg>';
}

// ─── CV HTML builder ────────────────────────────────────────────────────────

function buildCvHtml(player: Player, clubs: CvClub[], description: string, logoUrl: string): string {
  const avg = avgMetrics(player);
  const rc = ratingColor;
  const age = calcAge(player.birthDate);
  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  const metricDefs = [
    { key: 'technical' as const, label: 'Técnica', color: '#7C3AED', title: 'Dominio técnico',      desc: 'Control del balón, conducción y precisión de pase destacados.' },
    { key: 'tactical'  as const, label: 'Táctica', color: '#3B82F6', title: 'Inteligencia táctica', desc: 'Lectura del juego avanzada y excelente posicionamiento.' },
    { key: 'physical'  as const, label: 'Físico',  color: '#10B981', title: 'Capacidad física',     desc: 'Velocidad, resistencia y potencia por encima de la media.' },
    { key: 'attitude'  as const, label: 'Actitud', color: '#F59E0B', title: 'Actitud y liderazgo',  desc: 'Mentalidad competitiva y referente dentro del grupo.' },
  ];

  const hasStats   = player.goals != null || player.assists != null || player.matchesPlayed != null || player.minutesPlayed != null;
  const hasContact = !!(player.contactName || player.agentName);
  const hasTags    = player.tags.length > 0;
  const hasClubs   = clubs.length > 0;
  const hasProfile = !!description;

  // Auto-generate top-3 highlights from metrics
  const topHighlights = [...metricDefs]
    .map(m => ({ ...m, val: player.metrics[m.key] }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  // ── Data strip ──
  const dataPills = [
    player.birthDate ? `<div class="dp"><span class="dp-l">Nacimiento</span><span class="dp-v">${formatDate(player.birthDate)}</span></div>` : '',
    age              ? `<div class="dp"><span class="dp-l">Edad</span><span class="dp-v">${age} años</span></div>` : '',
    player.city      ? `<div class="dp"><span class="dp-l">Localidad</span><span class="dp-v">${esc(player.city)}</span></div>` : '',
    player.foot      ? `<div class="dp"><span class="dp-l">Pie</span><span class="dp-v">${esc(player.foot)}</span></div>` : '',
    player.height    ? `<div class="dp"><span class="dp-l">Altura</span><span class="dp-v">${player.height} cm</span></div>` : '',
    player.weight    ? `<div class="dp"><span class="dp-l">Peso</span><span class="dp-v">${player.weight} kg</span></div>` : '',
    player.category  ? `<div class="dp"><span class="dp-l">Categoría</span><span class="dp-v">${esc(player.category)}</span></div>` : '',
  ].filter(Boolean).join('');

  // ── Radar + bars ──
  const radarSvg = buildRadar(player.metrics);
  const barsHtml = metricDefs.map(m => `
    <div class="bar">
      <div class="bar-row">
        <span class="bar-lbl">${m.label}</span>
        <span class="bar-val" style="color:${rc(player.metrics[m.key])}">${player.metrics[m.key]}<span style="font-size:7px;opacity:.6">/10</span></span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${player.metrics[m.key] * 10}%;background:${m.color}"></div></div>
    </div>`).join('');

  // ── LEFT COLUMN sections ──
  // The first present section grows (flex:1) to fill the column
  const leftOrder = [
    hasProfile ? 'profile' : null,
    hasClubs   ? 'clubs'   : null,
    hasStats   ? 'stats'   : null,
  ].filter(Boolean) as string[];
  const leftGrow = leftOrder[0] ?? '';

  const profileSection = hasProfile ? `
    <div class="sec${leftGrow === 'profile' ? ' sec-grow' : ''}">
      <div class="sec-title">Perfil del jugador</div>
      <div class="profile-text">${esc(description)}</div>
    </div>` : '';

  const clubsSection = hasClubs ? `
    <div class="sec${leftGrow === 'clubs' ? ' sec-grow' : ''}">
      <div class="sec-title">Trayectoria</div>
      <div class="timeline">
        ${clubs.map((c, i) => `
          <div class="tl-item">
            <div class="tl-dot"></div>
            ${i < clubs.length - 1 ? '<div class="tl-line"></div>' : ''}
            <div>
              <div class="tl-club">${esc(c.club)}</div>
              <div class="tl-meta">${esc(c.etapa)}${c.categoria ? ' · ' + esc(c.categoria) : ''}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : '';

  const statsSection = hasStats ? `
    <div class="sec${leftGrow === 'stats' ? ' sec-grow' : ''}">
      <div class="sec-title">Estadísticas de temporada</div>
      <div class="stats-row">
        ${player.goals        != null ? `<div class="stat"><div class="stat-n" style="color:#7C3AED">${player.goals}</div><div class="stat-l">Goles</div></div>` : ''}
        ${player.assists      != null ? `<div class="stat"><div class="stat-n" style="color:#3B82F6">${player.assists}</div><div class="stat-l">Asist.</div></div>` : ''}
        ${player.matchesPlayed != null ? `<div class="stat"><div class="stat-n" style="color:#10B981">${player.matchesPlayed}</div><div class="stat-l">Partidos</div></div>` : ''}
        ${player.minutesPlayed != null ? `<div class="stat"><div class="stat-n" style="color:#F59E0B">${player.minutesPlayed}</div><div class="stat-l">Min</div></div>` : ''}
        ${player.saves         != null ? `<div class="stat"><div class="stat-n" style="color:#06B6D4">${player.saves}</div><div class="stat-l">Paradas</div></div>` : ''}
      </div>
    </div>` : '';

  // If left column is empty, add a filler
  const leftEmpty = !hasProfile && !hasClubs && !hasStats;
  const leftFiller = leftEmpty ? `<div class="sec sec-grow"><div class="sec-title">Perfil del jugador</div><div class="empty-note">Sin datos adicionales registrados.</div></div>` : '';

  // ── RIGHT COLUMN sections ──
  // Cualidades grows if exists, else highlights
  const rightGrow = hasTags ? 'tags' : 'highlights';

  const metricSection = `
    <div class="sec">
      <div class="sec-title">Valoración técnica</div>
      <div class="metric-row">
        ${radarSvg}
        <div class="bars-col">${barsHtml}</div>
      </div>
    </div>`;

  const tagsSection = hasTags ? `
    <div class="sec${rightGrow === 'tags' ? ' sec-grow' : ''}">
      <div class="sec-title">Cualidades técnicas</div>
      <ul class="qual-list">
        ${player.tags.map(t => `<li>${esc(t)}</li>`).join('')}
      </ul>
    </div>` : '';

  const highlightsSection = `
    <div class="sec${rightGrow === 'highlights' ? ' sec-grow' : ''}">
      <div class="sec-title">Puntos destacados</div>
      <div class="highlights">
        ${topHighlights.map(h => `
          <div class="hl-item" style="border-left-color:${h.color}">
            <div class="hl-head">
              <span class="hl-title">${h.title}</span>
              <span class="hl-score" style="color:${rc(h.val)}">${h.val}<span style="font-size:8px;opacity:.6">/10</span></span>
            </div>
            <div class="hl-desc">${h.desc}</div>
          </div>`).join('')}
      </div>
    </div>`;

  const contactSection = hasContact ? `
    <div class="sec">
      <div class="sec-title">Contacto y representación</div>
      ${player.contactName ? `<div class="ct-row"><span class="ct-lbl">${esc(player.contactRelation || 'Contacto')}</span><span class="ct-val">${esc(player.contactName)}${player.contactPhone ? ' · <strong>' + esc(player.contactPhone) + '</strong>' : ''}</span></div>` : ''}
      ${player.agentName   ? `<div class="ct-row"><span class="ct-lbl">Agente</span><span class="ct-val">${esc(player.agentName)}</span></div>` : ''}
    </div>` : '';

  // Header tags
  const headerTagsHtml = player.tags.length
    ? `<div class="tag-pills">${player.tags.slice(0, 7).map(t => `<span class="tag-pill">${esc(t)}</span>`).join('')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Sports CV — ${esc(player.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 10px;
  background: #94A3B8;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
@page { size: A4; margin: 0; }
@media screen {
  body { padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .page { box-shadow: 0 12px 60px rgba(0,0,0,0.35); }
}
@media print {
  body { background: #fff; padding: 0; }
  .no-print { display: none !important; }
  .page { box-shadow: none; }
}

/* Toolbar */
.no-print { display: flex; gap: 8px; align-self: flex-end; }
.no-print button {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 13px; padding: 9px 16px; border-radius: 8px;
  cursor: pointer; border: none; font-weight: 700;
}

/* ── A4 PAGE SHELL ── */
.page {
  width: 210mm;
  height: 297mm;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── HEADER ── */
.hdr {
  background: #0B0F1A;
  padding: 8px 20px 12px;
  flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.brand img { height: 14px; display: block; }
.brand-txt {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9.5px; font-weight: 700; letter-spacing: .15em;
  color: #A78BFA; text-transform: uppercase;
}
.hdr-body { display: flex; align-items: center; gap: 14px; }

.player-photo {
  width: 68px; height: 68px; border-radius: 10px;
  object-fit: cover; object-position: top;
  border: 2px solid rgba(124,58,237,0.45); flex-shrink: 0;
}
.player-init {
  width: 68px; height: 68px; border-radius: 10px;
  background: rgba(124,58,237,0.22);
  border: 2px solid rgba(124,58,237,0.45);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 28px; font-weight: 900; color: #A78BFA; flex-shrink: 0;
}
.player-info { flex: 1; min-width: 0; }
.player-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 32px; font-weight: 900; color: #FFFFFF;
  text-transform: uppercase; letter-spacing: .02em; line-height: 1;
  margin-bottom: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.player-sub { font-size: 10px; color: #94A3B8; font-weight: 500; margin-bottom: 6px; }
.tag-pills { display: flex; gap: 4px; flex-wrap: wrap; }
.tag-pill {
  font-size: 8px; padding: 2px 7px; border-radius: 99px;
  background: rgba(124,58,237,0.3); color: #C4B5FD;
  font-weight: 600; border: 1px solid rgba(124,58,237,0.38);
}
.score-box {
  flex-shrink: 0; text-align: center;
  padding-left: 14px; border-left: 1px solid rgba(255,255,255,0.1);
}
.score-lbl {
  font-size: 7px; letter-spacing: .15em; text-transform: uppercase;
  color: #475569; font-weight: 700; margin-bottom: 0;
}
.score-num {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 58px; font-weight: 900; line-height: .95;
}
.score-den { font-size: 10px; color: #64748B; font-weight: 500; }

/* ── DATA STRIP ── */
.strip {
  background: #F1F5F9;
  border-bottom: 1.5px solid #E2E8F0;
  padding: 6px 20px;
  display: flex; align-items: center; flex-wrap: nowrap;
  flex-shrink: 0; overflow: hidden;
}
.dp {
  display: flex; align-items: center; gap: 5px;
  padding: 0 11px; border-right: 1px solid #CBD5E1;
  white-space: nowrap;
}
.dp:first-child { padding-left: 0; }
.dp:last-child { border-right: none; }
.dp-l { font-size: 8px; color: #94A3B8; font-weight: 500; margin-right: 1px; }
.dp-v { font-size: 9px; color: #0F172A; font-weight: 700; }

/* ── BODY ── */
.body {
  flex: 1; display: flex; min-height: 0;
  overflow: hidden;
}
.col-l {
  width: 50%; padding: 14px 10px 12px 20px;
  border-right: 1px solid #E2E8F0;
  display: flex; flex-direction: column; overflow: hidden;
}
.col-r {
  width: 50%; padding: 14px 20px 12px 10px;
  display: flex; flex-direction: column; overflow: hidden;
}

/* Sections */
.sec { flex-shrink: 0; margin-bottom: 12px; }
.sec:last-child { margin-bottom: 0; }
.sec-grow {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  margin-bottom: 12px;
}
.sec-grow:last-child { margin-bottom: 0; }
.sec-title {
  font-size: 7px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .15em; color: #7C3AED;
  border-bottom: 1.5px solid #EDE9FE;
  padding-bottom: 4px; margin-bottom: 8px;
  flex-shrink: 0;
}

/* Profile */
.profile-text {
  font-size: 9.5px; line-height: 1.7; color: #374151;
  border-left: 2.5px solid #7C3AED;
  background: #FAFAFA; padding: 7px 9px;
  border-radius: 0 4px 4px 0;
  flex: 1;
}
.sec-grow .profile-text { overflow: hidden; }

/* Empty note */
.empty-note { font-size: 9px; color: #CBD5E1; font-style: italic; flex: 1; padding-top: 4px; }

/* Timeline */
.timeline { padding-left: 14px; }
.tl-item { position: relative; display: flex; gap: 6px; padding-bottom: 9px; }
.tl-item:last-child { padding-bottom: 0; }
.tl-dot {
  position: absolute; left: -14px; top: 3px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #7C3AED; border: 1.5px solid #fff;
  box-shadow: 0 0 0 1.5px rgba(124,58,237,0.22); z-index: 1;
}
.tl-line {
  position: absolute; left: -11px; top: 11px; bottom: 0;
  width: 2px; background: linear-gradient(to bottom, #DDD6FE, #E2E8F0);
}
.tl-club { font-size: 10px; font-weight: 700; color: #0F172A; }
.tl-meta { font-size: 8.5px; color: #64748B; }

/* Stats */
.stats-row { display: flex; gap: 6px; }
.stat {
  flex: 1; text-align: center;
  background: #F8FAFC; border: 1px solid #E2E8F0;
  border-radius: 6px; padding: 7px 2px;
}
.stat-n {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 26px; font-weight: 800; line-height: 1;
}
.stat-l { font-size: 7px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; margin-top: 1px; }

/* Metric section */
.metric-row { display: flex; gap: 8px; align-items: flex-start; }
.bars-col { flex: 1; padding-top: 2px; }
.bar { margin-bottom: 9px; }
.bar:last-child { margin-bottom: 0; }
.bar-row { display: flex; justify-content: space-between; font-size: 9px; color: #64748B; font-weight: 500; margin-bottom: 3px; }
.bar-val { font-weight: 800; font-size: 10px; }
.bar-track { height: 5px; border-radius: 3px; background: #F1F5F9; overflow: hidden; }
.bar-fill { height: 5px; border-radius: 3px; }

/* Qualities */
.qual-list { list-style: none; columns: 2; column-gap: 6px; flex: 1; }
.sec-grow .qual-list { overflow: hidden; }
.qual-list li {
  font-size: 9px; color: #374151; padding: 3px 0;
  display: flex; align-items: center; gap: 5px;
  break-inside: avoid;
  border-bottom: 1px solid #F8FAFC;
}
.qual-list li::before { content: '—'; color: #A78BFA; font-weight: 700; flex-shrink: 0; }

/* Highlights */
.highlights { display: flex; flex-direction: column; gap: 7px; flex: 1; }
.sec-grow .highlights { overflow: hidden; }
.hl-item {
  border-left: 3px solid #7C3AED;
  background: #FAFAFA; padding: 6px 8px;
  border-radius: 0 5px 5px 0;
}
.hl-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.hl-title { font-size: 9.5px; font-weight: 700; color: #0F172A; }
.hl-score { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 800; }
.hl-desc { font-size: 8.5px; color: #64748B; line-height: 1.5; }

/* Contact */
.ct-row {
  display: flex; align-items: baseline; gap: 8px;
  padding: 4px 0; border-bottom: 1px solid #F8FAFC;
}
.ct-row:last-child { border-bottom: none; }
.ct-lbl { font-size: 8px; color: #94A3B8; font-weight: 600; min-width: 54px; flex-shrink: 0; text-transform: uppercase; letter-spacing: .06em; }
.ct-val { font-size: 9.5px; color: #0F172A; font-weight: 600; }

/* ── FOOTER ── */
.ftr {
  background: #0B0F1A; border-top: 2px solid #7C3AED;
  padding: 5px 20px;
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
}
.ftr-l {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 8.5px; color: #A78BFA; font-weight: 700;
  text-transform: uppercase; letter-spacing: .12em;
}
.ftr-r { font-size: 8px; color: #475569; }
</style>
</head>
<body>

<div class="no-print">
  <button onclick="window.print()" style="background:#7C3AED;color:#fff">🖨️ Guardar como PDF</button>
  <button onclick="window.close()" style="background:#fff;color:#374151;border:1px solid #d1d5db">✕ Cerrar</button>
</div>

<div class="page">

  <!-- HEADER -->
  <div class="hdr">
    <div class="brand">
      ${logoUrl ? `<img src="${logoUrl}" alt="Volea" onerror="this.style.display='none'">` : ''}
      <span class="brand-txt">Volea Scouting</span>
    </div>
    <div class="hdr-body">
      ${player.photoBase64
        ? `<img src="${player.photoBase64}" alt="${esc(player.name)}" class="player-photo">`
        : `<div class="player-init">${esc(player.name.charAt(0).toUpperCase())}</div>`
      }
      <div class="player-info">
        <div class="player-name">${esc(player.name)}</div>
        <div class="player-sub">${esc(player.position)}${player.club ? ' · ' + esc(player.club) : ''}${player.category ? ' · ' + esc(player.category) : ''}${player.division ? ' · ' + esc(player.division) : ''}</div>
        ${headerTagsHtml}
      </div>
      <div class="score-box">
        <div class="score-lbl">Nota global</div>
        <div class="score-num" style="color:${rc(avg)}">${avg}</div>
        <div class="score-den">/10</div>
      </div>
    </div>
  </div>

  <!-- DATA STRIP -->
  <div class="strip">${dataPills}</div>

  <!-- BODY -->
  <div class="body">

    <!-- LEFT 50% -->
    <div class="col-l">
      ${profileSection}
      ${clubsSection}
      ${statsSection}
      ${leftFiller}
    </div>

    <!-- RIGHT 50% -->
    <div class="col-r">
      ${metricSection}
      ${tagsSection}
      ${highlightsSection}
      ${contactSection}
    </div>

  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <div class="ftr-l">Volea Scouting · voleascouting.com</div>
    <div class="ftr-r">Documento confidencial · Generado el ${today}</div>
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
  const { isDemo } = useDemo();
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer]         = useState<Player | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError]    = useState('');
  const [clubs, setClubs]            = useState<CvClub[]>([]);
  const [newClub, setNewClub]        = useState({ club: '', etapa: '', categoria: '' });
  const [description, setDescription] = useState('');
  const [polishing, setPolishing]    = useState(false);
  const [generating, setGenerating]  = useState(false);

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (!playerId) return;
    if (isDemo) {
      const p = DEMO_PLAYERS.find(pl => pl.id === playerId) ?? null;
      if (p) { setPlayer(p); setClubs(p.cvClubs ?? []); }
      setLoadingData(false);
      return;
    }
    getPlayer(playerId)
      .then(p => { if (p) { setPlayer(p); setClubs(p.cvClubs ?? []); } })
      .catch(err => { console.error(err); setLoadError('Error al cargar el jugador. Recarga la página.'); })
      .finally(() => setLoadingData(false));
  }, [playerId, isDemo]);

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

    if (!isDemo) {
      try { await updatePlayer(player.id, { cvClubs: clubs }); } catch { /* non-critical */ }
    }

    const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/logo-volea-icon.svg' : '';
    const html = buildCvHtml(player, clubs, polishedDesc, logoUrl);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setGenerating(false);
  }

  if (loading || loadingData) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94A3B8' }}>Cargando…</p>
      </main>
    );
  }
  if (loadError) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#F87171' }}>{loadError}</p>
      </main>
    );
  }
  if (!player) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0B0F1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
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
        <div style={{ maxWidth: 900, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/app" style={{ textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#7C3AED', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}>V</div>
            </Link>
            <span style={{ color: '#64748B' }}>/</span>
            <Link href="/app" style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}>Jugadores</Link>
            <span style={{ color: '#64748B' }}>/</span>
            <Link href={`/app/players/${player.id}`} style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}>{player.name}</Link>
            <span style={{ color: '#64748B' }}>/</span>
            <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>Sports CV</span>
          </div>
          <Link href={`/app/players/${player.id}`} style={{ color: '#94A3B8', fontSize: '0.8rem', textDecoration: 'none', padding: '0.4rem 0.875rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>← Volver al jugador</Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

        {/* Player hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg,#0B0F1A,#160b2e)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#C4B5FD', overflow: 'hidden', flexShrink: 0 }}>
            {player.photoBase64
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={player.photoBase64} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              : player.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{player.name}</p>
            <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{player.position} · {player.club || '—'} · {player.category || '—'}</p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '0.625rem 1rem' }}>
            <p style={{ color: '#C4B5FD', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Nota</p>
            <p style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{avg}</p>
          </div>
        </div>

        {/* Club history */}
        <div style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.875rem' }}>Trayectoria en clubes</p>
          {clubs.length === 0 && <p style={{ color: '#64748B', fontSize: '0.825rem', marginBottom: '0.75rem' }}>Aún no has añadido clubes</p>}
          {clubs.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: '0.375rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', flex: 1 }}>{c.club}</span>
              <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{c.etapa}</span>
              {c.categoria && <span style={{ color: '#A78BFA', fontSize: '0.8rem', fontWeight: 600 }}>{c.categoria}</span>}
              <button onClick={() => removeClub(i)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}>✕</button>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px auto', gap: '0.625rem', marginTop: '0.75rem', alignItems: 'flex-end' }}>
            <div>
              <label style={labelS}>Club</label>
              <input style={inputS} value={newClub.club} placeholder="CF Lorca" onChange={e => setNewClub(n => ({ ...n, club: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addClub()} />
            </div>
            <div>
              <label style={labelS}>Etapa</label>
              <input style={inputS} value={newClub.etapa} placeholder="Alevín" onChange={e => setNewClub(n => ({ ...n, etapa: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addClub()} />
            </div>
            <div>
              <label style={labelS}>Categoría</label>
              <input style={inputS} value={newClub.categoria} placeholder="Superliga" onChange={e => setNewClub(n => ({ ...n, categoria: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addClub()} />
            </div>
            <button onClick={addClub} style={{ background: '#7C3AED', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', padding: '0.6rem 0.875rem', height: 40 }}>+</button>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.875rem' }}>Descripción del jugador</p>
          <textarea rows={4} style={{ ...inputS, resize: 'vertical', marginBottom: '0.5rem' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Jugador con buen manejo de balón, destaca en la conducción y el regate. Líder en el vestuario..." />
          <p style={{ color: '#64748B', fontSize: '0.75rem', margin: 0 }}>
            {polishing ? '🤖 La IA está puliendo la descripción…' : 'La IA mejorará el texto al generar el CV (si hay una clave configurada).'}
          </p>
        </div>

        {/* Generate button */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={handleGenerate} disabled={generating} style={{ background: generating ? '#5B21B6' : 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: 'white', border: 'none', padding: '0.875rem 2.5rem', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: generating ? 'not-allowed' : 'pointer', boxShadow: generating ? 'none' : '0 4px 20px rgba(124,58,237,0.4)' }}>
            {generating ? '⏳ Generando…' : '📋 Generar Sports CV'}
          </button>
          <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '0.75rem' }}>Se abrirá en una nueva ventana. Usa el botón 🖨️ para guardar como PDF.</p>
        </div>

      </div>
    </main>
  );
}
