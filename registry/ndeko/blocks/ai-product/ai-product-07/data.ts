export const SECTION = {
  label: 'New project',
  title: 'Start from a direction',
  lead: 'Pick the one that feels closest. It becomes a brief you can edit before anything is generated.',
};

export type DirectionId = 'paper' | 'signal' | 'harbour' | 'kasai';

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'arch';

export type FontKind = 'serif' | 'sans' | 'mono' | 'rounded';

export type Swatch = {
  name: string;
  color: string;
};

export type Direction = {
  id: DirectionId;
  name: string;
  line: string;
  /** Background, ink, accent, soft accent. They are the content of the sample, so they do not follow the theme. */
  swatches: [Swatch, Swatch, Swatch, Swatch];
  display: FontKind;
  text: FontKind;
  shapes: [ShapeKind, ShapeKind];
  keywords: [string, string, string];
};

export const DIRECTIONS: Direction[] = [
  {
    id: 'paper',
    name: 'Quiet paper',
    line: 'Warm paper, dark ink and one clay accent',
    swatches: [
      { name: 'Paper', color: 'hsl(42 38% 93%)' },
      { name: 'Ink', color: 'hsl(25 20% 16%)' },
      { name: 'Clay', color: 'hsl(14 52% 52%)' },
      { name: 'Sand', color: 'hsl(38 45% 72%)' },
    ],
    display: 'serif',
    text: 'sans',
    shapes: ['circle', 'square'],
    keywords: ['calm', 'editorial', 'warm'],
  },
  {
    id: 'signal',
    name: 'Signal',
    line: 'Night blue, chalk text and two loud accents',
    swatches: [
      { name: 'Night', color: 'hsl(230 25% 10%)' },
      { name: 'Chalk', color: 'hsl(60 15% 92%)' },
      { name: 'Volt', color: 'hsl(72 90% 55%)' },
      { name: 'Coral', color: 'hsl(8 85% 62%)' },
    ],
    display: 'mono',
    text: 'sans',
    shapes: ['triangle', 'square'],
    keywords: ['sharp', 'technical', 'fast'],
  },
  {
    id: 'harbour',
    name: 'Harbour',
    line: 'Deep water, pale foam and a bright tide',
    swatches: [
      { name: 'Deep', color: 'hsl(215 55% 22%)' },
      { name: 'Foam', color: 'hsl(200 30% 94%)' },
      { name: 'Tide', color: 'hsl(195 60% 48%)' },
      { name: 'Shell', color: 'hsl(30 70% 80%)' },
    ],
    display: 'rounded',
    text: 'sans',
    shapes: ['arch', 'circle'],
    keywords: ['open', 'friendly', 'steady'],
  },
  {
    id: 'kasai',
    name: 'Kasai cloth',
    line: 'Raffia, soot and the reds of woven cloth',
    swatches: [
      { name: 'Raffia', color: 'hsl(38 55% 82%)' },
      { name: 'Soot', color: 'hsl(20 18% 14%)' },
      { name: 'Rust', color: 'hsl(12 65% 42%)' },
      { name: 'Ochre', color: 'hsl(40 80% 50%)' },
    ],
    display: 'sans',
    text: 'serif',
    shapes: ['triangle', 'arch'],
    keywords: ['woven', 'bold', 'rooted'],
  },
];

export const FONT_LABEL: Record<FontKind, string> = {
  serif: 'Serif',
  sans: 'Sans',
  mono: 'Mono',
  rounded: 'Rounded',
};

export const FONT_CLASS: Record<FontKind, string> = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
  rounded: 'font-[ui-rounded,system-ui,sans-serif]',
};

export const RESULT_COUNT = 6;

export const RESULT_INDEXES = Array.from(
  { length: RESULT_COUNT },
  (_, index) => index
);

export const DEMO_PICK: DirectionId = 'kasai';

export const DEMO_KEYWORD = { index: 1, text: 'patterned' };

const FALLBACK_DIRECTION = DIRECTIONS[0];

export function directionOf(id: DirectionId) {
  const direction = DIRECTIONS.find((candidate) => candidate.id === id);
  return direction ?? FALLBACK_DIRECTION;
}
