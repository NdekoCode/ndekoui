import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'pricing-01',
    title: 'Two plans with a billing switch',
    description:
      'A monthly and yearly segmented switch whose thumb travels while the digits of both prices roll to their new value, over two plans with example prices.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'pricing-02',
    title: 'One plan with a feature table',
    description:
      'A per-seat plan whose seat count and monthly total roll to their new value when changed, beside a grouped table of everything it includes.',
    files: ['index.tsx', 'feature-table.tsx', 'data.ts'],
    previewHeight: 860,
  },
  {
    name: 'pricing-03',
    title: 'Seats and usage calculator',
    description:
      'Seats and recording hours set on sliders you can drag, key through or type into, with ticks where the plan changes: a lifted marker glides to the plan that fits while every figure of the month rolls, and a seat-cap notice offers its one-click fix.',
    files: [
      'index.tsx',
      'meter-slider.tsx',
      'plan-columns.tsx',
      'estimate-card.tsx',
      'pricing-model.ts',
      'data.ts',
    ],
    previewHeight: 900,
  },
  {
    name: 'pricing-04',
    title: 'Pricing in one sentence',
    description:
      'A sentence whose number you type or drag sideways, over a log track notched wherever the cheapest plan changes: the cheapest of three plans lifts out of the row as the volume crosses a notch, while every price rolls with the hand.',
    files: [
      'index.tsx',
      'volume-sentence.tsx',
      'volume-track.tsx',
      'plan-card.tsx',
      'volume-model.ts',
      'data.ts',
    ],
    previewHeight: 860,
  },
  {
    name: 'pricing-05',
    title: 'Plan card with a pattern',
    description:
      'One plan on a solid panel inside a tray of hairline zigzags that drift while it is on screen, with a billing switch whose price rolls its digits to the yearly figure.',
    files: ['index.tsx', 'pattern-frame.tsx', 'data.ts'],
    previewHeight: 960,
  },
  {
    name: 'pricing-06',
    title: 'Plan comparison',
    description:
      'Three plans compared under a header that sticks with each price and action, where Only differences folds away every row the plans share and the rest close ranks, with one accordion per plan on narrow screens.',
    files: [
      'index.tsx',
      'comparison-table.tsx',
      'plan-accordions.tsx',
      'differences-switch.tsx',
      'cell-mark.tsx',
      'comparison.ts',
      'data.ts',
    ],
    previewHeight: 900,
  },
];
