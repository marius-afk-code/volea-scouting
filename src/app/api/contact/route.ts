import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { nombre, email, telefono, mensaje } = await req.json();

  if (!nombre?.trim() || !email?.trim() || !mensaje?.trim()) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'noreply@voleatalentsport.com',
    to: 'hola@voleatalentsport.com',
    replyTo: email,
    subject: `Nueva solicitud de acceso — ${nombre}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px">
        <div style="background:#060c18;border-radius:10px;padding:24px;margin-bottom:24px">
          <p style="color:#a78bfa;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 6px">Volea Scouting</p>
          <h1 style="color:#e2e8f0;font-size:20px;margin:0">Nueva solicitud de acceso</h1>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:120px;vertical-align:top">Nombre</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600">${escHtml(nombre)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;vertical-align:top">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:13px"><a href="mailto:${escHtml(email)}" style="color:#7c3aed">${escHtml(email)}</a></td>
          </tr>
          ${telefono?.trim() ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;vertical-align:top">Teléfono</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px">${escHtml(telefono)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:10px 0;color:#6b7280;font-size:13px;vertical-align:top">Mensaje</td>
            <td style="padding:10px 0;color:#111827;font-size:13px;line-height:1.6;white-space:pre-wrap">${escHtml(mensaje)}</td>
          </tr>
        </table>
        <p style="color:#9ca3af;font-size:11px;margin-top:24px">Enviado desde el formulario de solicitud de acceso de <a href="https://voleatalentsport.com" style="color:#7c3aed">voleatalentsport.com</a></p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Error al enviar el email.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
