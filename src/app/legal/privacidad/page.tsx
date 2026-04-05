import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad · Volea Scouting',
};

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.82rem', marginBottom: '3rem' }}>
          Última actualización: abril de 2025
        </p>

        <Section title="1. Responsable del tratamiento">
          <p>En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), se informa:</p>
          <ul>
            <li><strong>Responsable:</strong> Mario Martínez García</li>
            <li><strong>NIF:</strong> 23309848S</li>
            <li><strong>Domicilio:</strong> Lorca, Murcia, España</li>
            <li><strong>Correo de contacto:</strong> hola@voleatalentsport.com</li>
          </ul>
        </Section>

        <Section title="2. Datos que recogemos">
          <p>Volea Scouting puede tratar los siguientes datos personales:</p>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña (almacenada de forma segura mediante Firebase Authentication).</li>
            <li><strong>Datos profesionales:</strong> club o agencia de pertenencia, indicados voluntariamente durante el registro o en las solicitudes de acceso.</li>
            <li><strong>Datos de jugadores:</strong> nombre, posición, edad, nacionalidad y métricas de rendimiento introducidos por el usuario en la plataforma. Estos datos son de responsabilidad del usuario y deben cumplir con la normativa aplicable.</li>
            <li><strong>Datos de comunicación:</strong> mensajes enviados a través del formulario de contacto.</li>
            <li><strong>Datos de uso:</strong> información técnica anónima sobre el uso de la plataforma para mejora del servicio.</li>
          </ul>
        </Section>

        <Section title="3. Finalidad y base jurídica">
          <p>Los datos se tratan para las siguientes finalidades:</p>
          <ul>
            <li><strong>Prestación del servicio:</strong> gestionar el acceso a la plataforma y proporcionar las funcionalidades contratadas. Base jurídica: ejecución del contrato (art. 6.1.b RGPD).</li>
            <li><strong>Comunicaciones:</strong> responder a consultas y solicitudes de acceso. Base jurídica: interés legítimo (art. 6.1.f RGPD).</li>
            <li><strong>Mejora del servicio:</strong> análisis agregado y anónimo del uso de la plataforma. Base jurídica: interés legítimo (art. 6.1.f RGPD).</li>
          </ul>
        </Section>

        <Section title="4. Conservación de los datos">
          <p>Los datos se conservarán durante el tiempo necesario para la prestación del servicio y, una vez finalizada la relación, durante los plazos legalmente establecidos para atender posibles responsabilidades.</p>
        </Section>

        <Section title="5. Destinatarios">
          <p>No se ceden datos a terceros con fines comerciales. Los datos pueden ser accedidos por los siguientes proveedores de servicios que actúan como encargados del tratamiento:</p>
          <ul>
            <li><strong>Google Firebase</strong> (autenticación y base de datos): Google LLC, con garantías adecuadas de transferencia internacional según las cláusulas contractuales tipo de la UE.</li>
            <li><strong>Vercel</strong> (alojamiento web): Vercel Inc., con garantías equivalentes.</li>
          </ul>
        </Section>

        <Section title="6. Derechos del interesado">
          <p>Puedes ejercer los siguientes derechos en cualquier momento enviando un correo a <strong>hola@voleatalentsport.com</strong> con copia de tu documento de identidad:</p>
          <ul>
            <li>Derecho de <strong>acceso</strong> a tus datos personales.</li>
            <li>Derecho de <strong>rectificación</strong> de datos inexactos.</li>
            <li>Derecho de <strong>supresión</strong> («derecho al olvido»).</li>
            <li>Derecho de <strong>portabilidad</strong> de los datos.</li>
            <li>Derecho de <strong>oposición</strong> al tratamiento.</li>
            <li>Derecho a <strong>limitar</strong> el tratamiento.</li>
          </ul>
          <p>Si consideras que el tratamiento no se ajusta a la normativa, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).</p>
        </Section>

        <Section title="7. Seguridad">
          <p>Volea Scouting aplica medidas técnicas y organizativas adecuadas para garantizar la seguridad de los datos, incluido el cifrado en tránsito (HTTPS) y el uso de servicios de autenticación segura.</p>
        </Section>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/legal/aviso-legal" style={{ color: '#D4AF37', fontSize: '0.82rem', textDecoration: 'none' }}>Aviso legal</Link>
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
