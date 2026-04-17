import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import type { PlanId } from '@/lib/plans';

// ─── Mapeo variant_id → plan ───────────────────────────────────────────────
// Rellena estos IDs con los variant IDs reales de tu dashboard de LemonSqueezy

const VARIANT_TO_PLAN: Record<string, PlanId> = {
  [process.env.LEMONSQUEEZY_VARIANT_STARTER ?? '']: 'starter',
  [process.env.LEMONSQUEEZY_VARIANT_PRO ?? '']: 'pro',
  [process.env.LEMONSQUEEZY_VARIANT_ELITE ?? '']: 'elite',
};

// ─── Verificar firma del webhook ───────────────────────────────────────────

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Actualizar plan en Firestore ──────────────────────────────────────────

async function setUserPlan(userId: string, plan: PlanId): Promise<void> {
  await adminDb()
    .collection('users')
    .doc(userId)
    .set({ plan }, { merge: true });
}

// ─── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[lemon/webhook] LEMONSQUEEZY_WEBHOOK_SECRET no configurado');
    return NextResponse.json({ error: 'Configuración interna incorrecta' }, { status: 500 });
  }

  // Leer cuerpo raw para verificar firma ANTES de parsear
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: {
      attributes?: {
        variant_id?: number | string;
        user_email?: string;
        status?: string;
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const event = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  const variantId = String(payload.data?.attributes?.variant_id ?? '');
  const status = payload.data?.attributes?.status;

  // userId se pasa como custom_data al crear el checkout en LemonSqueezy
  if (!userId) {
    console.warn('[lemon/webhook] Evento sin user_id en custom_data:', event);
    return NextResponse.json({ received: true });
  }

  switch (event) {
    // Pago completado / suscripción activa
    case 'order_created':
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_payment_success': {
      if (status === 'cancelled' || status === 'expired') {
        await setUserPlan(userId, 'free');
        break;
      }
      const plan = VARIANT_TO_PLAN[variantId];
      if (plan) {
        await setUserPlan(userId, plan);
      } else {
        console.warn('[lemon/webhook] variant_id desconocido:', variantId);
      }
      break;
    }

    // Suscripción cancelada o expirada → volver a free
    case 'subscription_cancelled':
    case 'subscription_expired':
    case 'subscription_paused': {
      await setUserPlan(userId, 'free');
      break;
    }

    default:
      // Evento no relevante; se ignora
      break;
  }

  return NextResponse.json({ received: true });
}
