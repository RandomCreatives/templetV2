import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { PrintDrawerProvider } from '@/components/PrintDrawerProvider';
import { StructuredData } from '@/components/StructuredData';
import { getServerEnv } from '@/lib/env';

const env = getServerEnv();

export const metadata: Metadata = {
  title: {
    default: 'Minimal Photo Archive',
    template: '%s'
  },
  description: 'A monochrome photography portfolio, archive, and fine art print shop.',
  metadataBase: new URL(env.siteUrl),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Minimal Photo Archive',
    description: 'A monochrome photography portfolio, archive, and fine art print shop.',
    url: env.siteUrl,
    siteName: 'Minimal Photo Archive',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minimal Photo Archive',
    description: 'A monochrome photography portfolio, archive, and fine art print shop.',
    images: ['/opengraph-image']
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="fixed left-3 top-3 z-[60] -translate-y-20 bg-black px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white focus:translate-y-0"
        >
          [ SKIP TO CONTENT ]
        </a>
        <PrintDrawerProvider>
          <Navigation />
          <div id="main-content">{children}</div>
        </PrintDrawerProvider>
        <StructuredData />
      </body>
    </html>
  );
}
