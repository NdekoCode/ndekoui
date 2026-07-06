'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  DownloadIcon,
  LoaderCircleIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

export const REPORT_SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

const FIRST_LOAD_MS = 900;

const UPDATE_MS = 450;

const EXPORTED_NOTICE_MS = 1600;

const FORMULA_PREFIXES = ['=', '+', '-', '@'];

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const NOTE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const NOTE_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const NOTE_VARIANTS: Variants = {
  enter: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: NOTE_IN },
  exit: { opacity: 0, transition: NOTE_OUT },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: NOTE_IN },
  exit: { opacity: 0, transition: NOTE_OUT },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function noteVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return NOTE_VARIANTS;
}

function loadDelayOf(isFirstLoad: boolean) {
  if (isFirstLoad) {
    return FIRST_LOAD_MS;
  }
  return UPDATE_MS;
}

function loadedKeyOf<Query>(
  loaded: Query | null,
  keyOf: (query: Query) => string
) {
  if (loaded === null) {
    return null;
  }
  return keyOf(loaded);
}

/**
 * Stands in for a request: the first load shows a skeleton, a later change keeps the
 * previous result on screen until the next one arrives.
 */
export function useSimulatedLoad<Query>(
  initialQuery: Query,
  keyOf: (query: Query) => string
) {
  const [requested, setRequested] = useState(initialQuery);
  const [loaded, setLoaded] = useState<Query | null>(null);
  const isFirstLoad = loaded === null;
  const delay = loadDelayOf(isFirstLoad);
  const requestedKey = keyOf(requested);
  const loadedKey = loadedKeyOf(loaded, keyOf);
  const isUpdating = loadedKey !== null && loadedKey !== requestedKey;

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(requested), delay);
    return () => window.clearTimeout(timer);
  }, [requested, delay]);

  return { requested, loaded, isFirstLoad, isUpdating, request: setRequested };
}

export type PeriodOption<Id extends string> = { id: Id; label: string };

type ReportToolbarProps = {
  title: string;
  meta: string;
  children?: React.ReactNode;
};

export function ReportToolbar({ title, meta, children }: ReportToolbarProps) {
  return (
    <div className='hairline-b border-border flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6'>
      <div className='flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5'>
        <h1 className='truncate text-lg font-semibold text-balance'>{title}</h1>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {meta}
        </span>
      </div>
      <div className='ml-auto flex items-center gap-2'>{children}</div>
    </div>
  );
}

function UpdatingNote({ isUpdating }: { isUpdating: boolean }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = noteVariantsOf(shouldReduceMotion);

  return (
    <span role='status' className='text-muted-foreground flex text-xs'>
      <AnimatePresence initial={false}>
        {isUpdating && (
          <motion.span
            key='updating'
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            className='flex items-center gap-1.5'
          >
            <LoaderCircleIcon className='size-3.5 animate-spin' />
            Updating
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

type PeriodSwitchProps<Id extends string> = {
  label: string;
  options: PeriodOption<Id>[];
  value: Id;
  isUpdating: boolean;
  onValueChange: (id: Id) => void;
};

export function PeriodSwitch<Id extends string>({
  label,
  options,
  value,
  isUpdating,
  onValueChange,
}: PeriodSwitchProps<Id>) {
  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.id === nextValue);
    if (option) {
      onValueChange(option.id);
    }
  }

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      <Tabs value={value} onValueChange={changeValue}>
        <TabsList variant='segmented' aria-label={label}>
          {options.map((option) => (
            <TabsTab key={option.id} value={option.id}>
              {option.label}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
      <UpdatingNote isUpdating={isUpdating} />
    </div>
  );
}

function exportGlyphOf(isExported: boolean) {
  if (isExported) {
    return { key: 'exported', icon: <CheckIcon /> };
  }
  return { key: 'export', icon: <DownloadIcon /> };
}

function exportLabelOf(isExported: boolean) {
  if (isExported) {
    return 'Downloaded';
  }
  return 'Export CSV';
}

type ExportButtonProps = {
  disabled?: boolean;
  onExport: () => void;
};

export function ExportButton({ disabled, onExport }: ExportButtonProps) {
  const [isExported, setIsExported] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const glyph = exportGlyphOf(isExported);
  const label = exportLabelOf(isExported);

  useEffect(() => {
    if (!isExported) {
      return;
    }
    const timer = window.setTimeout(
      () => setIsExported(false),
      EXPORTED_NOTICE_MS
    );
    return () => window.clearTimeout(timer);
  }, [isExported]);

  function exportReport() {
    onExport();
    setIsExported(true);
  }

  return (
    <Button variant='outline' disabled={disabled} onClick={exportReport}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={glyph.key}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='flex'
        >
          {glyph.icon}
        </motion.span>
      </AnimatePresence>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={label}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

/** Spreadsheet apps run a cell that starts with these characters as a formula. */
function neutralizedCellOf(value: string) {
  const startsLikeFormula = FORMULA_PREFIXES.some((prefix) =>
    value.startsWith(prefix)
  );
  if (startsLikeFormula) {
    return `'${value}`;
  }
  return value;
}

function csvCellOf(value: string) {
  const neutralized = neutralizedCellOf(value);
  const escaped = neutralized.replaceAll('"', '""');
  return `"${escaped}"`;
}

function csvLineOf(row: string[]) {
  const cells = row.map(csvCellOf);
  return cells.join(',');
}

/** Builds the file in the browser and hands it to the download bar: nothing leaves the page. */
export function downloadCsv(fileName: string, rows: string[][]) {
  const lines = rows.map(csvLineOf);
  const text = lines.join('\n');
  const file = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
