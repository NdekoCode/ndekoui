export const FILE_NAME = 'hero-section.tsx';

export const FIRST_PROMPT =
  'Write a hero section for Tallis, our invoicing app';

export const SECOND_PROMPT =
  'Add a second button for the demo and say how long setup takes';

export const FIRST_REPLY =
  'Here is a first version: a title, one line of support and the main action.';

export const SECOND_REPLY =
  'Revised. The lead now says how long setup takes and a second button opens the demo.';

export type CodeLine = {
  /** Stable across versions, so a line that did not change keeps its place when a revision lands. */
  key: string;
  text: string;
};

export type DiffKind = 'same' | 'added' | 'removed';

export type DiffLine = CodeLine & { kind: DiffKind };

const OPENING: CodeLine[] = [
  { key: 'fn', text: 'export function Hero() {' },
  { key: 'return', text: '  return (' },
  {
    key: 'section',
    text: "    <section className='mx-auto max-w-3xl py-24 text-center'>",
  },
  { key: 'h1', text: "      <h1 className='text-4xl font-semibold'>" },
  { key: 'title', text: '        Invoices that chase themselves' },
  { key: 'h1-end', text: '      </h1>' },
  { key: 'p', text: "      <p className='text-muted-foreground mt-4'>" },
];

const LEAD_V1: CodeLine = {
  key: 'lead-v1',
  text: '        Tallis sends, reminds and reconciles.',
};

const LEAD_V2: CodeLine[] = [
  { key: 'lead-v2', text: '        Tallis sends, reminds and reconciles.' },
  { key: 'lead-setup', text: '        Set up in ten minutes.' },
];

const MIDDLE: CodeLine[] = [
  { key: 'p-end', text: '      </p>' },
  {
    key: 'actions',
    text: "      <div className='mt-8 flex justify-center gap-3'>",
  },
  { key: 'start', text: '        <Button>Start free</Button>' },
];

const DEMO_BUTTON: CodeLine = {
  key: 'demo',
  text: "        <Button variant='outline'>Watch the demo</Button>",
};

const CLOSING: CodeLine[] = [
  { key: 'actions-end', text: '      </div>' },
  { key: 'section-end', text: '    </section>' },
  { key: 'return-end', text: '  );' },
  { key: 'fn-end', text: '}' },
];

export const VERSIONS: Record<1 | 2, CodeLine[]> = {
  1: [...OPENING, LEAD_V1, ...MIDDLE, ...CLOSING],
  2: [...OPENING, ...LEAD_V2, ...MIDDLE, DEMO_BUTTON, ...CLOSING],
};

function sameLines(lines: CodeLine[]): DiffLine[] {
  return lines.map((line) => ({ ...line, kind: 'same' }));
}

export const CHANGES: DiffLine[] = [
  ...sameLines(OPENING),
  { ...LEAD_V1, kind: 'removed' },
  { ...LEAD_V2[0], kind: 'added' },
  { ...LEAD_V2[1], kind: 'added' },
  ...sameLines(MIDDLE),
  { ...DEMO_BUTTON, kind: 'added' },
  ...sameLines(CLOSING),
];

export function sourceOf(lines: CodeLine[]) {
  const texts = lines.map((line) => line.text);
  return texts.join('\n');
}
