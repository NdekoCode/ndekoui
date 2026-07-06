'use client';

import type { ReactNode } from 'react';

import { CopyField } from '@/app/mcp/_components/copy-field';
import CodePreview from '@/components/website/code-preview';
import { cssTextOf } from '@/lib/theme-css';
import {
  RADII,
  type GeneratedTheme,
  type GeneratorChoice,
  type Radius,
} from '@/lib/theme-generator';
import {
  GENERATOR_FAMILIES,
  NEUTRAL_FAMILIES,
  type GeneratorFamilyId,
} from '@/lib/theme-neutrals';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { SHORT_CODE } from './code-surface';
import { ContrastTable } from './contrast-table';
import { CssLines } from './css-lines';
import { HueSlider } from './hue-slider';
import { ThemeMiniature } from './theme-miniature';
import { CUSTOM_SCOPE } from './theme-scope';

function radiusLabelOf(radius: Radius) {
  if (radius === '0rem') {
    return '0';
  }
  return radius;
}

const NEUTRAL_SEGMENTS: readonly Segment<GeneratorFamilyId>[] =
  GENERATOR_FAMILIES.map((id) => ({
    value: id,
    label: NEUTRAL_FAMILIES[id].label,
  }));

const RADIUS_SEGMENTS: readonly Segment<Radius>[] = RADII.map((radius) => ({
  value: radius,
  label: radiusLabelOf(radius),
}));

const NO_MOVE_NOTE = 'Every pair passed at its first lightness.';

function linesOf(notes: readonly string[]) {
  if (notes.length === 0) {
    return [NO_MOVE_NOTE];
  }
  return notes;
}

type ControlRowProps = {
  label: string;
  value?: string;
  children: ReactNode;
};

function ControlRow({ label, value, children }: ControlRowProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-baseline justify-between gap-3'>
        <span className='text-[13px] font-medium'>{label}</span>
        {value && (
          <span className='text-muted-foreground text-xs tabular-nums'>
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Notes({ notes }: { notes: readonly string[] }) {
  const lines = linesOf(notes);

  return (
    <ul className='text-muted-foreground flex min-w-48 flex-1 flex-col gap-1 text-xs'>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

type ThemeGeneratorPanelProps = {
  choice: GeneratorChoice;
  theme: GeneratedTheme;
  shareUrl: string;
  onChange: (choice: GeneratorChoice) => void;
};

export function ThemeGeneratorPanel({
  choice,
  theme,
  shareUrl,
  onChange,
}: ThemeGeneratorPanelProps) {
  const css = cssTextOf(theme.light, theme.dark, choice.radius);

  function changeHue(hue: number) {
    onChange({ ...choice, hue });
  }

  function changeNeutral(neutral: GeneratorFamilyId) {
    onChange({ ...choice, neutral });
  }

  function changeRadius(radius: Radius) {
    onChange({ ...choice, radius });
  }

  return (
    <div className='bg-foreground/[0.025] rounded-2xl p-1.5'>
      <div className='bg-card hairline-ring ring-border flex flex-col gap-6 rounded-[calc(var(--radius-2xl)-0.375rem)] p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-5'>
        <div className='flex flex-col gap-5'>
          <ControlRow label='Hue' value={`${choice.hue}°`}>
            <HueSlider hue={choice.hue} onHueChange={changeHue} />
          </ControlRow>
          <ControlRow label='Neutral family'>
            <Segments
              value={choice.neutral}
              segments={NEUTRAL_SEGMENTS}
              onValueChange={changeNeutral}
              label='Neutral family'
              className='w-full sm:w-64'
            />
          </ControlRow>
          <ControlRow label='Radius'>
            <Segments
              value={choice.radius}
              segments={RADIUS_SEGMENTS}
              onValueChange={changeRadius}
              label='Radius'
              className='w-full sm:w-80'
            />
          </ControlRow>
        </div>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-start gap-x-4 gap-y-3'>
            <ThemeMiniature scope={CUSTOM_SCOPE} className='w-32 shrink-0' />
            <Notes notes={theme.notes} />
          </div>
          <ContrastTable checks={theme.checks} />
        </div>
        <div className='flex flex-col gap-5'>
          <ControlRow label='Stylesheet'>
            <div className={SHORT_CODE}>
              <CodePreview code={css}>
                <CssLines css={css} />
              </CodePreview>
            </div>
            <p className='text-muted-foreground text-xs'>
              Paste it after the ndekoui theme in your stylesheet.
            </p>
          </ControlRow>
          <ControlRow label='Link to this theme'>
            <CopyField value={shareUrl} label='Copy the link to this theme' />
          </ControlRow>
        </div>
      </div>
    </div>
  );
}
