import type { Metadata } from 'next';
import { Instrument_Serif, Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { DemoProvider } from '@/contexts/DemoContext';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-heading',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Volea Scouting',
  description: 'Plataforma profesional de scouting de fútbol. Tecnología propia para scouts, agencias y clubes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${instrumentSerif.variable} ${syne.variable} ${dmSans.variable}`}>
        <DemoProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
