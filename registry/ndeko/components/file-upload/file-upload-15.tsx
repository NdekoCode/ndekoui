'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type DragEvent } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold } from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  UploadIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf, springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Progress } from '@/registry/ndeko/ui/progress';

type UploadEntry = {
  id: string;
  name: string;
  bytes: number;
  startsDone: boolean;
};

const MAX_ENTRIES = 6;
const VISIBLE_SHEETS = 3;
const TICK_MS = 200;

const DEMO_REPORT = { name: 'Q3 report.pdf', bytes: 1_240_000 };
const DEMO_PHOTO = { name: 'Team photo.png', bytes: 3_410_000 };
const DEMO_BUDGET = { name: 'Budget.xlsx', bytes: 310_000 };

function entryOf(
  name: string,
  bytes: number,
  startsDone: boolean,
  id = name
): UploadEntry {
  return { id, name, bytes, startsDone };
}

const RESTING_ENTRIES: UploadEntry[] = [
  entryOf(DEMO_REPORT.name, DEMO_REPORT.bytes, true),
  entryOf(DEMO_PHOTO.name, DEMO_PHOTO.bytes, true),
  entryOf(DEMO_BUDGET.name, DEMO_BUDGET.bytes, true),
];

const SHEET_POSES = [
  { x: 0, y: -10, rotate: 0 },
  { x: -12, y: -6, rotate: -5 },
  { x: 12, y: -4, rotate: 5 },
];

const FALL_FROM = { x: 0, y: -96, rotate: -10, opacity: 0 };

const BACK_FILL = 'bg-[color-mix(in_oklab,var(--primary)_32%,var(--card))]';

const TAB = cn('absolute start-0 top-0 h-5 w-16 rounded-t-md', BACK_FILL);

const BACK = cn(
  'absolute inset-x-0 top-3 bottom-0 rounded-lg rounded-ss-none',
  BACK_FILL
);

const SHEET =
  'bg-card hairline-ring ring-border absolute inset-x-6 bottom-3 flex h-[4.5rem] origin-bottom flex-col gap-1.5 rounded-md p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const FLAP = [
  'hairline-ring ring-primary/30 absolute inset-x-0 bottom-0 z-20 flex h-[4.75rem] origin-bottom flex-col items-start justify-end rounded-lg p-3 text-start',
  'bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))] transition-transform duration-300 ease-(--ease-out-strong)',
  '[transform:perspective(500px)_rotateX(0deg)] group-data-[tipped=true]/folder:[transform:perspective(500px)_rotateX(-24deg)]',
].join(' ');

const DROP_ZONE = [
  'hairline-border border-foreground/20 relative flex flex-col items-center gap-3 rounded-xl border-dashed px-4 pt-12 pb-4',
  'transition-[background-color,border-color] duration-200 ease-(--ease-out-strong)',
  'data-[over=true]:border-primary/50 data-[over=true]:bg-primary/[0.04]',
].join(' ');

function fileCountOf(count: number) {
  if (count === 0) {
    return 'No files yet';
  }
  if (count === 1) {
    return '1 file';
  }
  return `${count} files`;
}

function sizeLabelOf(bytes: number) {
  const megabytes = bytes / 1_000_000;
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }
  const kilobytes = Math.round(bytes / 1000);
  return `${kilobytes} KB`;
}

function kindIconOf(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
    return <FileSpreadsheetIcon className='size-4' />;
  }
  const isPicture = /\.(png|jpe?g|gif|webp|svg)$/.test(lower);
  if (isPicture) {
    return <ImageIcon className='size-4' />;
  }
  return <FileTextIcon className='size-4' />;
}

function tipOf(isTipped: boolean) {
  if (isTipped) {
    return 'true';
  }
  return 'false';
}

function overOf(isOver: boolean) {
  if (isOver) {
    return 'true';
  }
  return 'false';
}

function isFileDrag(event: DragEvent<HTMLElement>) {
  const types = Array.from(event.dataTransfer.types);
  return types.includes('Files');
}

type SheetProps = {
  entry: UploadEntry;
  slot: number;
};

function Sheet({ entry, slot }: SheetProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = springOf(shouldReduceMotion);
  const pose = SHEET_POSES[slot];

  return (
    <motion.span
      aria-hidden='true'
      className={SHEET}
      style={{ zIndex: 10 - slot }}
      initial={FALL_FROM}
      animate={{ ...pose, opacity: 1 }}
      exit={{ opacity: 0, y: 10 }}
      transition={transition}
    >
      <span className='truncate text-[10px] leading-none font-medium'>
        {entry.name}
      </span>
      <span className='bg-foreground/10 h-1 w-3/4 rounded-full' />
      <span className='bg-foreground/10 h-1 rounded-full' />
    </motion.span>
  );
}

type FolderProps = {
  entries: UploadEntry[];
  isTipped: boolean;
};

function Folder({ entries, isTipped }: FolderProps) {
  const sheetEntries = entries.slice(-VISIBLE_SHEETS);
  const lastIndex = sheetEntries.length - 1;

  return (
    <div
      aria-hidden='true'
      data-tipped={tipOf(isTipped)}
      className='group/folder relative h-28 w-40 shrink-0'
    >
      <span className={TAB} />
      <span className={BACK} />
      <AnimatePresence initial={false}>
        {sheetEntries.map((entry, index) => (
          <Sheet key={entry.id} entry={entry} slot={lastIndex - index} />
        ))}
      </AnimatePresence>
      <span className={FLAP}>
        <span className='text-[13px] font-medium'>Project files</span>
        <span className='text-foreground/70 text-xs tabular-nums'>
          {fileCountOf(entries.length)}
        </span>
      </span>
    </div>
  );
}

type UploadRowProps = {
  entry: UploadEntry;
  isRunning: boolean;
  onRemove: () => void;
};

function stepOf(name: string) {
  return 7 + (name.length % 5);
}

function startProgressOf(startsDone: boolean) {
  if (startsDone) {
    return 100;
  }
  return 0;
}

function UploadRow({ entry, isRunning, onRemove }: UploadRowProps) {
  const [progress, setProgress] = useState(startProgressOf(entry.startsDone));
  const isDone = progress >= 100;
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);

  useEffect(() => {
    if (isDone || !isRunning) {
      return;
    }
    const step = stepOf(entry.name);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + step));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [isDone, isRunning, entry.name]);

  return (
    <motion.li className='overflow-hidden' {...presence}>
      <div className='bg-foreground/[0.04] my-0.5 flex items-center gap-3 rounded-xl p-2 pe-1'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'
        >
          {kindIconOf(entry.name)}
        </span>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div className='flex items-baseline justify-between gap-2'>
            <span className='truncate text-[13px] font-medium'>
              {entry.name}
            </span>
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {sizeLabelOf(entry.bytes)}
            </span>
          </div>
          <Progress
            value={progress}
            aria-label={`Uploading ${entry.name}`}
            className='gap-0'
          />
        </div>
        <span className='text-muted-foreground flex w-8 shrink-0 justify-center text-xs tabular-nums'>
          {isDone && <CheckIcon className='text-success-foreground size-4' />}
          {!isDone && `${progress}%`}
        </span>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Remove ${entry.name}`}
          onClick={onRemove}
          className='text-muted-foreground hover:text-foreground'
        >
          <XIcon />
        </Button>
      </div>
    </motion.li>
  );
}

export default function FileUpload15() {
  const [entries, setEntries] = useState(RESTING_ENTRIES);
  const [isOver, setIsOver] = useState(false);
  const [isDemoTipped, setIsDemoTipped] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const addedCount = useRef(0);
  const isTipped = isOver || isDemoTipped;
  const isFull = entries.length >= MAX_ENTRIES;

  function addFiles(files: { name: string; bytes: number }[]) {
    const added = files.map((file) => {
      addedCount.current += 1;
      const id = `${file.name}-${addedCount.current}`;
      return entryOf(file.name, file.bytes, false, id);
    });
    setEntries((current) => [...current, ...added].slice(0, MAX_ENTRIES));
  }

  function addDemoFiles(files: { name: string; bytes: number }[]) {
    const added = files.map((file) => entryOf(file.name, file.bytes, false));
    setEntries((current) => [...current, ...added]);
    setIsDemoTipped(false);
  }

  function addFromPerson(files: File[]) {
    const mapped = files.map((file) => ({ name: file.name, bytes: file.size }));
    addFiles(mapped);
    setAnnouncement(`${fileCountOf(mapped.length)} added to the folder`);
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function enterZone(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) {
      return;
    }
    dragDepth.current += 1;
    setIsOver(true);
  }

  function leaveZone() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setIsOver(false);
    }
  }

  function overZone(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) {
      return;
    }
    event.preventDefault();
  }

  function dropOnZone(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsOver(false);
    const dropped = Array.from(event.dataTransfer.files);
    addFromPerson(dropped);
  }

  function pickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    addFromPerson(chosen);
  }

  function startOver() {
    setEntries(RESTING_ENTRIES);
    setIsDemoTipped(false);
  }

  const steps: AutoplayStep[] = [
    { after: 2600, run: () => setEntries([]) },
    { after: 900, run: () => setIsDemoTipped(true) },
    { after: 1000, run: () => addDemoFiles([DEMO_REPORT]) },
    { after: 1500, run: () => setIsDemoTipped(true) },
    { after: 1000, run: () => addDemoFiles([DEMO_PHOTO, DEMO_BUDGET]) },
    { after: 5200, run: hold },
  ];
  const { ref, isInView } = useAutoplay(steps, {
    loopAfter: 2600,
    onReset: startOver,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[27rem] w-full max-w-sm flex-col gap-3'
    >
      <div
        data-over={overOf(isOver)}
        onDragEnter={enterZone}
        onDragLeave={leaveZone}
        onDragOver={overZone}
        onDrop={dropOnZone}
        className={DROP_ZONE}
      >
        <input
          ref={inputRef}
          type='file'
          multiple
          tabIndex={-1}
          aria-hidden='true'
          onChange={pickFiles}
          className='sr-only'
        />
        <Folder entries={entries} isTipped={isTipped} />
        <div className='flex flex-col items-center gap-1 text-center'>
          <p className='text-[13px] font-medium'>Drop files on the folder</p>
          <p className='text-muted-foreground text-xs'>
            Up to {MAX_ENTRIES} files
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          disabled={isFull}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon className='size-3.5 opacity-60' />
          Choose files
        </Button>
      </div>
      <ul aria-label='Files in the folder' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <UploadRow
              key={entry.id}
              entry={entry}
              isRunning={isInView}
              onRemove={() => removeEntry(entry.id)}
            />
          ))}
        </AnimatePresence>
      </ul>
      <LiveRegion message={announcement} />
    </div>
  );
}
