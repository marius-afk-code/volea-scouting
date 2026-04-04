'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getPlayers } from '@/lib/players';
import { DEMO_PLAYERS } from '@/lib/demo-data';
import { Player } from '@/types/player';
import AppNav from '@/components/AppNav';

// ─── Spanish city coordinates ────────────────────────────────────────────────

const CITY_COORDS: Record<string, [number, number]> = {
  'madrid': [40.4168, -3.7038], 'barcelona': [41.3851, 2.1734],
  'valencia': [39.4699, -0.3763], 'sevilla': [37.3891, -5.9845],
  'zaragoza': [41.6488, -0.8891], 'málaga': [36.7213, -4.4214],
  'malaga': [36.7213, -4.4214], 'murcia': [37.9922, -1.1307],
  'palma': [39.5696, 2.6502], 'bilbao': [43.2630, -2.9350],
  'alicante': [38.3452, -0.4810], 'córdoba': [37.8882, -4.7794],
  'cordoba': [37.8882, -4.7794], 'valladolid': [41.6523, -4.7245],
  'vigo': [42.2314, -8.7124], 'gijón': [43.5453, -5.6636],
  'gijon': [43.5453, -5.6636], 'granada': [37.1773, -3.5986],
  'hospitalet': [41.3598, 2.1000], 'vitoria': [42.8467, -2.6727],
  'vitoria-gasteiz': [42.8467, -2.6727], 'la coruña': [43.3713, -8.3962],
  'coruña': [43.3713, -8.3962], 'elche': [38.2627, -0.7016],
  'oviedo': [43.3614, -5.8593], 'badalona': [41.4500, 2.2474],
  'cartagena': [37.6057, -0.9916], 'terrassa': [41.5618, 2.0089],
  'jerez': [36.6817, -6.1372], 'sabadell': [41.5436, 2.1094],
  'almería': [36.8340, -2.4637], 'almeria': [36.8340, -2.4637],
  'santa cruz de tenerife': [28.4636, -16.2518], 'tenerife': [28.4636, -16.2518],
  'pamplona': [42.8125, -1.6458], 'donostia': [43.3128, -1.9755],
  'san sebastián': [43.3128, -1.9755], 'san sebastian': [43.3128, -1.9755],
  'burgos': [42.3440, -3.6970], 'albacete': [38.9943, -1.8585],
  'santander': [43.4623, -3.8099], 'castellón': [39.9864, -0.0513],
  'castellon': [39.9864, -0.0513], 'logroño': [42.4667, -2.4500],
  'logrono': [42.4667, -2.4500], 'badajoz': [38.8794, -6.9706],
  'salamanca': [40.9650, -5.6644], 'huelva': [37.2614, -6.9447],
  'lérida': [41.6162, 0.6200], 'lleida': [41.6162, 0.6200],
  'tarragona': [41.1189, 1.2445], 'jaén': [37.7796, -3.7849],
  'jaen': [37.7796, -3.7849], 'mérida': [38.9167, -6.3438],
  'merida': [38.9167, -6.3438], 'ourense': [42.3367, -7.8641],
  'pontevedra': [42.4331, -8.6500], 'lugo': [43.0097, -7.5567],
  'palencia': [42.0088, -4.5288], 'segovia': [40.9429, -4.1088],
  'ávila': [40.6564, -4.6836], 'avila': [40.6564, -4.6836],
  'zamora': [41.5034, -5.7468], 'soria': [41.7638, -2.4645],
  'guadalajara': [40.6340, -3.1622], 'cuenca': [40.0704, -2.1374],
  'ciudad real': [38.9864, -3.9274], 'toledo': [39.8628, -4.0273],
  'cáceres': [39.4752, -6.3724], 'caceres': [39.4752, -6.3724],
  'léon': [42.5987, -5.5671], 'leon': [42.5987, -5.5671],
  'ceuta': [35.8893, -5.3213], 'melilla': [35.2922, -2.9381],
  'las palmas': [28.1235, -15.4363], 'lorca': [37.6711, -1.6957],
  'alcoy': [38.7008, -0.4739], 'torrevieja': [37.9784, -0.6821],
  'marbella': [36.5101, -4.8826], 'reus': [41.1554, 1.1039],
  'manresa': [41.7281, 1.8274], 'girona': [41.9794, 2.8214],
  'santiago': [42.8782, -8.5448], 'santiago de compostela': [42.8782, -8.5448],
  'ferrol': [43.4848, -8.2339], 'getafe': [40.3058, -3.7330],
  'alcalá de henares': [40.4819, -3.3639], 'alcala': [40.4819, -3.3639],
  'móstoles': [40.3228, -3.8642], 'mostoles': [40.3228, -3.8642],
  'fuenlabrada': [40.2842, -3.7943], 'pozuelo': [40.4338, -3.8137],
};

function resolveCoords(city: string): [number, number] | null {
  const key = city.toLowerCase().trim();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const found = Object.keys(CITY_COORDS).find(k => key.includes(k) || k.includes(key.split(' ')[0]));
  return found ? CITY_COORDS[found] : null;
}

const STATUS_COLORS: Record<string, string> = {
  activo: '#34D399', seguimiento: '#818CF8', espera: '#FBBF24', descartado: '#F87171',
};
const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo', seguimiento: 'En seguimiento', espera: 'En espera', descartado: 'Descartado',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ map: L.Map | null; markers: L.CircleMarker[] }>({ map: null, markers: [] });
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterMode, setFilterMode] = useState<'city' | 'club_city'>('city');
  const [stats, setStats] = useState({ mapped: 0, locations: 0, unmapped: 0 });

  useEffect(() => {
    if (!loading && !user && !isDemo) router.push('/login');
  }, [user, loading, router, isDemo]);

  useEffect(() => {
    if (isDemo) {
      setPlayers(DEMO_PLAYERS);
      setLoadingData(false);
      return;
    }
    if (!user) return;
    getPlayers(user.uid)
      .then(setPlayers)
      .catch(err => console.error('map load error:', err))
      .finally(() => setLoadingData(false));
  }, [user, isDemo]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (leafletRef.current.map) return;
    (async () => {
      const L = (await import('leaflet')).default;
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const map = L.map(mapRef.current!).setView([40.0, -3.5], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      leafletRef.current.map = map;
    })();
    return () => {
      if (leafletRef.current.map) { leafletRef.current.map.remove(); leafletRef.current.map = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !leafletRef.current.map) return;
    (async () => {
      const L = (await import('leaflet')).default;
      const { map, markers } = leafletRef.current;
      if (!map) return;
      markers.forEach(m => map.removeLayer(m));
      leafletRef.current.markers = [];

      type Group = { coords: [number, number]; players: Player[]; cityName: string };
      const groups: Record<string, Group> = {};

      players.forEach(p => {
        const city = (filterMode === 'city' ? p.city : p.club) || p.city || '';
        if (!city) return;
        const coords = resolveCoords(city);
        if (!coords) return;
        const key = coords.join(',');
        if (!groups[key]) groups[key] = { coords, players: [], cityName: city };
        groups[key].players.push(p);
      });

      let totalMapped = 0;
      const newMarkers: L.CircleMarker[] = [];

      Object.values(groups).forEach(g => {
        const n = g.players.length;
        totalMapped += n;
        const radius = Math.min(22, 8 + n * 3);
        const mainColor = STATUS_COLORS[g.players[0].status] || '#94A3B8';

        const circle = L.circleMarker(g.coords, {
          radius, fillColor: mainColor, color: '#0B0F1A', weight: 2.5,
          opacity: 1, fillOpacity: 0.88,
        }).addTo(map);

        const popupHtml = `
          <div style="font-family:system-ui;min-width:180px;font-size:13px;line-height:1.5">
            <div style="font-weight:700;margin-bottom:8px;text-transform:capitalize;font-size:14px">
              ${g.cityName} <span style="color:#64748b;font-weight:400;font-size:12px">(${n})</span>
            </div>
            ${g.players.map(p => `
              <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #f1f5f9">
                <span style="width:8px;height:8px;border-radius:50%;background:${STATUS_COLORS[p.status] || '#94A3B8'};flex-shrink:0;display:inline-block"></span>
                <span style="font-weight:600;font-size:12px">${p.name}</span>
                <span style="color:#64748b;margin-left:auto;font-size:11px">${p.position}</span>
              </div>
            `).join('')}
          </div>`;

        circle.bindPopup(popupHtml);
        newMarkers.push(circle);
      });

      leafletRef.current.markers = newMarkers;
      if (newMarkers.length > 0) {
        map.fitBounds(L.featureGroup(newMarkers).getBounds().pad(0.15));
      }

      const unmapped = players.filter(p => {
        const city = (filterMode === 'city' ? p.city : p.club) || p.city || '';
        return !city || !resolveCoords(city);
      }).length;

      setStats({ mapped: totalMapped, locations: Object.keys(groups).length, unmapped });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, filterMode]);

  if (loading || loadingData) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#475569' }}>Cargando…</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0B0F1A' }}>
      <AppNav activePage="map" />

      {/* ── Hero band ── */}
      <div style={{
        background: '#0B0F1A',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        position: 'relative', overflow: 'hidden',
        paddingTop: '7rem', paddingBottom: '3.5rem',
        paddingLeft: '1.5rem', paddingRight: '1.5rem',
      }}>
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--purple-2)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem', fontFamily: 'var(--font-body)' }}>Geolocalización</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
              Mapa de jugadores
            </h1>
            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value as 'city' | 'club_city')}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '9px', padding: '0.55rem 0.875rem', color: 'white',
                fontSize: '0.8rem', cursor: 'pointer', outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            >
              <option value="city">Localidad del jugador</option>
              <option value="club_city">Localidad del club</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'En mapa', value: stats.mapped, color: '#A78BFA' },
              { label: 'Localidades', value: stats.locations, color: 'white' },
              { label: 'Sin lugar', value: stats.unmapped, color: '#F59E0B' },
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
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0' }}>
        {/* Map container */}
        <div style={{
          borderRadius: '14px', overflow: 'hidden',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '1.25rem',
          height: 520, position: 'relative', zIndex: 1,
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Legend */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', alignItems: 'start' }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB',
            borderRadius: '12px', padding: '1rem 1.25rem',
            display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center',
          }}>
            <span style={{ color: '#6B7280', fontSize: '0.69rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Estado
            </span>
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[k] }} />
                <span style={{ color: '#374151', fontSize: '0.8rem' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
