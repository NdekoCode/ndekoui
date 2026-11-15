'use client';

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CodeIcon,
  CommandIcon,
  MotionIcon,
  ReactBrandIcon,
} from '@/registry/ndeko/lib/icons';

type Tone = 'strong' | 'soft';

type TextPart = { kind: 'text'; text: string; tone: Tone };

type IconPart = { kind: 'icons' };

type StatementPart = TextPart | IconPart;

type Token =
  | { kind: 'word'; key: string; word: string; tone: Tone }
  | { kind: 'icons'; key: string };

type StatementProps = {
  componentPhrase: string;
  blockTotal: number;
  templateTotal: number;
};

const SCROLL_OFFSET = ['start 0.85', 'end 0.6'] as const;
const DIM_OPACITY = 0.14;

function partsOf({
  componentPhrase,
  blockTotal,
  templateTotal,
}: StatementProps): StatementPart[] {
  return [
    { kind: 'text', text: 'ndekoui is', tone: 'soft' },
    {
      kind: 'text',
      text: `a library of ${componentPhrase}, ${blockTotal} blocks and ${templateTotal} templates`,
      tone: 'strong',
    },
    { kind: 'icons' },
    {
      kind: 'text',
      text: 'for React and Tailwind CSS. Developers',
      tone: 'soft',
    },
    { kind: 'text', text: 'copy the full source,', tone: 'strong' },
    { kind: 'text', text: 'or let', tone: 'soft' },
    { kind: 'text', text: 'their AI editor pull it in', tone: 'strong' },
    { kind: 'text', text: 'through MCP. Every piece', tone: 'soft' },
    { kind: 'text', text: 'moves when its state changes,', tone: 'strong' },
    {
      kind: 'text',
      text: 'so the work left is making it yours.',
      tone: 'soft',
    },
  ];
}

function tokensOf(parts: StatementPart[]): Token[] {
  const tokens: Token[] = [];
  parts.forEach((part, partIndex) => {
    if (part.kind === 'icons') {
      tokens.push({ kind: 'icons', key: `icons-${partIndex}` });
      return;
    }
    const words = part.text.split(' ');
    words.forEach((word, wordIndex) => {
      tokens.push({
        kind: 'word',
        key: `${partIndex}-${wordIndex}`,
        word,
        tone: part.tone,
      });
    });
  });
  return tokens;
}

function toneClassOf(tone: Tone) {
  if (tone === 'strong') {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

function IconPill() {
  return (
    <span className='bg-foreground/[0.06] mx-1 inline-flex translate-y-[-0.08em] items-center gap-3 rounded-full px-4 py-2 align-middle text-[0.62em]'>
      <ReactBrandIcon className='size-[1.15em]' />
      <CodeIcon className='size-[1.15em]' />
      <MotionIcon className='size-[1.15em]' />
      <CommandIcon className='size-[1.15em]' />
    </span>
  );
}

type RevealProps = {
  token: Token;
  progress: MotionValue<number>;
  range: [number, number];
};

function RevealedToken({ token, progress, range }: RevealProps) {
  const opacity = useTransform(progress, range, [DIM_OPACITY, 1]);

  if (token.kind === 'icons') {
    return (
      <motion.span style={{ opacity }} className='inline-block'>
        <IconPill />
      </motion.span>
    );
  }

  return (
    <motion.span style={{ opacity }} className={toneClassOf(token.tone)}>
      {token.word}{' '}
    </motion.span>
  );
}

function StaticToken({ token }: { token: Token }) {
  if (token.kind === 'icons') {
    return <IconPill />;
  }
  return <span className={toneClassOf(token.tone)}>{token.word} </span>;
}

function rangeOf(index: number, total: number): [number, number] {
  const start = index / total;
  const end = (index + 1) / total;
  return [start, end];
}

const STATEMENT_TEXT =
  'mx-auto max-w-4xl text-center text-2xl leading-[1.3] font-medium text-balance sm:text-4xl lg:text-5xl lg:leading-[1.2]';

/** One paragraph about the library, lit word by word as it scrolls through the screen. */
export function Statement(props: StatementProps) {
  const sectionRef = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: [...SCROLL_OFFSET],
  });
  const tokens = tokensOf(partsOf(props));
  const total = tokens.length;

  if (prefersReducedMotion) {
    return (
      <p ref={sectionRef} className={STATEMENT_TEXT}>
        {tokens.map((token) => (
          <StaticToken key={token.key} token={token} />
        ))}
      </p>
    );
  }

  return (
    <p ref={sectionRef} className={STATEMENT_TEXT}>
      {tokens.map((token, index) => (
        <RevealedToken
          key={token.key}
          token={token}
          progress={scrollYProgress}
          range={rangeOf(index, total)}
        />
      ))}
    </p>
  );
}
