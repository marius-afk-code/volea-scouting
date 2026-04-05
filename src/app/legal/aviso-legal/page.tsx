import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso Legal · Volea Scouting',
};

export default function AvisoLegalPage() {
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
          Aviso Legal
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.82rem', marginBottom: '3rem' }}>
          Última actualización: abril de 2025
        </p>

        <Section title="1. Datos del titular">
          <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos del titular del sitio web:</p>
          <ul>
            <li><strong>Titular:</strong> Mario Martínez García</li>
            <li><strong>NIF:</strong> 23309848S</li>
            <li><strong>Domicilio:</strong> Lorca, Murcia, España</li>
            <li><strong>Correo electrónico:</strong> hola@voleatalentsport.com</li>
            <li><strong>Sitio web:</strong> voleascouting.com</li>
          </ul>
        </Section>

        <Section title="2. Objeto">
          <p>El presente Aviso Legal regula el acceso y uso del sitio web <strong>voleascouting.com</strong> (en adelante, «el Sitio»), titularidad de Mario Martínez García, que ofrece una plataforma de scouting de fútbol para scouts, agencias y clubes deportivos.</p>
          <p>El acceso al Sitio implica la aceptación plena y sin reservas de este Aviso Legal. El titular se reserva el derecho a modificar su contenido en cualquier momento, siendo responsabilidad del usuario revisar periódicamente las condiciones vigentes.</p>
        </Section>

        <Section title="3. Condiciones de uso">
          <p>El usuario se compromete a hacer un uso adecuado del Sitio conforme a la ley, a la moral, al orden público y a las presentes condiciones, y a no emplearlo para realizar actividades ilícitas o que puedan causar daños a terceros.</p>
          <p>Queda prohibido:</p>
          <ul>
            <li>Reproducir, distribuir o modificar los contenidos del Sitio sin autorización expresa del titular.</li>
            <li>Introducir o difundir virus informáticos o cualquier otro sistema susceptible de causar daños en el Sitio.</li>
            <li>Intentar acceder a áreas restringidas del Sitio sin autorización.</li>
          </ul>
        </Section>

        <Section title="4. Propiedad intelectual e industrial">
          <p>Todos los contenidos del Sitio (textos, imágenes, logotipos, diseño, código fuente y cualquier otro elemento) son propiedad exclusiva de Mario Martínez García o de terceros que han autorizado su uso.</p>
          <p>Queda expresamente prohibida la reproducción total o parcial de dichos contenidos sin autorización escrita previa del titular.</p>
        </Section>

        <Section title="5. Exclusión de responsabilidad">
          <p>El titular no garantiza la disponibilidad continua e ininterrumpida del Sitio y no se responsabiliza de los daños que puedan derivarse de interrupciones, errores técnicos o accesos no autorizados por parte de terceros.</p>
          <p>Los contenidos del Sitio tienen carácter meramente informativo y no constituyen asesoramiento profesional de ningún tipo.</p>
        </Section>

        <Section title="6. Legislación aplicable y jurisdicción">
          <p>Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso del Sitio, las partes se someten, con renuncia expresa a cualquier otro fuero, a los juzgados y tribunales de Lorca (Murcia), salvo que la normativa aplicable establezca otro fuero imperativo.</p>
        </Section>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/legal/privacidad" style={{ color: '#D4AF37', fontSize: '0.82rem', textDecoration: 'none' }}>Política de privacidad</Link>
          <Link href="/legal/cookies" style={{ color: '#D4AF37', fontSize: '0.82rem', textDecoration: 'none' }}>Política de cookies</Link>
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
