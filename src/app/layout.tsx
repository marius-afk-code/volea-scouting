import type { Metadata } from 'next';
import { Instrument_Serif, Syne, DM_Sans, Barlow_Condensed } from 'next/font/google';
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

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-condensed',
});

export const metadata: Metadata = {
  title: 'Volea Scouting',
  description: 'Plataforma profesional de scouting de fútbol. Tecnología propia para scouts, agencias y clubes.',
  icons: {
    icon: '/logo-volea-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${instrumentSerif.variable} ${syne.variable} ${dmSans.variable} ${barlowCondensed.variable}`}>
        <DemoProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
