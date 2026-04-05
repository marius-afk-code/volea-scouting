import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies · Volea Scouting',
};

export default function CookiesPage() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#05060D',
      color: '#CBD5E1',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-volea-icon.png" alt="Volea" style={{ height: 32, width: 32, objectFit: 'contain' }} />
          <span style={{
            fontFamily: 'var(--font-condensed)',
            fontWeight: 900,
            fontSize: '0.95rem',
            color: '#D4AF37',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Volea Scouting
          </span>
        </Link>
      </div>

      <div style={{
        maxWidth: '740px',
        margin: '0 auto',
        padding: '4rem 2rem 6rem',
      }}>
        <p style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Legal
        </p>
        <h1 style={{
          fontFamily: 'var(--font-condensed)',
          fontWeight: 900,
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          textTransform: 'uppercase',
          color: '#EFF6FF',
          letterSpacing: '-0.01em',
          marginBottom: '0.5rem',
        }}>
          Política de Cookies
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.82rem', marginBottom: '3rem' }}>
          Última actualización: abril de 2025
        </p>

        <Section title="1. ¿Qué son las cookies?">
          <p>Las cookies son pequeños archivos de texto que un sitio web almacena en tu dispositivo cuando lo visitas. Permiten que el sitio recuerde información sobre tu visita, como el idioma preferido y otras opciones, lo que facilita tu próxima visita y hace más útil el sitio.</p>
        </Section>

        <Section title="2. Cookies que utiliza este sitio">
          <p>Volea Scouting utiliza únicamente cookies técnicas y de sesión, estrictamente necesarias para el funcionamiento de la plataforma. No se utilizan cookies de publicidad ni de seguimiento de terceros.</p>

          <div style={{
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginTop: '0.5rem',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Th>Cookie</Th>
                  <Th>Proveedor</Th>
                  <Th>Finalidad</Th>
                  <Th>Duración</Th>
                </tr>
              </thead>
              <tbody>
                <Tr>
                  <Td><code>firebase:authUser</code></Td>
                  <Td>Firebase / Google</Td>
                  <Td>Mantener la sesión de usuario autenticado</Td>
                  <Td>Sesión</Td>
                </Tr>
                <Tr>
                  <Td><code>volea_demo</code></Td>
                  <Td>Volea Scouting</Td>
                  <Td>Recordar si el usuario está en modo demo (sessionStorage)</Td>
                  <Td>Sesión</Td>
                </Tr>
                <Tr>
                  <Td><code>__session</code></Td>
                  <Td>Firebase / Google</Td>
                  <Td>Autenticación segura en servidor</Td>
                  <Td>Sesión</Td>
                </Tr>
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.5rem' }}>
            Ninguna de estas cookies tiene finalidad publicitaria ni se usa para rastrear tu actividad fuera de la plataforma.
          </p>
        </Section>

        <Section title="3. Cookies de terceros">
          <p>El servicio de autenticación Firebase (Google LLC) puede establecer cookies técnicas propias para gestionar la sesión de forma segura. Google actúa como encargado del tratamiento bajo las cláusulas contractuales tipo de la UE. Puedes consultar la política de privacidad de Google en <span style={{ color: '#D4AF37' }}>policies.google.com</span>.</p>
        </Section>

        <Section title="4. Cómo gestionar las cookies">
          <p>Dado que únicamente se usan cookies técnicas necesarias para el funcionamiento del servicio, no es posible deshabilitarlas sin afectar al funcionamiento de la plataforma. Si no deseas aceptar estas cookies, debes abandonar el sitio.</p>
          <p>Puedes configurar tu navegador para que te notifique o bloquee las cookies en cualquier momento. Consulta la ayuda de tu navegador para más información:</p>
          <ul>
            <li>Chrome: <em>Configuración → Privacidad y seguridad → Cookies</em></li>
            <li>Firefox: <em>Opciones → Privacidad y seguridad → Cookies</em></li>
            <li>Safari: <em>Preferencias → Privacidad → Cookies</em></li>
            <li>Edge: <em>Configuración → Privacidad, búsqueda y servicios → Cookies</em></li>
          </ul>
        </Section>

        <Section title="5. Actualizaciones">
          <p>Esta política puede actualizarse en cualquier momento. Te recomendamos revisarla periódicamente. La fecha de la última actualización aparece al inicio de este documento.</p>
          <p>Para cualquier consulta sobre el uso de cookies, puedes contactarnos en <strong>hola@voleatalentsport.com</strong>.</p>
        </Section>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/legal/aviso-legal" style={{ color: '#D4AF37', fontSize: '0.82rem', textDecoration: 'none' }}>Aviso legal</Link>
          <Link href="/legal/privacidad" style={{ color: '#D4AF37', fontSize: '0.82rem', textDecoration: 'none' }}>Política de privacidad</Link>
          <Link href="/" style={{ color: '#64748B', fontSize: '0.82rem', textDecoration: 'none' }}>← Volver al inicio</Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-condensed)',
        fontWeight: 700,
        fontSize: '1.1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#EFF6FF',
        marginBottom: '0.9rem',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', lineHeight: 1.7, fontSize: '0.92rem' }}>
        {children}
      </div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '0.6rem 0.9rem',
      textAlign: 'left',
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#64748B',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{
      padding: '0.6rem 0.9rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      color: '#CBD5E1',
      verticalAlign: 'top',
    }}>
      {children}
    </td>
  );
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}
