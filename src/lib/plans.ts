import { adminDb } from './firebase-admin';

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'elite';

export type Feature = 'aiCalls' | 'players' | 'visitsPerPlayer' | 'pdfExports' | 'cvExports';

export interface PlanLimits {
  players: number;          // máx. jugadores en BD
  visitsPerPlayer: number;  // -1 = ilimitado
  aiCalls: number;          // análisis IA por mes
  pdfExports: number;       // PDFs por mes (-1 = ilimitado soft)
  cvExports: number;        // CVs por mes (-1 = ilimitado soft)
  alerts: boolean;
  compare: boolean;
  share: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceEur: number;
  limits: PlanLimits;
}

// ─── Definición de planes ──────────────────────────────────────────────────

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceEur: 0,
    limits: {
      players: 5,
      visitsPerPlayer: 2,
      aiCalls: 3,
      pdfExports: 0,
      cvExports: 0,
      alerts: false,
      compare: false,
      share: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceEur: 5.99,
    limits: {
      players: 25,
      visitsPerPlayer: 10,
      aiCalls: 10,
      pdfExports: 5,
      cvExports: 0,
      alerts: false,
      compare: false,
      share: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceEur: 9.99,
    limits: {
      players: 75,
      visitsPerPlayer: -1,
      aiCalls: 150,    // soft limit interno (marketing: ilimitado)
      pdfExports: 200, // soft limit interno
      cvExports: 100,  // soft limit interno
      alerts: true,
      compare: false,
      share: false,
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    priceEur: 19.99,
    limits: {
      players: 200,
      visitsPerPlayer: -1,
      aiCalls: 150,    // soft limit interno
      pdfExports: 200, // soft limit interno
      cvExports: 100,  // soft limit interno
      alerts: true,
      compare: true,
      share: true,
    },
  },
};

// ─── Clave del mes actual ──────────────────────────────────────────────────

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

// ─── Leer plan del usuario ─────────────────────────────────────────────────

export async function getUserPlan(userId: string): Promise<PlanId> {
  const db = adminDb();
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return 'free';
  const data = snap.data();
  const plan = data?.plan as PlanId | undefined;
  if (!plan || !(plan in PLANS)) return 'free';
  return plan;
}

// ─── Leer uso del mes actual ───────────────────────────────────────────────

interface MonthlyUsage {
  aiCalls: number;
  pdfExports: number;
  cvExports: number;
}

export async function getMonthlyUsage(userId: string): Promise<MonthlyUsage> {
  const db = adminDb();
  const month = currentMonthKey();
  const snap = await db.collection('usage').doc(userId).collection('monthly').doc(month).get();
  if (!snap.exists) return { aiCalls: 0, pdfExports: 0, cvExports: 0 };
  const d = snap.data() ?? {};
  return {
    aiCalls: d.aiCalls ?? 0,
    pdfExports: d.pdfExports ?? 0,
    cvExports: d.cvExports ?? 0,
  };
}

// ─── Incrementar contador de uso ──────────────────────────────────────────

export async function incrementUsage(userId: string, feature: 'aiCalls' | 'pdfExports' | 'cvExports'): Promise<void> {
  const db = adminDb();
  const month = currentMonthKey();
  const ref = db.collection('usage').doc(userId).collection('monthly').doc(month);
  // FieldValue.increment es atómico
  const { FieldValue } = await import('firebase-admin/firestore');
  await ref.set({ [feature]: FieldValue.increment(1) }, { merge: true });
}

// ─── Comprobar si el usuario puede usar una feature ────────────────────────

export interface LimitCheck {
  allowed: boolean;
  remaining: number; // -1 = ilimitado
  limit: number;
  used: number;
}

export async function checkLimit(userId: string, feature: 'aiCalls' | 'pdfExports' | 'cvExports'): Promise<LimitCheck> {
  const [planId, usage] = await Promise.all([getUserPlan(userId), getMonthlyUsage(userId)]);
  const limits = PLANS[planId].limits;
  const limit = limits[feature];
  const used = usage[feature];

  if (limit === 0) {
    return { allowed: false, remaining: 0, limit, used };
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1, limit, used };
  }

  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining, limit, used };
}
