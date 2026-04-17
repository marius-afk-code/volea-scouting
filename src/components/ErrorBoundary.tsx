'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{
          minHeight: '100vh',
          background: '#0B0F1A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
        }}>
          <div style={{
            background: '#141928',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-heading, system-ui)',
            }}>
              Algo salió mal
            </h1>
            <p style={{
              color: '#94A3B8',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-body, system-ui)',
            }}>
              Se produjo un error inesperado. Por favor, recarga la página. Si el problema persiste, contacta con soporte.
            </p>
            {this.state.message && (
              <p style={{
                color: '#F87171',
                fontSize: '0.75rem',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                marginBottom: '1.5rem',
                fontFamily: 'monospace',
                textAlign: 'left',
              }}>
                {this.state.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#7C3AED',
                color: 'white',
                border: 'none',
                padding: '0.625rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body, system-ui)',
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              }}
            >
              Recargar página
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
