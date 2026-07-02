import { ImageResponse } from 'next/og';

import { logoDataUrl } from './_site/logo-data-url';

export const alt =
  'ndekoui: React components that animate every change of state.';

export const size = { width: 1200, height: 630 };

export const contentType = 'image/png';

const PAGE = '#f9f9fa';
const CARD = '#ffffff';
const INK = '#18181b';
const MUTED = '#66666e';
const LINE = '#e2e2e5';
const BRAND = '#6366f1';

const FILLED_PILL = { background: BRAND, border: 'none' };

const OUTLINED_PILL = { background: CARD, border: `1px solid ${LINE}` };

function pillLookOf(filled: boolean) {
  if (filled) {
    return FILLED_PILL;
  }
  return OUTLINED_PILL;
}

function Pill({ width, filled }: { width: number; filled: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        width,
        height: 40,
        borderRadius: 999,
        ...pillLookOf(filled),
      }}
    />
  );
}

export default async function OpenGraphImage() {
  const logo = await logoDataUrl();

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 72,
        background: PAGE,
        color: INK,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={logo} width={48} height={48} alt='' />
        <div style={{ fontSize: 32, fontWeight: 600 }}>ndekoui</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          React components that animate every change of state
        </div>
        <div style={{ fontSize: 28, color: MUTED, maxWidth: 900 }}>
          Open-source primitives, components, blocks and templates, installed
          with the shadcn CLI.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Pill width={180} filled />
        <Pill width={150} filled={false} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: 64,
            height: 36,
            padding: 4,
            borderRadius: 999,
            background: BRAND,
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 28,
              height: 28,
              borderRadius: 999,
              background: CARD,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            width: 260,
            height: 40,
            borderRadius: 10,
            background: CARD,
            border: `1px solid ${LINE}`,
          }}
        />
      </div>
    </div>,
    size
  );
}
