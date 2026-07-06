'use client';

import { useId, useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import {
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { pressedShapeOf } from './_parts/pressed-shape';
import { useCardDemo } from './_parts/use-card-demo';
import { useHover, usePeek } from './_parts/use-peek';

export type FolderFileKind = 'document' | 'image' | 'sheet' | 'archive';

export type FolderFile = {
  id: string;
  name: string;
  kind: FolderFileKind;
  /** The size as it reads: "48 KB". */
  size: string;
};

const KIND_ICONS: Record<FolderFileKind, React.ReactNode> = {
  document: <FileTextIcon />,
  image: <ImageIcon />,
  sheet: <FileSpreadsheetIcon />,
  archive: <FileArchiveIcon />,
};

const FOLDER = [
  'group/folder relative mt-10 block h-28 w-40 shrink-0 cursor-pointer rounded-lg outline-none',
  'transition-[scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]',
  'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-4',
].join(' ');

const BACK_FILL = 'bg-[color-mix(in_oklab,var(--primary)_32%,var(--card))]';

const TAB = cn('absolute start-0 top-0 h-5 w-16 rounded-t-md', BACK_FILL);

const BACK = cn(
  'absolute inset-x-0 top-3 bottom-0 rounded-lg rounded-ss-none',
  BACK_FILL
);

const SHEET = [
  'bg-card hairline-ring ring-border absolute inset-x-6 bottom-3 flex h-[4.5rem] origin-bottom flex-col gap-1.5 rounded-md p-2.5',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-transform duration-300 ease-(--ease-out-strong)',
].join(' ');

/** Each sheet rests tucked in the folder and has its own place in the fan. The middle one is drawn last, on top. */
const SHEETS = [
  {
    id: 'left',
    pose: '-translate-x-1.5 -translate-y-2 -rotate-3 group-data-[fanned=true]/folder:-translate-x-10 group-data-[fanned=true]/folder:-translate-y-9 group-data-[fanned=true]/folder:-rotate-12',
  },
  {
    id: 'right',
    pose: 'translate-x-1.5 -translate-y-2 rotate-3 delay-[80ms] group-data-[fanned=true]/folder:translate-x-10 group-data-[fanned=true]/folder:-translate-y-9 group-data-[fanned=true]/folder:rotate-12',
  },
  {
    id: 'middle',
    pose: '-translate-y-3 delay-[40ms] group-data-[fanned=true]/folder:-translate-y-12',
  },
];

const FLAP = [
  'hairline-ring ring-primary/30 absolute inset-x-0 bottom-0 flex h-[4.75rem] origin-bottom flex-col items-start justify-end rounded-lg p-3 text-start',
  'bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))] transition-transform duration-300 ease-(--ease-out-strong)',
  '[transform:perspective(500px)_rotateX(0deg)] group-data-[fanned=true]/folder:[transform:perspective(500px)_rotateX(-24deg)]',
].join(' ');

function fileCountOf(count: number) {
  if (count === 0) {
    return 'No files';
  }
  if (count === 1) {
    return '1 file';
  }
  return `${count} files`;
}

function Sheet({ pose }: { pose: string }) {
  return (
    <span aria-hidden='true' className={cn(SHEET, pose)}>
      <span className='bg-foreground/10 h-1 w-3/4 rounded-full' />
      <span className='bg-foreground/10 h-1 rounded-full' />
      <span className='bg-foreground/10 h-1 w-1/2 rounded-full' />
    </span>
  );
}

function FileList({ files }: { files: FolderFile[] }) {
  if (files.length === 0) {
    return (
      <p className='text-muted-foreground py-3 text-center text-[13px]'>
        This folder is empty
      </p>
    );
  }

  return (
    <ul className='bg-foreground/[0.03] flex flex-col rounded-lg p-1'>
      {files.map((file) => (
        <li
          key={file.id}
          className='flex h-9 items-center gap-2.5 px-2 text-[13px]'
        >
          <span className='keycap-3d text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5'>
            {KIND_ICONS[file.kind]}
          </span>
          <span className='min-w-0 flex-1 truncate'>{file.name}</span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {file.size}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type FolderCardProps = {
  name: string;
  files: FolderFile[];
  /** Whether the list of files shows under the folder. */
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Fans the files out with no pointer on the folder, for a demonstration. */
  isFanned?: boolean;
  /** Shows the folder held down, for a demonstration that presses it. */
  isPressed?: boolean;
  className?: string;
};

export function FolderCard({
  name,
  files,
  isOpen,
  onOpenChange,
  isFanned = false,
  isPressed = false,
  className,
}: FolderCardProps) {
  const listId = useId();
  const { isPeeking, peekHandlers } = usePeek();
  const isHeldOpen = isFanned || isOpen;
  const showsFan = isPeeking || isHeldOpen;

  function toggle() {
    onOpenChange(!isOpen);
  }

  return (
    <div className={cn('flex w-full flex-col items-center gap-4', className)}>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={listId}
        data-fanned={showsFan}
        onClick={toggle}
        className={cn(FOLDER, pressedShapeOf(isPressed))}
        {...peekHandlers}
      >
        <span aria-hidden='true' className={TAB} />
        <span aria-hidden='true' className={BACK} />
        {SHEETS.map((sheet) => (
          <Sheet key={sheet.id} pose={sheet.pose} />
        ))}
        <span className={FLAP}>
          <span className='max-w-full truncate text-[13px] font-medium'>
            {name}
          </span>
          <span className='text-foreground/70 text-xs tabular-nums'>
            {fileCountOf(files.length)}
          </span>
        </span>
      </button>
      <Fold open={isOpen} id={listId} className='self-stretch'>
        <FileList files={files} />
      </Fold>
    </div>
  );
}

const FILES: FolderFile[] = [
  { id: 'logo', name: 'Logo, primary.svg', kind: 'image', size: '48 KB' },
  { id: 'type', name: 'Type scale.pdf', kind: 'document', size: '1.2 MB' },
  { id: 'press', name: 'Press sheet.xlsx', kind: 'sheet', size: '310 KB' },
  { id: 'photos', name: 'Launch photos.zip', kind: 'archive', size: '86 MB' },
  { id: 'voice', name: 'Voice and tone.pdf', kind: 'document', size: '640 KB' },
];

const FOLDER_NAME = 'Brand kit';

function announcementOf(isOpen: boolean) {
  if (isOpen) {
    const fileCount = fileCountOf(FILES.length);
    return `${FOLDER_NAME} open, ${fileCount}`;
  }
  return `${FOLDER_NAME} closed`;
}

export default function Card08() {
  const [isOpen, setIsOpen] = useState(true);
  const [isFanned, setIsFanned] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const { pressed, press } = usePress<'folder'>();
  const { isHovered, hoverHandlers } = useHover();

  function startOver() {
    setIsOpen(true);
    setIsFanned(false);
  }

  /** Only a person's press is said: a pointer resting on the folder pauses the demonstration, and that pause must stay silent. */
  function openFromFolder(nextIsOpen: boolean) {
    setIsOpen(nextIsOpen);
    setAnnouncement(announcementOf(nextIsOpen));
  }

  const steps: AutoplayStep[] = [
    { after: 2400, run: () => press('folder') },
    { after: PRESS_LEAD_MS, run: () => setIsOpen(false) },
    { after: 1500, run: () => setIsFanned(true) },
    { after: 1400, run: () => press('folder') },
    { after: PRESS_LEAD_MS, run: () => setIsOpen(true) },
    { after: 400, run: () => setIsFanned(false) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 2000,
    onReset: startOver,
    isEnabled: !isHovered,
  });
  /** A pointer on the piece only pauses the demonstration: its fan holds then, and lets go once a person took over. */
  const holdsDemoPose = isAutoplaying || isHovered;
  const isDemoFanned = isFanned && holdsDemoPose;

  return (
    <div
      ref={ref}
      className='min-h-[22.25rem] w-full max-w-[20rem]'
      {...hoverHandlers}
    >
      <FolderCard
        name={FOLDER_NAME}
        files={FILES}
        isOpen={isOpen}
        onOpenChange={openFromFolder}
        isFanned={isDemoFanned}
        isPressed={pressed === 'folder'}
      />
      <LiveRegion message={announcement} />
    </div>
  );
}
