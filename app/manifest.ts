// app/manifest.ts
// PWA web manifest — makes Knicks Hub installable on iOS and Android home screens.
// Next.js serves this as /manifest.webmanifest automatically.

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Knicks Hub',
    short_name: 'Knicks Hub',
    description: 'New York Knicks fan dashboard — live standings, schedule, and Analyst Mode',
    start_url: '/',
    display: 'standalone',
    background_color: '#080C14',
    theme_color: '#006BB6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
