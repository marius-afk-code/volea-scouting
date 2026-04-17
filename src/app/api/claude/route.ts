import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { checkLimit, incrementUsage } from '@/lib/plans';

// ─── Verificar token Firebase ──────────────────────────────────────────────

async function verifyToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Autenticación
  const userId = await verifyToken(req);
  if (!userId) {
    return NextResponse.json(
      { error: 'No autenticado. Inicia sesión para usar el análisis IA.' },
      { status: 401 }
    );
  }

  // 2. Verificar plan y límite mensual de IA
  const check = await checkLimit(userId, 'aiCalls');
  if (!check.allowed) {
    return NextResponse.json(
      {
        error: 'Has alcanzado el límite mensual de análisis IA de tu plan.',
        used: check.used,
        limit: check.limit,
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  // 3. Validar API key de Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY no configurada' },
      { status: 500 }
    );
  }

  // 4. Parsear cuerpo
  let body: { prompt?: string; system?: string; maxTokens?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido en el cuerpo' }, { status: 400 });
  }

  const { prompt, system, maxTokens = 512 } = body;
  if (!prompt) {
    return NextResponse.json({ error: 'El campo prompt es obligatorio' }, { status: 400 });
  }

  // 5. Llamar a Anthropic
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json() as {
      error?: { message: string };
      content?: Array<{ type: string; text: string }>;
    };

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // 6. Incrementar contador solo si la llamada fue exitosa
    await incrementUsage(userId, 'aiCalls');

    const text = data.content?.find(b => b.type === 'text')?.text ?? '';
    return NextResponse.json({ text, remaining: check.remaining === -1 ? null : check.remaining - 1 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
