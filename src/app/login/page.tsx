'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/app');
    } catch (err: any) {
      setError(err.code + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#05060D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(212,175,55,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,175,55,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Login card */}
      <div
        className="mm-fade-up"
        style={{
          position: 'relative',
          backgroundColor: '#0C0E19',
          borderRadius: '16px',
          padding: '2.75rem 2.5rem',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 0 0 1px rgba(212,175,55,0.06), 0 32px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Gold top accent on card */}
        <div style={{
          position: 'absolute',
          top: 0, left: '10%', right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
          borderRadius: '0 0 2px 2px',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-volea-icon.png"
            alt="Volea Scouting"
            height={48}
            width={48}
            style={{ margin: '0 auto 1.25rem', display: 'block', objectFit: 'contain' }}
          />

          <div style={{
            fontFamily: "'Syne', var(--font-heading), sans-serif",
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#EFF6FF',
            letterSpacing: '-0.01em',
            marginBottom: '0.35rem',
          }}>
            VOLEA <span style={{ color: '#D4AF37' }}>SCOUTING</span>
          </div>
          <p style={{
            color: '#1E2A38',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Accede a tu cuenta
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              color: '#243040',
              fontSize: '0.67rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'block',
              marginBottom: '0.4rem',
              fontFamily: 'var(--font-body)',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="scout@club.com"
              style={{
                width: '100%',
                backgroundColor: '#070811',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '0.7rem 1rem',
                color: '#EFF6FF',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.06)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{
              color: '#243040',
              fontSize: '0.67rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'block',
              marginBottom: '0.4rem',
              fontFamily: 'var(--font-body)',
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%',
                backgroundColor: '#070811',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '0.7rem 1rem',
                color: '#EFF6FF',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.06)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#F87171',
              fontSize: '0.78rem',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              padding: '0.5rem 0.75rem',
              background: 'rgba(248,113,113,0.06)',
              borderRadius: '6px',
              border: '1px solid rgba(248,113,113,0.15)',
            }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              background: loading
                ? 'rgba(124,58,237,0.5)'
                : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: 'white',
              border: 'none',
              padding: '0.8rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.25rem',
              fontFamily: "'Syne', var(--font-heading), sans-serif",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.3)',
              transition: 'box-shadow 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          alignItems: 'center',
        }}>
          <div style={{ width: '20px', height: '1px', background: 'rgba(212,175,55,0.15)' }} />
          <span style={{
            color: '#0F1822',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Volea Scouting
          </span>
          <div style={{ width: '20px', height: '1px', background: 'rgba(212,175,55,0.15)' }} />
        </div>
      </div>
    </main>
  );
}
