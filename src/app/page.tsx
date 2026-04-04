'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Feature cards data ────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '👥',
    title: 'Base de jugadores',
    desc: 'Ficha completa por jugador: métricas técnicas, táctica, físico y actitud. Seguimiento estructurado en una sola vista.',
  },
  {
    icon: '📋',
    title: 'Scout Log',
    desc: 'Registra cada partido observado con valoración, notas y fecha. Historial cronológico accesible al instante.',
  },
  {
    icon: '📄',
    title: 'Informes PDF',
    desc: 'Genera informes de scouting profesionales en un clic. Listos para presentar a cuerpo técnico y dirección deportiva.',
  },
  {
    icon: '🎯',
    title: 'Radar de métricas',
    desc: 'Visualización SVG con radar cuadridimensional: técnica, táctica, físico y actitud. Perfil visual inmediato.',
  },
  {
    icon: '🗺️',
    title: 'Mapa de España',
    desc: 'Geolocaliza tu base de jugadores sobre mapa interactivo. Filtra por estado y detecta zonas de captación prioritarias.',
  },
  {
    icon: '⚖️',
    title: 'Comparador',
    desc: 'Contrasta dos jugadores en paralelo sobre radar, barras y tabla. Soporte de recomendación con IA integrada.',
  },
];

// ─── Steps data ────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'Crea tu base de jugadores',
    desc: 'Importa o añade jugadores manualmente con posición, club, categoría y métricas de evaluación del scout.',
  },
  {
    num: '02',
    title: 'Registra cada visita',
    desc: 'Anota cada partido observado: fecha, rival, valoración de 1-10 y notas técnicas en segundos desde cualquier dispositivo.',
  },
  {
    num: '03',
    title: 'Analiza y decide',
    desc: 'Genera informes, activa alertas de seguimiento, compara candidatos y comparte reportes con tu staff en un enlace.',
  },
];

// ─── Pricing plans ────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Básico',
    price: 'Gratis',
    period: '',
    desc: 'Para scouts individuales que empiezan a organizar su trabajo.',
    features: ['Hasta 25 jugadores', 'Scout Log ilimitado', 'Informes PDF básicos', 'Mapa de jugadores'],
    missing: ['Comparador avanzado', 'Alertas y recordatorios'],
    cta: 'Empezar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '29€',
    period: '/mes',
    desc: 'Para scouts profesionales con seguimiento activo de plantillas completas.',
    features: ['Jugadores ilimitados', 'Scout Log ilimitado', 'Informes PDF avanzados', 'Radar y comparador', 'Alertas y recordatorios', 'Compartir informes'],
    missing: [],
    cta: 'Solicitar acceso',
    highlight: true,
  },
  {
    name: 'Agencia',
    price: '99€',
    period: '/mes',
    desc: 'Para agencias y departamentos de scouting con equipos de trabajo.',
    features: ['Todo lo de Pro', 'Múltiples usuarios', 'Acceso API', 'Soporte prioritario', 'Onboarding personalizado'],
    missing: [],
    cta: 'Contactar',
    highlight: false,
  },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: '¿Necesito conocimientos técnicos para usar Volea Scouting?',
    a: 'No. La plataforma está diseñada para scouts y directores deportivos, no para técnicos. Todo funciona desde el navegador, sin instalaciones ni configuraciones complejas.',
  },
  {
    q: '¿Los datos de mis jugadores son privados?',
    a: 'Sí, completamente. Cada cuenta tiene su propia base de datos aislada. Nadie más puede ver tus jugadores ni tus informes salvo los enlaces de compartición que tú generes explícitamente.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Por supuesto. No hay permanencia ni penalización. Puedes cancelar desde tu cuenta con un clic y seguirás teniendo acceso hasta el final del periodo ya pagado.',
  },
  {
    q: '¿Los informes PDF se pueden personalizar con el logo de mi club?',
    a: 'En el plan Agencia sí. Los informes incluyen el logo y los colores de tu organización. En los planes Básico y Pro se genera con la marca Volea Scouting.',
  },
];

// ─── FAQ Accordion item ────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: '1rem',
        }}
      >
        <span style={{ color: '#111827', fontSize: '0.95rem', fontWeight: 600 }}>{q}</span>
        <span style={{
          color: '#7C3AED',
          fontSize: '1.25rem',
          lineHeight: 1,
          flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 1.5rem 1.25rem',
          borderTop: '1px solid #F3F4F6',
          color: '#6B7280',
          fontSize: '0.9rem',
          lineHeight: 1.75,
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/app');
  }, [user, loading, router]);

  return (
    <div style={{ fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* ══════════════════════════ NAV ══════════════════════════════ */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(11,15,26,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L26 14L14 26L2 14Z" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5"/>
              <path d="M14 7L21 14L14 21L7 14Z" fill="rgba(124,58,237,0.2)" stroke="#7C3AED" strokeWidth="1.5"/>
              <text x="14" y="18" textAnchor="middle" fill="#A78BFA" fontSize="8" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">MM</text>
            </svg>
            <span style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
              MM <span style={{ color: '#7C3AED' }}>Scouting</span>
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#features" style={{ color: '#9CA3AF', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Funciones</a>
            <a href="#pricing" style={{ color: '#9CA3AF', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Precios</a>
            <a href="#faq" style={{ color: '#9CA3AF', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>FAQ</a>
            <Link href="/login" style={{
              color: '#D1D5DB', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500,
            }}>Iniciar sesión</Link>
            <Link href="/login" style={{
              background: '#7C3AED',
              color: '#FFFFFF',
              padding: '0.45rem 1.125rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 18px rgba(124,58,237,0.3)',
            }}>Solicitar acceso</Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════ HERO ══════════════════════════════ */}
      <section style={{
        background: '#0B0F1A',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '8rem 2rem 6rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Purple glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '999px',
            padding: '0.3rem 0.875rem',
            marginBottom: '2.5rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED', display: 'inline-block' }} />
            <span style={{ color: '#A78BFA', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>Plataforma profesional de scouting · v2</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.75rem, 7vw, 5rem)',
            color: '#FFFFFF',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            marginBottom: '1.5rem',
          }}>
            Scouting profesional.<br />
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>Gestión de élite.</span>
          </h1>

          {/* Subtext */}
          <p style={{
            color: '#6B7280',
            fontSize: '1.1rem',
            lineHeight: 1.75,
            maxWidth: '560px',
            margin: '0 auto 3rem',
          }}>
            La plataforma boutique que usan scouts y directores deportivos para gestionar jugadores, registrar partidos y generar informes profesionales.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              background: '#7C3AED',
              color: '#FFFFFF',
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 32px rgba(124,58,237,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              Solicitar acceso →
            </Link>
            <a href="#features" style={{
              background: 'transparent',
              color: '#FFFFFF',
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              ▶ Ver demo
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'center',
          gap: '4rem',
          padding: '1.75rem 2rem',
        }}>
          {[
            { n: '500+', l: 'Jugadores gestionados' },
            { n: '3.200+', l: 'Visitas registradas' },
            { n: '150+', l: 'Informes generados' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <p style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>{s.n}</p>
              <p style={{ color: '#4B5563', fontSize: '0.75rem', fontWeight: 500, margin: 0, letterSpacing: '0.03em' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════ FEATURES ══════════════════════════ */}
      <section id="features" style={{ background: '#FFFFFF', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#7C3AED', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Plataforma</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#111827', margin: '0 0 1rem', lineHeight: 1.15 }}>
              Todo lo que un scout profesional necesita
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              Diseñado para el flujo de trabajo real de un scout: desde el primer vistazo hasta el informe final.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '14px',
                padding: '2rem',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.25)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB';
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: '#F5F3FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}>{f.icon}</div>
                <h3 style={{ color: '#111827', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CÓMO FUNCIONA ══════════════════════════ */}
      <section style={{ background: '#F8FAFC', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <p style={{ color: '#7C3AED', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Proceso</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#111827', margin: '0 0 1rem', lineHeight: 1.15 }}>
              En marcha en menos de 5 minutos
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Sin integraciones complejas. Sin formación técnica. Solo abre, configura y empieza a scouting.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem', position: 'relative' }}>
            {/* connector line */}
            <div style={{
              position: 'absolute',
              top: '2rem',
              left: 'calc(16.66% + 1.5rem)',
              right: 'calc(16.66% + 1.5rem)',
              height: '1px',
              background: 'linear-gradient(90deg, #E5E7EB, rgba(124,58,237,0.3), #E5E7EB)',
              zIndex: 0,
            }} />

            {STEPS.map((s, i) => (
              <div key={s.num} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: i === 1 ? '#7C3AED' : '#FFFFFF',
                  border: `2px solid ${i === 1 ? '#7C3AED' : '#E5E7EB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: i === 1 ? '#FFFFFF' : '#111827',
                  marginBottom: '1.5rem',
                  boxShadow: i === 1 ? '0 0 24px rgba(124,58,237,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                }}>{s.num}</div>
                <h3 style={{ color: '#111827', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.625rem' }}>{s.title}</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ PRICING ══════════════════════════ */}
      <section id="pricing" style={{ background: '#FFFFFF', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#7C3AED', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Precios</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#111827', margin: '0 0 1rem', lineHeight: 1.15 }}>
              Elige tu plan
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
              Sin permanencia. Sin sorpresas. Cancela cuando quieras.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', alignItems: 'center' }}>
            {PLANS.map(p => (
              <div key={p.name} style={{
                background: p.highlight ? '#0B0F1A' : '#FFFFFF',
                border: `2px solid ${p.highlight ? '#7C3AED' : '#E5E7EB'}`,
                borderRadius: '16px',
                padding: '2.25rem',
                position: 'relative',
                transform: p.highlight ? 'translateY(-8px)' : 'none',
                boxShadow: p.highlight ? '0 24px 60px rgba(124,58,237,0.15)' : '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                {p.highlight && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: '#7C3AED', color: '#FFFFFF',
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                    padding: '0.25rem 0.875rem', borderRadius: '999px', textTransform: 'uppercase',
                  }}>Más popular</div>
                )}
                <h3 style={{ color: p.highlight ? '#FFFFFF' : '#111827', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{p.name}</h3>
                <p style={{ color: p.highlight ? '#6B7280' : '#9CA3AF', fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{p.desc}</p>
                <div style={{ marginBottom: '1.75rem' }}>
                  <span style={{ color: p.highlight ? '#FFFFFF' : '#111827', fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>{p.price}</span>
                  {p.period && <span style={{ color: p.highlight ? '#6B7280' : '#9CA3AF', fontSize: '0.875rem' }}>{p.period}</span>}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: p.highlight ? '#D1D5DB' : '#374151' }}>
                      <span style={{ color: '#22C55E', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {p.missing.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: p.highlight ? '#4B5563' : '#D1D5DB' }}>
                      <span style={{ flexShrink: 0, marginTop: '1px' }}>–</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/login" style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: p.highlight ? '#7C3AED' : 'transparent',
                  color: p.highlight ? '#FFFFFF' : '#374151',
                  border: p.highlight ? 'none' : '1px solid #E5E7EB',
                  boxShadow: p.highlight ? '0 0 18px rgba(124,58,237,0.25)' : 'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FAQ ══════════════════════════════ */}
      <section id="faq" style={{ background: '#F8FAFC', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#7C3AED', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>FAQ</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: '#111827', margin: 0, lineHeight: 1.2 }}>
              Preguntas frecuentes
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ CTA BAND ══════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
        padding: '5rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: '#FFFFFF', margin: '0 0 1rem', lineHeight: 1.15 }}>
          Empieza a scouting hoy
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '420px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Plan gratuito disponible. Sin tarjeta de crédito.
        </p>
        <Link href="/login" style={{
          display: 'inline-block',
          background: '#FFFFFF',
          color: '#7C3AED',
          padding: '0.9rem 2.25rem',
          borderRadius: '10px',
          fontSize: '0.95rem',
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}>Solicitar acceso gratuito →</Link>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer style={{ background: '#0B0F1A', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2L26 14L14 26L2 14Z" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5"/>
                  <path d="M14 7L21 14L14 21L7 14Z" fill="rgba(124,58,237,0.2)" stroke="#7C3AED" strokeWidth="1.5"/>
                  <text x="14" y="18" textAnchor="middle" fill="#A78BFA" fontSize="8" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">MM</text>
                </svg>
                <span style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>MM <span style={{ color: '#7C3AED' }}>Scouting</span></span>
              </div>
              <p style={{ color: '#4B5563', fontSize: '0.85rem', lineHeight: 1.75, maxWidth: '280px' }}>
                La plataforma boutique de scouting de fútbol profesional para scouts y directores deportivos.
              </p>
            </div>

            {/* Links */}
            {[
              { title: 'Plataforma', links: ['Base de jugadores', 'Scout Log', 'Informes PDF', 'Comparador'] },
              { title: 'Empresa', links: ['Acerca de', 'Blog', 'Contacto', 'Prensa'] },
              { title: 'Legal', links: ['Privacidad', 'Términos', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {col.links.map(l => (
                    <li key={l}><a href="#" style={{ color: '#6B7280', fontSize: '0.85rem', textDecoration: 'none' }}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ color: '#374151', fontSize: '0.78rem', margin: 0 }}>© 2026 Volea Scouting. Todos los derechos reservados.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              <span style={{ color: '#22C55E', fontSize: '0.72rem', fontWeight: 600 }}>Todos los sistemas operativos</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
