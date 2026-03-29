// app/apple-icon.tsx
// Generates the 180×180 Apple touch icon for iOS home screen.
// Next.js serves this as /apple-icon.png and adds <link rel="apple-touch-icon">.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #0d1f3c 0%, #080C14 60%, #0a1220 100%)',
          borderRadius: '40px',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '30px',
            right: '30px',
            height: '5px',
            background: 'linear-gradient(90deg, #006BB6, #F58426)',
            borderBottomLeftRadius: '4px',
            borderBottomRightRadius: '4px',
            display: 'flex',
          }}
        />

        {/* KH monogram */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '8px' }}>
          <span
            style={{
              color: '#006BB6',
              fontSize: '82px',
              fontWeight: 900,
              fontFamily: 'Arial Black, Arial, sans-serif',
              lineHeight: 1,
              letterSpacing: '-3px',
            }}
          >
            K
          </span>
          <span
            style={{
              color: '#F58426',
              fontSize: '82px',
              fontWeight: 900,
              fontFamily: 'Arial Black, Arial, sans-serif',
              lineHeight: 1,
              letterSpacing: '-3px',
            }}
          >
            H
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            color: 'rgba(136,153,170,0.8)',
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          KNICKS HUB
        </div>

        {/* Bottom accent dot */}
        <div
          style={{
            position: 'absolute',
            bottom: '18px',
            width: '28px',
            height: '3px',
            backgroundColor: '#F58426',
            borderRadius: '2px',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
