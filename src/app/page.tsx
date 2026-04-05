'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BarChart2, Sparkles } from 'lucide-react';

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
    a: 'Es una funcionalidad que estamos desarrollando. Durante la beta, los informes se generan con la marca Volea Scouting. Si tienes necesidades específicas de personalización, indícalo en tu solicitud de acceso.',
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
        <span style={{ color: '#111827', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}>{q}</span>
        <span style={{
          color: '#7c3aed',
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
          fontSize: '1rem',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.75,
          fontFamily: 'var(--font-body)',
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Request Access Modal ──────────────────────────────────────────────────

function RequestAccessModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error del servidor');
      setSubmitted(true);
    } catch {
      setSendError('No se pudo enviar. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(6,12,24,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1526',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.08)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', fontSize: '1.25rem', lineHeight: 1,
            padding: '0.25rem',
          }}
        >×</button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(124,58,237,0.15)',
              border: '2px solid rgba(124,58,237,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', margin: '0 auto 1.5rem',
            }}>✓</div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: '#e2e8f0',
              marginBottom: '0.75rem',
            }}>¡Solicitud enviada!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              Gracias, te contactaremos pronto.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: '2rem',
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 2rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 0 20px rgba(124,58,237,0.3)',
              }}
            >Cerrar</button>
          </div>
        ) : (
          <>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              color: '#e2e8f0',
              marginBottom: '0.5rem',
            }}>Solicitar acceso</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem', fontFamily: 'var(--font-body)' }}>
              Cuéntanos sobre tu trabajo y nos ponemos en contacto contigo.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{
                  display: 'block', marginBottom: '0.375rem',
                  color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'var(--font-body)',
                }}>Nombre *</label>
                <input
                  required
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tu nombre completo"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.7rem 0.875rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', marginBottom: '0.375rem',
                  color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'var(--font-body)',
                }}>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.7rem 0.875rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', marginBottom: '0.375rem',
                  color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'var(--font-body)',
                }}>Teléfono <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="+34 600 000 000"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.7rem 0.875rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', marginBottom: '0.375rem',
                  color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'var(--font-body)',
                }}>¿Cómo usarías Volea Scouting? *</label>
                <textarea
                  required
                  value={form.mensaje}
                  onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                  placeholder="Cuéntanos tu rol, el tipo de scouting que haces, qué necesitas..."
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.7rem 0.875rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {sendError && (
                <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)' }}>
                  {sendError}
                </p>
              )}
              <button
                type="submit"
                disabled={sending}
                style={{
                  background: sending ? '#5b21b6' : '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.875rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  boxShadow: sending ? 'none' : '0 0 24px rgba(124,58,237,0.3)',
                  marginTop: '0.25rem',
                  opacity: sending ? 0.8 : 1,
                }}
              >{sending ? 'Enviando…' : 'Enviar solicitud →'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Volea logo mark ───────────────────────────────────────────────────────

function VoleaLogoMark({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-volea-icon.png" alt="Volea" height={size} width={size} style={{ objectFit: 'contain', display: 'block' }} />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function Home() {
  const { user, loading } = useAuth();
  const { activateDemo } = useDemo();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/app');
  }, [user, loading, router]);

  return (
    <div style={{ fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {showModal && <RequestAccessModal onClose={() => setShowModal(false)} />}

      {/* ══════════════════════════ NAV ══════════════════════════════ */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(6,12,24,0.88)',
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
            <VoleaLogoMark size={48} />
            <span className="landing-nav-wordmark" style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
              Volea <span style={{ color: '#7c3aed' }}>Scouting</span>
            </span>
          </div>

          {/* Nav links */}
          <div className="landing-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#features" className="landing-nav-links" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Funciones</a>
            <a href="#acceso" className="landing-nav-links" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Acceso</a>
            <a href="#faq" className="landing-nav-links" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-body)' }}>FAQ</a>
            <Link href="/login" style={{
              color: '#e2e8f0', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-body)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.4rem 0.875rem',
              whiteSpace: 'nowrap',
            }}>Iniciar sesión</Link>
            <button onClick={() => setShowModal(true)} style={{
              background: '#7c3aed',
              color: '#FFFFFF',
              padding: '0.45rem 1.125rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 0 18px rgba(124,58,237,0.3)',
            }}>Solicitar acceso</button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════ HERO ══════════════════════════════ */}
      <section className="landing-hero" style={{
        background: '#060c18',
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
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
            <span style={{ color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>✦ Volea Scouting · Acceso por invitación</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-condensed)',
            fontSize: 'clamp(2.25rem, 6vw, 4rem)',
            fontWeight: 900,
            color: '#e2e8f0',
            lineHeight: 1,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            Scouting profesional.<br />
            <span style={{ color: 'rgba(226,232,240,0.35)' }}>Gestión de élite.</span>
          </h1>

          {/* Subtext */}
          <p style={{
            color: '#94a3b8',
            fontSize: '1.1rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.75,
            maxWidth: '560px',
            margin: '0 auto 3rem',
            fontFamily: 'var(--font-body)',
          }}>
            La plataforma boutique que usan scouts y directores deportivos para gestionar jugadores, registrar partidos y generar informes profesionales.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowModal(true)} style={{
              background: '#7c3aed',
              color: '#FFFFFF',
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 0 32px rgba(124,58,237,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              Solicitar acceso →
            </button>
            <button onClick={() => { activateDemo(); router.push('/app'); }} style={{
              background: 'transparent',
              color: '#e2e8f0',
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}>
              ▶ Ver demo
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="landing-stats" style={{
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
              <p style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>{s.n}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500, margin: 0, letterSpacing: '0.03em', fontFamily: 'var(--font-body)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════ FEATURES ══════════════════════════ */}
      <section id="features" style={{ background: '#FFFFFF', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>Plataforma</p>
            <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: '#111827', margin: '0 0 1rem', lineHeight: 1.05, letterSpacing: '0.01em' }}>
              Todo lo que un scout profesional necesita
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
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
                <h3 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>{f.title}</h3>
                <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CÓMO FUNCIONA ══════════════════════════ */}
      <section style={{ background: '#F8FAFC', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <p style={{ color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>Proceso</p>
            <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: '#111827', margin: '0 0 1rem', lineHeight: 1.05, letterSpacing: '0.01em' }}>
              En marcha en menos de 5 minutos
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
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
                  background: i === 1 ? '#7c3aed' : '#FFFFFF',
                  border: `2px solid ${i === 1 ? '#7c3aed' : '#E5E7EB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: i === 1 ? '#FFFFFF' : '#111827',
                  marginBottom: '1.5rem',
                  boxShadow: i === 1 ? '0 0 24px rgba(124,58,237,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                }}>{s.num}</div>
                <h3 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.625rem', fontFamily: 'var(--font-body)' }}>{s.title}</h3>
                <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.75, margin: 0, fontFamily: 'var(--font-body)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ ACCESO ═══════════════════════════ */}
      <section id="acceso" style={{ background: '#060c18', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ── Cabecera ── */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: '999px',
              padding: '0.3rem 1rem',
              marginBottom: '1.75rem',
            }}>
              <span style={{ color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                Beta cerrada · Plazas limitadas
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: '#e2e8f0', margin: '0 0 1rem', lineHeight: 1.05, letterSpacing: '0.01em' }}>
              Acceso a Volea Scouting
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              Plataforma de uso profesional. El acceso es por invitación.
            </p>
          </div>

          {/* ── Cards de funcionalidades ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
            {[
              { Icon: Users, title: 'Gestión de jugadores', desc: 'Base de datos completa con fotos, métricas y evolución.' },
              { Icon: BarChart2, title: 'Informes y análisis', desc: 'Radar, comparador y exportación PDF profesional.' },
              { Icon: Sparkles, title: 'Inteligencia artificial', desc: 'Informes automáticos generados por IA por jugador.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(124,58,237,0.04)',
                border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'left',
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <Icon size={28} color="#7c3aed" strokeWidth={1.75} />
                </div>
                <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>{title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* ── Proceso en 3 pasos ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem', position: 'relative' }}>
            {/* línea conectora */}
            <div style={{
              position: 'absolute', top: '1.25rem',
              left: 'calc(16.66% + 1rem)', right: 'calc(16.66% + 1rem)',
              height: '1px',
              background: 'linear-gradient(90deg, rgba(124,58,237,0.2), rgba(124,58,237,0.5), rgba(124,58,237,0.2))',
            }} />
            {[
              { num: '01', title: 'Solicitas acceso', desc: 'Rellenas el formulario con tu perfil profesional.' },
              { num: '02', title: 'Revisamos tu solicitud', desc: 'Evaluamos cada perfil individualmente en 24–48h.' },
              { num: '03', title: 'Accedes a la plataforma', desc: 'Recibes tus credenciales y soporte directo desde el primer día.' },
            ].map((step, i) => (
              <div key={step.num} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                  background: i === 1 ? '#7c3aed' : 'rgba(124,58,237,0.1)',
                  border: `1px solid ${i === 1 ? '#7c3aed' : 'rgba(124,58,237,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                  boxShadow: i === 1 ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
                }}>
                  <span style={{ color: i === 1 ? '#fff' : '#a78bfa', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>{step.num}</span>
                </div>
                <h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>{step.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* ── CTA final ── */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontStyle: 'italic', fontFamily: 'var(--font-body)', maxWidth: '560px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
              "Los beta testers tienen acceso completo a todas las funcionalidades y participan activamente en el desarrollo del producto."
            </p>
            <button onClick={() => setShowModal(true)} style={{
              background: '#7c3aed',
              color: '#FFFFFF',
              padding: '0.875rem 2.5rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 900,
              fontFamily: 'var(--font-condensed)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 32px rgba(124,58,237,0.25)',
              display: 'block',
              margin: '0 auto 1rem',
            }}>
              Solicitar acceso
            </button>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, margin: 0, fontFamily: 'var(--font-body)' }}>
              Cada solicitud es revisada manualmente. Respondemos en 24–48h.
            </p>
          </div>

        </div>
      </section>

      {/* ══════════════════════════ FAQ ══════════════════════════════ */}
      <section id="faq" style={{ background: '#F8FAFC', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>FAQ</p>
            <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: '#111827', margin: 0, lineHeight: 1.05, letterSpacing: '0.01em' }}>
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
        background: 'linear-gradient(135deg, #7c3aed, #5B21B6)',
        padding: '5rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: '#FFFFFF', margin: '0 0 1rem', lineHeight: 1.05, letterSpacing: '0.01em' }}>
          Empieza a scouting hoy
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '420px', margin: '0 auto 2.5rem', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
          Plan gratuito disponible. Sin tarjeta de crédito.
        </p>
        <button onClick={() => setShowModal(true)} style={{
          display: 'inline-block',
          background: '#FFFFFF',
          color: '#7c3aed',
          padding: '0.9rem 2.25rem',
          borderRadius: '10px',
          fontSize: '0.95rem',
          fontWeight: 800,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}>Solicitar acceso gratuito →</button>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer style={{ background: '#060c18', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <VoleaLogoMark size={24} />
                <span style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Volea <span style={{ color: '#7c3aed' }}>Scouting</span></span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.75, maxWidth: '280px', fontFamily: 'var(--font-body)' }}>
                La plataforma boutique de scouting de fútbol profesional para scouts y directores deportivos.
              </p>
            </div>

            {/* Producto */}
            <div>
              <h4 style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>Producto</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><a href="#features" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Funciones</a></li>
                <li><a href="#acceso" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Acceso</a></li>
                <li><a href="#faq" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>FAQ</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link href="/legal/aviso-legal" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Aviso Legal</Link></li>
                <li><Link href="/legal/privacidad" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Política de Privacidad</Link></li>
                <li><Link href="/legal/cookies" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Política de Cookies</Link></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>Contacto</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><a href="mailto:hola@voleatalentsport.com" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>hola@voleatalentsport.com</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, fontFamily: 'var(--font-body)' }}>
              © 2025 Mario Martínez García · Volea Scouting · Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
