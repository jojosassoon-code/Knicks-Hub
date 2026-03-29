// app/icon.tsx
// Generates the site favicon via Next.js ImageResponse.
// Next.js serves this as /icon.png and adds <link rel="icon"> to every page.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1628 0%, #080C14 100%)',
          borderRadius: '14px',
        }}
      >
        {/* Orange accent top-left corner */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '18px',
            height: '4px',
            backgroundColor: '#F58426',
            borderTopLeftRadius: '14px',
            display: 'flex',
          }}
        />
        {/* KH letters */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
          <span
            style={{
              color: '#006BB6',
              fontSize: '30px',
              fontWeight: 900,
              fontFamily: 'Arial Black, Arial, sans-serif',
              lineHeight: 1,
              letterSpacing: '-1px',
            }}
          >
            K
          </span>
          <span
            style={{
              color: '#F58426',
              fontSize: '30px',
              fontWeight: 900,
              fontFamily: 'Arial Black, Arial, sans-serif',
              lineHeight: 1,
              letterSpacing: '-1px',
            }}
          >
            H
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
