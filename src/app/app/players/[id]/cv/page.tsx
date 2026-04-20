'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayer, updatePlayer } from '@/lib/players';
import { DEMO_PLAYERS } from '@/lib/demo-data';
import { Player, DetailedMetrics } from '@/types/player';

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

// ─── Radar SVG 140px ────────────────────────────────────────────────────────

function buildRadar(metrics: Player['metrics']): string {
  const dims = ['Técnica', 'Táctica', 'Físico', 'Actitud'];
  const vals = [metrics.technical, metrics.tactical, metrics.physical, metrics.attitude];
  const size = 140, cx = size / 2, cy = size / 2, R = size * 0.3;
  const n = 4, sa = -Math.PI / 2, step = (2 * Math.PI) / n;
  const po = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];

  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;
  for (let l = 1; l <= 5; l++) {
    const r = R * l / 5;
    const pts = Array.from({ length: n }, (_, i) => po(sa + i * step, r).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="${l === 5 ? '#CBD5E1' : '#E2E8F0'}" stroke-width="${l === 5 ? 1 : 0.5}"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = po(sa + i * step, R);
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E2E8F0" stroke-width="0.5"/>`;
    const [lx, ly] = po(sa + i * step, R + 17);
    const anc = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end';
    s += `<text x="${lx}" y="${ly + 3}" text-anchor="${anc}" font-size="7.5" font-weight="600" fill="#94A3B8" font-family="'DM Sans',system-ui">${dims[i]}</text>`;
  }
  const dp = vals.map((v, i) => po(sa + i * step, R * Math.max(0.5, v) / 10).join(',')).join(' ');
  s += `<polygon points="${dp}" fill="rgba(124,58,237,0.18)" stroke="#7C3AED" stroke-width="2" stroke-linejoin="round"/>`;
  vals.forEach((v, i) => {
    const [x, y] = po(sa + i * step, R * Math.max(0.5, v) / 10);
    s += `<circle cx="${x}" cy="${y}" r="3.5" fill="#7C3AED" stroke="#fff" stroke-width="1.5"/>`;
    s += `<text x="${x}" y="${y - 6}" text-anchor="middle" font-size="8" font-weight="800" fill="#7C3AED" font-family="'DM Sans',system-ui">${v}</text>`;
  });
  return s + '</svg>';
}

// ─── Detailed metrics HTML ──────────────────────────────────────────────────

function buildDetailedMetrics(dm: DetailedMetrics): string {
  const groups = [
    {
      label: 'Técnica', color: '#7C3AED',
      items: [
        { label: 'Pase',      val: dm.technical.passing },
        { label: 'Control',   val: dm.technical.control },
        { label: 'Visión',    val: dm.technical.vision },
        { label: 'Regate',    val: dm.technical.dribbling },
        { label: 'Pressing',  val: dm.technical.pressing },
      ],
    },
    {
      label: 'Táctica', color: '#3B82F6',
      items: [
        { label: 'Equilibrio',   val: dm.tactical.balance },
        { label: 'Transición',   val: dm.tactical.transition },
        { label: 'Recuperación', val: dm.tactical.recovery },
        { label: 'Creación',     val: dm.tactical.creation },
        { label: 'Pres. alta',   val: dm.tactical.highPress },
      ],
    },
    {
      label: 'Físico', color: '#10B981',
      items: [
        { label: 'Velocidad',   val: dm.physical.speed },
        { label: 'Resistencia', val: dm.physical.resistance },
        { label: 'Fuerza',      val: dm.physical.strength },
        { label: 'Salto',       val: dm.physical.jump },
      ],
    },
    {
      label: 'Actitud', color: '#F59E0B',
      items: [
        { label: 'Liderazgo',       val: dm.attitude.leadership },
        { label: 'Competitividad',  val: dm.attitude.competitiveness },
        { label: 'Entrenabilidad',  val: dm.attitude.coachability },
      ],
    },
  ];

  return groups.map(g => `
    <div class="dmg">
      <div class="dmg-title" style="color:${g.color}">${g.label}</div>
      ${g.items.map(it => `
        <div class="dm-row">
          <span class="dm-lbl">${it.label}</span>
          <div class="dm-track"><div class="dm-fill" style="width:${it.val * 10}%;background:${g.color}40;border-right:2px solid ${g.color}"></div></div>
          <span class="dm-val" style="color:${ratingColor(it.val)}">${it.val}</span>
        </div>`).join('')}
    </div>`).join('');
}

// ─── CV HTML builder ────────────────────────────────────────────────────────

function buildCvHtml(player: Player, clubs: CvClub[], description: string, logoUrl: string): string {
  const avg = avgMetrics(player);
  const rc = ratingColor;
  const age = calcAge(player.birthDate);
  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  // Profile text: textarea override, then privateNotes
  const profileText = description || player.privateNotes || '';

  const metricDefs = [
    { key: 'technical' as const, label: 'Técnica', color: '#7C3AED', title: 'Dominio técnico',      desc: 'Control, conducción y precisión de pase destacados.' },
    { key: 'tactical'  as const, label: 'Táctica', color: '#3B82F6', title: 'Inteligencia táctica', desc: 'Lectura del juego avanzada, posicionamiento excelente.' },
    { key: 'physical'  as const, label: 'Físico',  color: '#10B981', title: 'Capacidad física',     desc: 'Velocidad, resistencia y potencia por encima de la media.' },
    { key: 'attitude'  as const, label: 'Actitud', color: '#F59E0B', title: 'Actitud y liderazgo',  desc: 'Mentalidad competitiva y referente dentro del grupo.' },
  ];

  const hasStats          = player.goals != null || player.assists != null || player.matchesPlayed != null || player.minutesPlayed != null;
  const hasContact        = !!(player.contactName || player.agentName);
  const hasTags           = player.tags.length > 0;
  const hasClubHistory    = !!(player.clubHistory?.length);
  const hasCvClubs        = clubs.length > 0;
  const hasAnyClubs       = hasClubHistory || hasCvClubs;
  const hasProfile        = !!profileText;
  const hasDetailedMetrics = !!player.detailedMetrics;

  // Top 3 highlights from metrics
  const topHighlights = [...metricDefs]
    .map(m => ({ ...m, val: player.metrics[m.key] }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  // ── Header pills ──
  const headerTagsHtml = player.tags.length
    ? `<div class="tag-pills">${player.tags.slice(0, 7).map(t => `<span class="tag-pill">${esc(t)}</span>`).join('')}</div>`
    : '';

  // ── Radar + bars ──
  const radarSvg = buildRadar(player.metrics);
  const barsHtml = metricDefs.map(m => `
    <div class="bar">
      <div class="bar-row">
        <span class="bar-lbl">${m.label}</span>
        <span class="bar-val" style="color:${rc(player.metrics[m.key])}">${player.metrics[m.key]}<span style="font-size:7px;color:#94A3B8;font-weight:400">/10</span></span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${player.metrics[m.key] * 10}%;background:${m.color}"></div></div>
    </div>`).join('');

  // ── LEFT COLUMN sections ──

  // Datos personales — always shown
  const piRow = (lbl: string, val: string) =>
    `<div class="pi-row"><span class="pi-lbl">${lbl}</span><span class="pi-val">${val}</span></div>`;

  const datosHtml = `
    <div class="sec">
      <div class="sec-title">Datos personales</div>
      <div class="pi-list">
        ${player.birthDate ? piRow('Nacimiento', formatDate(player.birthDate)) : ''}
        ${age              ? piRow('Edad',        `${age} años`) : ''}
        ${player.city      ? piRow('Localidad',   esc(player.city)) : ''}
        ${player.foot      ? piRow('Pie',         esc(player.foot)) : ''}
        ${player.height    ? piRow('Altura',      `${player.height} cm`) : ''}
        ${player.weight    ? piRow('Peso',        `${player.weight} kg`) : ''}
        ${player.category  ? piRow('Categoría',   esc(player.category)) : ''}
        ${player.division  ? piRow('División',    esc(player.division)) : ''}
        ${player.contractEnd ? piRow('Fin contrato', formatDate(player.contractEnd)) : ''}
      </div>
    </div>`;

  // Perfil — grows to fill remaining left space when no detailed metrics
  const profileSection = hasProfile ? `
    <div class="sec${!hasDetailedMetrics ? ' sec-grow' : ''}">
      <div class="sec-title">Perfil del jugador</div>
      <div class="profile-text">${esc(profileText)}</div>
    </div>` : '';

  // Métricas detalladas — only if exists
  const detailedMetricsSection = hasDetailedMetrics ? `
    <div class="sec sec-grow">
      <div class="sec-title">Métricas detalladas</div>
      <div class="dm-wrap">${buildDetailedMetrics(player.detailedMetrics!)}</div>
    </div>` : '';

  // Trayectoria — clubHistory preferred, fallback to cvClubs
  const trayectoriaSection = hasAnyClubs ? (() => {
    const items = hasClubHistory
      ? player.clubHistory!.map(e => `
          <div class="tl-item">
            <div class="tl-dot"></div>
            <div>
              <div class="tl-club">${esc(e.club)}</div>
              <div class="tl-meta">${esc(e.category)}${e.season ? ' · ' + esc(e.season) : ''}${e.goals != null ? ' · ' + e.goals + ' gol' : ''}</div>
            </div>
          </div>`)
      : clubs.map(c => `
          <div class="tl-item">
            <div class="tl-dot"></div>
            <div>
              <div class="tl-club">${esc(c.club)}</div>
              <div class="tl-meta">${esc(c.etapa)}${c.categoria ? ' · ' + esc(c.categoria) : ''}</div>
            </div>
          </div>`);
    return `
    <div class="sec">
      <div class="sec-title">Trayectoria</div>
      <div class="timeline">${items.join('')}</div>
    </div>`;
  })() : '';

  // Estadísticas — row of big numbers
  const statsSection = hasStats ? `
    <div class="sec">
      <div class="sec-title">Estadísticas de temporada</div>
      <div class="stats-row">
        ${player.goals         != null ? `<div class="stat"><div class="stat-n" style="color:#7C3AED">${player.goals}</div><div class="stat-l">Goles</div></div>` : ''}
        ${player.assists       != null ? `<div class="stat"><div class="stat-n" style="color:#3B82F6">${player.assists}</div><div class="stat-l">Asist.</div></div>` : ''}
        ${player.matchesPlayed != null ? `<div class="stat"><div class="stat-n" style="color:#10B981">${player.matchesPlayed}</div><div class="stat-l">Partidos</div></div>` : ''}
        ${player.minutesPlayed != null ? `<div class="stat"><div class="stat-n" style="color:#F59E0B">${player.minutesPlayed}</div><div class="stat-l">Min</div></div>` : ''}
        ${player.saves         != null ? `<div class="stat"><div class="stat-n" style="color:#06B6D4">${player.saves}</div><div class="stat-l">Paradas</div></div>` : ''}
      </div>
    </div>` : '';

  // Left column grows from profile if no detailedMetrics, or from detailedMetrics if exists
  // If no profile either, datos personales grows via sec-grow
  const datosClass = (!hasProfile && !hasDetailedMetrics) ? ' sec-grow' : '';
  const datosSection = datosHtml.replace('<div class="sec">', `<div class="sec${datosClass}">`);

  // ── RIGHT COLUMN sections ──

  const metricSection = `
    <div class="sec">
      <div class="sec-title">Valoración técnica</div>
      <div class="metric-row">
        <div style="flex-shrink:0">${radarSvg}</div>
        <div class="bars-col">${barsHtml}</div>
      </div>
    </div>`;

  const tagsSection = hasTags ? `
    <div class="sec sec-grow">
      <div class="sec-title">Cualidades técnicas</div>
      <ul class="qual-list">
        ${player.tags.map(t => `<li>${esc(t)}</li>`).join('')}
      </ul>
    </div>` : '';

  const highlightsSection = `
    <div class="sec${!hasTags ? ' sec-grow' : ''}">
      <div class="sec-title">Puntos destacados</div>
      <div class="highlights">
        ${topHighlights.map(h => `
          <div class="hl-item" style="border-left-color:${h.color}">
            <div class="hl-head">
              <span class="hl-title">${h.title}</span>
              <span class="hl-score" style="color:${rc(h.val)}">${h.val}<span style="font-size:8px;color:#94A3B8;font-weight:400">/10</span></span>
            </div>
            <div class="hl-desc">${h.desc}</div>
          </div>`).join('')}
      </div>
    </div>`;

  const contactSection = hasContact ? `
    <div class="sec">
      <div class="sec-title">Contacto y representación</div>
      ${player.contactName ? `<div class="ct-row"><span class="ct-lbl">${esc(player.contactRelation || 'Contacto')}</span><span class="ct-val">${esc(player.contactName)}${player.contactPhone ? ' · ' + esc(player.contactPhone) : ''}</span></div>` : ''}
      ${player.agentName   ? `<div class="ct-row"><span class="ct-lbl">Agente</span><span class="ct-val">${esc(player.agentName)}</span></div>` : ''}
    </div>` : '';

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
  font-size: 9.5px;
  background: #94A3B8;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  color: #1E293B;
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

/* ── A4 PAGE ── */
.page {
  width: 210mm;
  height: 297mm;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── HEADER (~15%) ── */
.hdr {
  background: #0B0F1A;
  padding: 9px 20px 14px;
  flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 6px; margin-bottom: 9px; }
.brand img { height: 14px; display: block; }
.brand-txt {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: .15em;
  color: #A78BFA; text-transform: uppercase;
}
.hdr-body { display: flex; align-items: center; gap: 16px; }
.player-photo {
  width: 80px; height: 80px; border-radius: 11px;
  object-fit: cover; object-position: top;
  border: 2px solid rgba(124,58,237,0.5); flex-shrink: 0;
}
.player-init {
  width: 80px; height: 80px; border-radius: 11px;
  background: rgba(124,58,237,0.22); border: 2px solid rgba(124,58,237,0.5);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 30px; font-weight: 900; color: #A78BFA; flex-shrink: 0;
}
.player-info { flex: 1; min-width: 0; }
.player-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 34px; font-weight: 900; color: #FFFFFF;
  text-transform: uppercase; letter-spacing: .02em; line-height: 1;
  margin-bottom: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.player-sub { font-size: 10px; color: #94A3B8; font-weight: 500; margin-bottom: 7px; }
.tag-pills { display: flex; gap: 4px; flex-wrap: wrap; }
.tag-pill {
  font-size: 8px; padding: 2px 7px; border-radius: 99px;
  background: rgba(124,58,237,0.28); color: #C4B5FD;
  font-weight: 600; border: 1px solid rgba(124,58,237,0.35);
}
.score-box {
  flex-shrink: 0; text-align: center;
  padding-left: 16px; border-left: 1px solid rgba(255,255,255,0.1);
  min-width: 70px;
}
.score-lbl {
  font-size: 7px; letter-spacing: .15em; text-transform: uppercase;
  color: #475569; font-weight: 700;
}
.score-num {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 60px; font-weight: 900; line-height: .95;
}
.score-den { font-size: 10px; color: #64748B; font-weight: 500; }

/* Accent line below header */
.hdr-accent {
  height: 3px;
  background: linear-gradient(90deg, #7C3AED 0%, #A78BFA 50%, transparent 100%);
  flex-shrink: 0;
}

/* ── BODY ── */
.body {
  flex: 1; display: flex; min-height: 0; overflow: hidden;
}

/* LEFT SIDEBAR (42%) */
.col-l {
  width: 42%; min-width: 0;
  padding: 13px 10px 12px 18px;
  background: #F7F8FA;
  border-right: 1.5px solid #E2E8F0;
  display: flex; flex-direction: column; overflow: hidden;
}

/* RIGHT MAIN (58%) */
.col-r {
  width: 58%; min-width: 0;
  padding: 13px 18px 12px 12px;
  background: #ffffff;
  display: flex; flex-direction: column; overflow: hidden;
}

/* ── SECTIONS ── */
.sec {
  flex-shrink: 0;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #EEF0F4;
}
.sec:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.sec-grow {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  padding-bottom: 8px; margin-bottom: 8px;
  border-bottom: 1px solid #EEF0F4;
}
.sec-grow:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.sec-title {
  font-size: 7px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .16em; color: #7C3AED;
  margin-bottom: 7px; flex-shrink: 0;
  display: flex; align-items: center; gap: 5px;
}
.sec-title::after {
  content: ''; flex: 1; height: 1px; background: #EDE9FE;
}

/* ── DATOS PERSONALES ── */
.pi-list { flex: 1; }
.pi-row {
  display: flex; align-items: baseline;
  justify-content: space-between; gap: 6px;
  padding: 2.5px 0;
  border-bottom: 1px solid #F1F3F6;
}
.pi-row:last-child { border-bottom: none; }
.pi-lbl { font-size: 8px; color: #94A3B8; font-weight: 500; flex-shrink: 0; }
.pi-val { font-size: 9px; color: #0F172A; font-weight: 700; text-align: right; }

/* ── PROFILE TEXT ── */
.profile-text {
  font-size: 9.5px; line-height: 1.65; color: #374151;
  border-left: 2.5px solid #7C3AED;
  background: #FEFEFE; padding: 7px 8px;
  border-radius: 0 4px 4px 0;
  flex: 1; overflow: hidden;
}

/* ── DETAILED METRICS ── */
.dm-wrap { flex: 1; overflow: hidden; }
.dmg { margin-bottom: 7px; }
.dmg:last-child { margin-bottom: 0; }
.dmg-title {
  font-size: 7.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; margin-bottom: 4px;
  padding-left: 2px;
}
.dm-row {
  display: flex; align-items: center; gap: 5px;
  margin-bottom: 2.5px;
}
.dm-lbl {
  font-size: 7.5px; color: #64748B; font-weight: 500;
  width: 70px; flex-shrink: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dm-track {
  flex: 1; height: 4px; background: #EAECF0;
  border-radius: 2px; overflow: hidden;
}
.dm-fill { height: 4px; border-radius: 2px; }
.dm-val { font-size: 8px; font-weight: 700; width: 14px; text-align: right; flex-shrink: 0; }

/* ── TIMELINE ── */
.timeline { padding-left: 13px; }
.tl-item { position: relative; display: flex; gap: 6px; padding-bottom: 8px; }
.tl-item:last-child { padding-bottom: 0; }
.tl-dot {
  position: absolute; left: -13px; top: 3px;
  width: 7px; height: 7px; border-radius: 50%;
  background: #7C3AED; border: 1.5px solid #F7F8FA;
  box-shadow: 0 0 0 1.5px rgba(124,58,237,0.2); z-index: 1;
}
.tl-club { font-size: 9.5px; font-weight: 700; color: #0F172A; line-height: 1.2; }
.tl-meta { font-size: 8px; color: #64748B; line-height: 1.4; }

/* ── STATS ── */
.stats-row { display: flex; gap: 5px; }
.stat {
  flex: 1; text-align: center;
  background: #F0F2F8; border-radius: 6px; padding: 6px 3px;
}
.stat-n {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 28px; font-weight: 800; line-height: 1;
}
.stat-l { font-size: 7px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; margin-top: 1px; }

/* ── VALORACIÓN TÉCNICA ── */
.metric-row { display: flex; gap: 10px; align-items: flex-start; }
.bars-col { flex: 1; padding-top: 4px; }
.bar { margin-bottom: 9px; }
.bar:last-child { margin-bottom: 0; }
.bar-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 9px; color: #64748B; font-weight: 500; margin-bottom: 3px; }
.bar-val { font-weight: 800; font-size: 11px; }
.bar-track { height: 5px; border-radius: 3px; background: #F1F5F9; overflow: hidden; }
.bar-fill { height: 5px; border-radius: 3px; }

/* ── CUALIDADES ── */
.qual-list { list-style: none; columns: 2; column-gap: 8px; flex: 1; overflow: hidden; }
.qual-list li {
  font-size: 9px; color: #374151; padding: 3px 0;
  display: flex; align-items: center; gap: 5px;
  break-inside: avoid; border-bottom: 1px solid #F5F5F7;
}
.qual-list li:last-child { border-bottom: none; }
.qual-list li::before { content: '—'; color: #A78BFA; font-weight: 700; flex-shrink: 0; }

/* ── HIGHLIGHTS ── */
.highlights { display: flex; flex-direction: column; gap: 7px; flex: 1; overflow: hidden; }
.hl-item {
  border-left: 3px solid #7C3AED;
  background: #F9FAFB; padding: 6px 8px;
  border-radius: 0 5px 5px 0;
}
.hl-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.hl-title { font-size: 9.5px; font-weight: 700; color: #0F172A; }
.hl-score { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 800; }
.hl-desc { font-size: 8px; color: #64748B; line-height: 1.5; }

/* ── CONTACT ── */
.ct-row {
  display: flex; align-items: baseline; gap: 8px;
  padding: 4px 0; border-bottom: 1px solid #F5F5F7;
}
.ct-row:last-child { border-bottom: none; }
.ct-lbl { font-size: 8px; color: #94A3B8; font-weight: 600; min-width: 52px; flex-shrink: 0; text-transform: uppercase; letter-spacing: .06em; }
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
  font-size: 9px; color: #A78BFA; font-weight: 700;
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
  <div class="hdr-accent"></div>

  <!-- BODY -->
  <div class="body">

    <!-- LEFT 42% — Sidebar -->
    <div class="col-l">
      ${datosSection}
      ${profileSection}
      ${detailedMetricsSection}
      ${trayectoriaSection}
      ${statsSection}
    </div>

    <!-- RIGHT 58% — Main -->
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

  const [player, setPlayer]           = useState<Player | null>(null);
  const [loadingData, setLoadingData]  = useState(true);
  const [loadError, setLoadError]      = useState('');
  const [clubs, setClubs]              = useState<CvClub[]>([]);
  const [newClub, setNewClub]          = useState({ club: '', etapa: '', categoria: '' });
  const [description, setDescription]  = useState('');
  const [polishing, setPolishing]      = useState(false);
  const [generating, setGenerating]    = useState(false);

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (!playerId) return;
    if (isDemo) {
      const p = DEMO_PLAYERS.find(pl => pl.id === playerId) ?? null;
      if (p) {
        setPlayer(p);
        setClubs(p.cvClubs ?? []);
        setDescription(p.privateNotes ?? '');
      }
      setLoadingData(false);
      return;
    }
    getPlayer(playerId)
      .then(p => {
        if (p) {
          setPlayer(p);
          setClubs(p.cvClubs ?? []);
          setDescription(p.privateNotes ?? '');
        }
      })
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

        {/* Club history (CV-specific) */}
        <div style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.875rem' }}>
            Trayectoria en clubes
            {player.clubHistory?.length ? <span style={{ color: '#7C3AED', marginLeft: 8, fontWeight: 500, fontSize: '0.65rem' }}>(El historial del jugador se usa automáticamente)</span> : ''}
          </p>
          {clubs.length === 0 && <p style={{ color: '#64748B', fontSize: '0.825rem', marginBottom: '0.75rem' }}>Añade clubes para el CV (opcional si ya hay historial)</p>}
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

        {/* Description / profile */}
        <div style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.875rem' }}>Perfil del jugador</p>
          <textarea rows={4} style={{ ...inputS, resize: 'vertical', marginBottom: '0.5rem' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción narrativa del jugador para el CV…" />
          <p style={{ color: '#64748B', fontSize: '0.75rem', margin: 0 }}>
            {polishing ? '🤖 La IA está puliendo el texto…' : 'Pre-cargado desde las notas privadas. La IA lo mejorará al generar.'}
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
