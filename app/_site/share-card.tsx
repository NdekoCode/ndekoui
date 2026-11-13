import { ImageResponse } from 'next/og';

import { logoDataUrl } from './logo-data-url';

/*
 * The card a link shows when it is pasted on LinkedIn, X or in a chat. Every page draws the same
 * card with its own words, so a shared link always says what it opens.
 */

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

export const SHARE_CARD_TYPE = 'image/png';

const PAGE = '#f9f9fa';
const CARD = '#ffffff';
const INK = '#18181b';
const MUTED = '#66666e';
const LINE = '#e2e2e5';
const BRAND = '#6366f1';
const BRAND_INK = '#4f46e5';

/** Past these lengths a title or a description would run into the row of shapes at the bottom. */
const TITLE_LIMIT = 56;
const DESCRIPTION_LIMIT = 140;

const ELLIPSIS = '…';

/** A comma or a colon left at the cut would sit against the ellipsis. */
const TRAILING_PUNCTUATION = /[\s,;:.]+$/;

export type ShareCardContent = {
  /** A short line above the title that names where the page sits, such as a family and an item name. */
  eyebrow?: string;
  title: string;
  description: string;
};

/** A text longer than its room is cut after its last whole word. */
export function clippedOf(text: string, limit: number) {
  if (text.length <= limit) {
    return text;
  }
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  const words = cut.slice(0, lastSpace);
  const trimmed = words.replace(TRAILING_PUNCTUATION, '');
  return `${trimmed}${ELLIPSIS}`;
}

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

function Eyebrow({ text }: { text?: string }) {
  if (!text) {
    return null;
  }
  return (
    <div style={{ fontSize: 26, fontWeight: 500, color: BRAND_INK }}>
      {text}
    </div>
  );
}

export async function shareCardOf({
  eyebrow,
  title,
  description,
}: ShareCardContent) {
  const logo = await logoDataUrl();
  const shownTitle = clippedOf(title, TITLE_LIMIT);
  const shownDescription = clippedOf(description, DESCRIPTION_LIMIT);

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
        <Eyebrow text={eyebrow} />
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {shownTitle}
        </div>
        <div style={{ fontSize: 28, color: MUTED, maxWidth: 900 }}>
          {shownDescription}
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
    SHARE_CARD_SIZE
  );
}
