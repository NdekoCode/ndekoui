import { Fragment, type CSSProperties } from 'react';

type Tone = 'plain' | 'name' | 'soft';

/** The two tones of the site's code theme: names and punctuation in the text colour, values one step back. */
const TONE_STYLES: Record<Tone, CSSProperties> = {
  plain: { color: 'var(--shiki-foreground)' },
  name: { color: 'var(--shiki-token-function)' },
  soft: { color: 'var(--shiki-token-constant)' },
};

type Piece = {
  text: string;
  tone: Tone;
};

const DECLARATION = /^(\s*--[\w-]+)(:)(\s*)(.*)(;)$/;

const FUNCTION_VALUE = /^([\w-]+)(\(.*\))$/;

function valuePiecesOf(value: string): Piece[] {
  const match = FUNCTION_VALUE.exec(value);
  if (!match) {
    return [{ text: value, tone: 'soft' }];
  }
  return [
    { text: match[1], tone: 'name' },
    { text: match[2], tone: 'soft' },
  ];
}

function declarationPiecesOf(match: RegExpExecArray): Piece[] {
  const [, property, colon, space, value, end] = match;
  return [
    { text: property, tone: 'plain' },
    { text: colon, tone: 'soft' },
    { text: space, tone: 'soft' },
    ...valuePiecesOf(value),
    { text: end, tone: 'plain' },
  ];
}

function piecesOf(line: string): Piece[] {
  const declaration = DECLARATION.exec(line);
  if (declaration) {
    return declarationPiecesOf(declaration);
  }
  const isSelector = line.endsWith(' {');
  if (isSelector) {
    const selector = line.slice(0, -2);
    return [
      { text: selector, tone: 'name' },
      { text: ' {', tone: 'plain' },
    ];
  }
  return [{ text: line, tone: 'plain' }];
}

/** A stylesheet as code, tinted like the highlighter of the docs does it, for text that changes with every slider step. */
export function CssLines({ css }: { css: string }) {
  const lines = css.trimEnd().split('\n');

  return (
    <pre className='font-mono' style={TONE_STYLES.plain} tabIndex={0}>
      <code>
        {lines.map((line, lineIndex) => (
          <Fragment key={`${lineIndex}-${line}`}>
            <span className='line'>
              {piecesOf(line).map((piece, pieceIndex) => (
                <span key={pieceIndex} style={TONE_STYLES[piece.tone]}>
                  {piece.text}
                </span>
              ))}
            </span>
            {'\n'}
          </Fragment>
        ))}
      </code>
    </pre>
  );
}
