'use client';

import { useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_CHOICE,
  generateTheme,
  type GeneratorChoice,
} from '@/lib/theme-generator';
import {
  DEFAULT_THEME,
  themeItemNameOf,
  themeOf,
  type ThemeDefinition,
  type ThemeName,
} from '@/lib/themes';

import { ThemeDetails } from './theme-details';
import { ThemeGallery } from './theme-gallery';
import { ThemeGeneratorPanel } from './theme-generator-panel';
import { ThemePreview } from './theme-preview';
import { CUSTOM_SCOPE, scopeCssOf } from './theme-scope';
import {
  choiceFromSearch,
  shareUrlOf,
  useAddressSearch,
  useOrigin,
} from './theme-share';

type Source = 'gallery' | 'generator';

export type ThemeCodeBlock = {
  name: ThemeName;
  block: ReactNode;
};

function sourceOfAddress(addressChoice: GeneratorChoice | null): Source {
  if (addressChoice === null) {
    return 'gallery';
  }
  return 'generator';
}

function previewScopeOf(source: Source, theme: ThemeDefinition) {
  if (source === 'generator') {
    return CUSTOM_SCOPE;
  }
  return theme.name;
}

function previewNameOf(source: Source, theme: ThemeDefinition) {
  if (source === 'generator') {
    return 'custom theme';
  }
  return themeItemNameOf(theme.name);
}

function galleryValueOf(source: Source, pickedName: ThemeName) {
  if (source === 'generator') {
    return null;
  }
  return pickedName;
}

function codeBlockOf(codeBlocks: readonly ThemeCodeBlock[], name: ThemeName) {
  const entry = codeBlocks.find((candidate) => candidate.name === name);
  if (!entry) {
    return null;
  }
  return entry.block;
}

type ThemesWorkbenchProps = {
  /** One highlighted stylesheet per theme, made on the server. */
  codeBlocks: readonly ThemeCodeBlock[];
};

const SECTION_TITLE = 'text-base font-semibold';

const SECTION_LEAD = 'text-muted-foreground text-[13px]';

/** The gallery, the preview and the generator share one preview: it follows whichever of the two was touched last. */
export function ThemesWorkbench({ codeBlocks }: ThemesWorkbenchProps) {
  const search = useAddressSearch();
  const origin = useOrigin();
  const addressChoice = useMemo(() => choiceFromSearch(search), [search]);
  const [pickedName, setPickedName] = useState<ThemeName>(DEFAULT_THEME);
  const [editedChoice, setEditedChoice] = useState<GeneratorChoice | null>(
    null
  );
  const [touchedSource, setTouchedSource] = useState<Source | null>(null);

  const choice = editedChoice ?? addressChoice ?? DEFAULT_CHOICE;
  const source = touchedSource ?? sourceOfAddress(addressChoice);
  const generated = useMemo(() => generateTheme(choice), [choice]);
  const pickedTheme = themeOf(pickedName);
  const shareUrl = shareUrlOf(origin, generated.choice);
  const customCss = scopeCssOf(
    CUSTOM_SCOPE,
    generated.light,
    generated.dark,
    generated.choice.radius
  );

  function pickTheme(name: ThemeName) {
    setPickedName(name);
    setTouchedSource('gallery');
  }

  function changeChoice(next: GeneratorChoice) {
    setEditedChoice(next);
    setTouchedSource('generator');
  }

  return (
    <>
      <style>{customCss}</style>
      <div className='grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start'>
        <section
          aria-labelledby='themes-gallery-title'
          className='flex flex-col gap-5 lg:col-start-1 lg:row-start-1'
        >
          <div className='flex flex-col gap-1'>
            <h2 id='themes-gallery-title' className={SECTION_TITLE}>
              Pick a theme
            </h2>
            <p className={SECTION_LEAD}>
              The preview takes its colours. Each one installs with a single
              command and changes colour only.
            </p>
          </div>
          <ThemeGallery
            pickedName={galleryValueOf(source, pickedName)}
            onPick={pickTheme}
          />
        </section>
        <ThemePreview
          scope={previewScopeOf(source, pickedTheme)}
          name={previewNameOf(source, pickedTheme)}
          className='lg:sticky lg:top-20 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto'
        />
        <div className='lg:col-start-1 lg:row-start-2'>
          <ThemeDetails
            theme={pickedTheme}
            codeBlock={codeBlockOf(codeBlocks, pickedName)}
          />
        </div>
        <section
          id='generator'
          aria-labelledby='themes-generator-title'
          className='flex scroll-mt-20 flex-col gap-5 lg:col-start-1 lg:row-start-3'
        >
          <div className='flex flex-col gap-1'>
            <h2 id='themes-generator-title' className={SECTION_TITLE}>
              Make your own
            </h2>
            <p className={SECTION_LEAD}>
              Choose a hue, a neutral family and a radius. A lightness moves
              only as far as a pair needs to stay readable, and the result is a
              stylesheet to paste or a link to share.
            </p>
          </div>
          <ThemeGeneratorPanel
            choice={generated.choice}
            theme={generated}
            shareUrl={shareUrl}
            onChange={changeChoice}
          />
        </section>
      </div>
    </>
  );
}
