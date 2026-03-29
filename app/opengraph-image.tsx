// app/opengraph-image.tsx
// Generates the 1200×630 Open Graph image for social sharing previews.
// Next.js serves this as /opengraph-image.png and injects og:image meta tags.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Knicks Hub — New York Knicks Fan Dashboard';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#080C14',
          padding: '80px 96px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background radial glow — blue */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-80px',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(0,107,182,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Background radial glow — orange */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-60px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(245,132,38,0.12) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '6px',
            background: 'linear-gradient(90deg, #006BB6 0%, #F58426 100%)',
            display: 'flex',
          }}
        />

        {/* KH monogram — large decorative right side */}
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '0px',
            opacity: 0.08,
          }}
        >
          <span
            style={{
              color: '#006BB6',
              fontSize: '480px',
              fontWeight: 900,
              fontFamily: 'Arial Black, Arial, sans-serif',
              lineHeight: 1,
              letterSpacing: '-20px',
            }}
          >
            K
          </span>
          <span
            style={{
              color: '#F58426',
              fontSize: '480px',
              fontWeight: 900,
              fontFamily: 'Arial Black, Arial, sans-serif',
              lineHeight: 1,
              letterSpacing: '-20px',
            }}
          >
            H
          </span>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', zIndex: 1 }}>

          {/* Section label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: '#F58426',
                borderRadius: '2px',
                display: 'flex',
              }}
            />
            <span
              style={{
                color: '#F58426',
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '6px',
                textTransform: 'uppercase',
              }}
            >
              FAN DASHBOARD
            </span>
          </div>

          {/* Main title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <span
              style={{
                color: '#FFFFFF',
                fontSize: '148px',
                fontWeight: 900,
                fontFamily: 'Arial Black, Arial, sans-serif',
                lineHeight: 0.9,
                letterSpacing: '-4px',
              }}
            >
              KNICKS
            </span>
            <span
              style={{
                color: '#F58426',
                fontSize: '148px',
                fontWeight: 900,
                fontFamily: 'Arial Black, Arial, sans-serif',
                lineHeight: 0.9,
                letterSpacing: '-4px',
              }}
            >
              HUB
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '80px',
              height: '3px',
              backgroundColor: '#006BB6',
              borderRadius: '2px',
              marginTop: '36px',
              marginBottom: '28px',
              display: 'flex',
            }}
          />

          {/* Description */}
          <span
            style={{
              color: 'rgba(136,153,170,0.85)',
              fontSize: '28px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
              lineHeight: 1.4,
              maxWidth: '620px',
            }}
          >
            Live standings · Schedule · Analyst Mode · Knicks News
          </span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '96px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#006BB6',
              borderRadius: '50%',
              display: 'flex',
            }}
          />
          <span
            style={{
              color: 'rgba(136,153,170,0.45)',
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '3px',
            }}
          >
            NOT AFFILIATED WITH THE NBA OR NEW YORK KNICKS
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
