'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useContext, useEffect, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { ClockGateContext } from '@/registry/ndeko/hooks/use-agent-run';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  ArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  FileTextIcon,
  FolderIcon,
  HandIcon,
  ImageIcon,
  ListChecksIcon,
  LoaderIcon,
  MicIcon,
  PaperclipIcon,
  PencilIcon,
  PlugIcon,
  TableIcon,
  UploadCloudIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  risePresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { ClockSince } from './_parts/clock';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from './_parts/demonstration';
import { LabTile } from './_parts/lab-tile';
import { MODELS, modelOf } from './_parts/labs';
import { LevelBars } from '@/registry/ndeko/ui/level-bars';
import {
  caretToEnd,
  isOwnKey,
  isSendKey,
  useAutosize,
} from './_parts/use-autosize';
import { appendWord, countOf, wordsOf } from './_parts/words';

export type PermissionMode = 'ask' | 'accept' | 'plan';

type ModeLook = {
  label: string;
  hint: string;
  icon: Icon;
};

const MODES: PermissionMode[] = ['ask', 'accept', 'plan'];

const MODE_LOOK: Record<PermissionMode, ModeLook> = {
  ask: {
    label: 'Ask before edits',
    hint: 'Asks you before it changes a file',
    icon: HandIcon,
  },
  accept: {
    label: 'Accept edits',
    hint: 'Changes files and tells you after',
    icon: PencilIcon,
  },
  plan: {
    label: 'Plan only',
    hint: 'Writes a plan and changes nothing',
    icon: ListChecksIcon,
  },
};

const MODE_LABELS = MODES.map((mode) => MODE_LOOK[mode].label);

function isPermissionMode(value: unknown): value is PermissionMode {
  return MODES.some((mode) => mode === value);
}

type PermissionModeMenuProps = {
  value: PermissionMode;
  onValueChange: (mode: PermissionMode) => void;
  disabled?: boolean;
};

export function PermissionModeMenu({
  value,
  onValueChange,
  disabled,
}: PermissionModeMenuProps) {
  const look = MODE_LOOK[value];
  const ModeIcon = look.icon;

  function change(next: unknown) {
    if (isPermissionMode(next)) {
      onValueChange(next);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label={`Permission mode: ${look.label}`}
            className='text-muted-foreground hover:text-foreground gap-1.5 px-2'
          />
        }
      >
        <Swap swapKey={value}>
          <ModeIcon className='size-3.5' />
        </Swap>
        <WordRoll text={look.label} labels={MODE_LABELS} />
        <ChevronDownIcon className='size-3.5 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-64'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>
            Before Lumen changes files
          </DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={change}>
            {MODES.map((mode) => {
              const modeLook = MODE_LOOK[mode];
              const ItemIcon = modeLook.icon;
              return (
                <DropdownMenuRadioItem
                  key={mode}
                  value={mode}
                  closeOnClick
                  className='h-auto items-start py-1.5'
                >
                  <ItemIcon className='mt-0.5' />
                  <span className='flex min-w-0 flex-col'>
                    <span>{modeLook.label}</span>
                    <span className='text-muted-foreground text-xs'>
                      {modeLook.hint}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const LUMEN_MODELS = MODELS.filter((model) => model.lab === 'lumen');

const LUMEN_IDS = LUMEN_MODELS.map((model) => model.id);

const LUMEN_LABELS = LUMEN_MODELS.map((model) => model.name);

function isLumenModel(value: unknown): value is string {
  return LUMEN_IDS.some((id) => id === value);
}

type ModelMenuProps = {
  value: string;
  onValueChange: (modelId: string) => void;
  disabled?: boolean;
};

export function ModelMenu({ value, onValueChange, disabled }: ModelMenuProps) {
  const model = modelOf(value);

  function change(next: unknown) {
    if (isLumenModel(next)) {
      onValueChange(next);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label={`Model: ${model.name}`}
            className='text-muted-foreground hover:text-foreground gap-1.5 px-2'
          />
        }
      >
        <LabTile lab={model.lab} size='sm' />
        <WordRoll text={model.name} labels={LUMEN_LABELS} />
        <ChevronDownIcon className='size-3.5 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-64'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Model</DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={change}>
            {LUMEN_MODELS.map((option) => (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                closeOnClick
                className='h-auto items-start py-1.5'
              >
                <LabTile lab={option.lab} size='sm' className='mt-0.5' />
                <span className='flex min-w-0 flex-col'>
                  <span>{option.name}</span>
                  <span className='text-muted-foreground text-xs'>
                    {option.hint}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type AppId = 'calendar' | 'drive' | 'tracker';

type ConnectedApp = {
  id: AppId;
  name: string;
  hint: string;
  icon: Icon;
};

const APPS: ConnectedApp[] = [
  {
    id: 'calendar',
    name: 'Calendar',
    hint: 'Reads your meetings',
    icon: CalendarIcon,
  },
  {
    id: 'drive',
    name: 'Drive',
    hint: 'Opens shared documents',
    icon: FolderIcon,
  },
  {
    id: 'tracker',
    name: 'Tracker',
    hint: 'Reads and files issues',
    icon: TableIcon,
  },
];

const SWITCH_TRACK =
  'bg-foreground/15 dark:bg-foreground/20 group-data-checked/app:bg-primary flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200';

const SWITCH_THUMB =
  'block size-3 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-(--ease-out-strong) group-data-checked/app:translate-x-3 rtl:group-data-checked/app:-translate-x-3';

function withApp(apps: AppId[], id: AppId, isOn: boolean) {
  const others = apps.filter((app) => app !== id);
  if (isOn) {
    return [...others, id];
  }
  return others;
}

function appsLabelOf(count: number) {
  const apps = countOf(count, 'app');
  return `Connected apps, ${apps} on`;
}

type ConnectedAppsMenuProps = {
  value: AppId[];
  onValueChange: (apps: AppId[]) => void;
  disabled?: boolean;
};

export function ConnectedAppsMenu({
  value,
  onValueChange,
  disabled,
}: ConnectedAppsMenuProps) {
  const count = value.length;

  function toggle(id: AppId, isOn: boolean) {
    const next = withApp(value, id, isOn);
    onValueChange(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label={appsLabelOf(count)}
            className='text-muted-foreground hover:text-foreground gap-1.5 px-2'
          />
        }
      >
        <PlugIcon className='size-3.5' />
        <MotionNumber value={count} />
        <ChevronDownIcon className='size-3.5 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-64'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Connected apps</DropdownMenuGroupLabel>
          {APPS.map((app) => {
            const AppIcon = app.icon;
            const isOn = value.includes(app.id);
            return (
              <MenuPrimitive.CheckboxItem
                key={app.id}
                checked={isOn}
                onCheckedChange={(checked) => toggle(app.id, checked)}
                className={cn(MENU_ITEM, 'group/app h-auto py-1.5')}
              >
                <AppIcon />
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span>{app.name}</span>
                  <span className='text-muted-foreground text-xs'>
                    {app.hint}
                  </span>
                </span>
                <span aria-hidden='true' className={SWITCH_TRACK}>
                  <span className={SWITCH_THUMB} />
                </span>
              </MenuPrimitive.CheckboxItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type FolderMenuProps = {
  value: string;
  folders: string[];
  onValueChange: (folder: string) => void;
  disabled?: boolean;
};

function isFolderIn(folders: string[], value: unknown): value is string {
  return folders.some((folder) => folder === value);
}

export function FolderMenu({
  value,
  folders,
  onValueChange,
  disabled,
}: FolderMenuProps) {
  function change(next: unknown) {
    if (isFolderIn(folders, next)) {
      onValueChange(next);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label={`Working folder: ${value}`}
            className='max-w-full gap-1.5 px-2.5'
          />
        }
      >
        <FolderIcon className='text-muted-foreground size-3.5' />
        <span className='min-w-0 truncate font-mono text-[11px]'>
          <Swap swapKey={value}>{value}</Swap>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-60'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Working folder</DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={change}>
            {folders.map((folder) => (
              <DropdownMenuRadioItem key={folder} value={folder} closeOnClick>
                <FolderIcon />
                <span className='truncate font-mono text-xs'>{folder}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type ComposerAttachment = {
  id: string;
  name: string;
  size: number;
  kind: 'image' | 'file';
  isUploading: boolean;
  /** An object URL for the thumbnail, revoked when the file is removed or sent. */
  previewUrl?: string;
};

const KILOBYTE = 1024;

const MEGABYTE = KILOBYTE * 1024;

export function formatBytes(size: number) {
  if (size < KILOBYTE) {
    return `${size} B`;
  }
  if (size < MEGABYTE) {
    const kilobytes = Math.round(size / KILOBYTE);
    return `${kilobytes} KB`;
  }
  const tenths = Math.round((size / MEGABYTE) * 10);
  const megabytes = tenths / 10;
  return `${megabytes} MB`;
}

const UPLOAD_MS = 1100;

/** How long the closed ring keeps its check before the tile shows what it holds. */
const CHECK_HOLD_MS = 900;

const RING_RADIUS = 7;

const RING_CHECK = 'M5.7 9.2 8 11.4 12.4 6.6';

const CHECK_DRAW = { duration: 0.24, ease: [0.23, 1, 0.32, 1] } as const;

type UploadPhase = 'uploading' | 'confirming' | 'settled';

/** After the upload, the tile confirms it for a moment before it settles. */
function useUploadPhase(isUploading: boolean): UploadPhase {
  const [wasUploading, setWasUploading] = useState(isUploading);
  const [isConfirming, setIsConfirming] = useState(false);
  const hasChanged = wasUploading !== isUploading;
  if (hasChanged) {
    setWasUploading(isUploading);
    setIsConfirming(!isUploading);
  }

  useEffect(() => {
    if (!isConfirming) {
      return;
    }
    const timer = setTimeout(() => setIsConfirming(false), CHECK_HOLD_MS);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  if (isUploading) {
    return 'uploading';
  }
  if (isConfirming) {
    return 'confirming';
  }
  return 'settled';
}

type UploadRingProps = {
  /** The ring is closed: a check draws itself inside it. */
  isDone: boolean;
  className?: string;
};

function UploadRing({ isDone, className }: UploadRingProps) {
  const shouldReduceMotion = useReducedMotion();
  const transition = ringTransitionOf(shouldReduceMotion);

  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 18 18'
      className={cn('size-[18px]', className)}
    >
      <g transform='rotate(-90 9 9)'>
        <circle
          cx='9'
          cy='9'
          r={RING_RADIUS}
          fill='none'
          strokeWidth='2'
          className='stroke-current opacity-25'
        />
        <motion.circle
          cx='9'
          cy='9'
          r={RING_RADIUS}
          fill='none'
          strokeWidth='2'
          strokeLinecap='round'
          className='stroke-current'
          initial={{ pathLength: 0.04 }}
          animate={{ pathLength: 1 }}
          transition={transition}
        />
      </g>
      {isDone && (
        <motion.path
          d={RING_CHECK}
          fill='none'
          strokeWidth='1.75'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='stroke-current'
          initial={checkStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={CHECK_DRAW}
        />
      )}
    </svg>
  );
}

function checkStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function ringTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }
  const seconds = UPLOAD_MS / 1000;
  return { duration: seconds, ease: [0.4, 0, 0.2, 1] as const };
}

function glyphKeyOf(showsRing: boolean) {
  if (showsRing) {
    return 'ring';
  }
  return 'file';
}

function thumbnailStyleOf(previewUrl: string | undefined) {
  if (!previewUrl) {
    return undefined;
  }
  return { backgroundImage: `url("${previewUrl}")` };
}

function uploadWordOf(attachment: ComposerAttachment) {
  if (attachment.isUploading) {
    return 'Uploading';
  }
  return formatBytes(attachment.size);
}

type AttachmentTileProps = {
  attachment: ComposerAttachment;
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export function AttachmentTile({
  attachment,
  onRemove,
  disabled,
}: AttachmentTileProps) {
  const phase = useUploadPhase(attachment.isUploading);
  const isImage = attachment.kind === 'image';
  const thumbnailStyle = thumbnailStyleOf(attachment.previewUrl);
  const hasPreview = thumbnailStyle !== undefined;
  const detail = uploadWordOf(attachment);
  const removeLabel = `Remove ${attachment.name}`;
  const showsRing = phase !== 'settled';
  const isConfirmed = phase === 'confirming';

  if (isImage) {
    return (
      <div className='group/tile relative size-11'>
        <span
          role='img'
          aria-label={`${attachment.name}, ${detail}`}
          style={thumbnailStyle}
          className='bg-foreground/[0.06] hairline-ring ring-border flex size-full items-center justify-center overflow-hidden rounded-lg bg-cover bg-center'
        >
          {!hasPreview && (
            <ImageIcon className='text-muted-foreground size-4' />
          )}
          <AnimatePresence initial={false}>
            {showsRing && (
              <motion.span
                key='upload'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='bg-card/70 text-primary absolute inset-0 flex items-center justify-center rounded-lg'
              >
                <UploadRing isDone={isConfirmed} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <Button
          type='button'
          variant='outline'
          size='icon-sm'
          aria-label={removeLabel}
          disabled={disabled}
          onClick={() => onRemove(attachment.id)}
          className='absolute -end-1.5 -top-1.5 size-5'
        >
          <XIcon className='size-3' />
        </Button>
      </div>
    );
  }

  return (
    <div className='bg-card hairline-ring ring-border flex h-11 max-w-56 items-center gap-2 rounded-lg ps-1.5 pe-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <span
        aria-hidden='true'
        className='text-primary bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-md'
      >
        <Swap swapKey={glyphKeyOf(showsRing)}>
          {showsRing && <UploadRing isDone={isConfirmed} />}
          {!showsRing && <FileTextIcon className='size-3.5' />}
        </Swap>
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-xs font-medium'>
          {attachment.name}
        </span>
        <span className='text-muted-foreground block text-xs tabular-nums'>
          <Swap swapKey={detail}>{detail}</Swap>
        </span>
      </span>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={removeLabel}
        disabled={disabled}
        onClick={() => onRemove(attachment.id)}
        className='text-muted-foreground'
      >
        <XIcon className='size-3.5' />
      </Button>
    </div>
  );
}

function RecordingDot({ isBlinking }: { isBlinking: boolean }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'bg-destructive size-2 shrink-0 rounded-full',
        isBlinking && 'animate-pulse'
      )}
    />
  );
}

type RecordingStripProps = {
  startedAt: number;
  onCancel: () => void;
  onDone: () => void;
  doneRef?: React.Ref<HTMLButtonElement>;
  /** Shows Done held down, for a demonstration that presses it. */
  isDonePressed?: boolean;
};

export function RecordingStrip({
  startedAt,
  onCancel,
  onDone,
  doneRef,
  isDonePressed = false,
}: RecordingStripProps) {
  const isOnScreen = useContext(ClockGateContext);

  return (
    <div className='flex h-8 items-center gap-2.5 ps-2'>
      <RecordingDot isBlinking={isOnScreen} />
      <LevelBars
        isActive={isOnScreen}
        count={28}
        seed={0.6}
        className='min-w-0 flex-1 justify-end overflow-hidden'
      />
      <ClockSince
        startedAt={startedAt}
        isRunning
        className='text-muted-foreground w-9 shrink-0 text-end text-xs'
      />
      <Button
        type='button'
        variant='ghost'
        size='sm'
        onClick={onCancel}
        className='text-muted-foreground'
      >
        Cancel
      </Button>
      <Button
        ref={doneRef}
        type='button'
        size='sm'
        onClick={onDone}
        className={pressedSolidOf(isDonePressed)}
      >
        Done
      </Button>
    </div>
  );
}

type Phase = 'idle' | 'recording' | 'answering';

type NoticeTone = 'working' | 'done' | 'stopped' | 'refusal';

type Notice = {
  tone: NoticeTone;
  text: string;
};

const NOTICE_ICON: Record<NoticeTone, React.ReactNode> = {
  working: <LoaderIcon className='text-muted-foreground size-4 animate-spin' />,
  done: <CircleCheckIcon className='text-success-foreground size-4' />,
  stopped: (
    <span className='flex size-4 items-center justify-center'>
      <span className='bg-muted-foreground size-2 rounded-[2px]' />
    </span>
  ),
  refusal: <CircleAlertIcon className='text-warning-foreground size-4' />,
};

const FOLDERS = [
  '~/projects/atlas',
  '~/projects/atlas/web',
  '~/projects/atlas/api',
  '~/notes',
];

const SEED_ATTACHMENTS: ComposerAttachment[] = [
  {
    id: 'seed-whiteboard',
    name: 'whiteboard.png',
    size: 482_000,
    kind: 'image',
    isUploading: false,
  },
  {
    id: 'seed-roadmap',
    name: 'atlas-roadmap.md',
    size: 12_400,
    kind: 'file',
    isUploading: false,
  },
];

const MAX_FILES = 4;

const MAX_BYTES = 10 * MEGABYTE;

const ANSWER_MS = 3200;

const WORD_GAP_MS = 70;

const MAX_FIELD_HEIGHT = 200;

const TRANSCRIPT = 'Keep the old settings page live until the launch';

const SEED_DRAFT = 'Plan the billing move with the roadmap attached.';

const SEED_NOTICE: Notice = { tone: 'done', text: 'Lumen answered' };

/** What a picked, pasted or dropped file brings; a demonstration attaches one without a file behind it. */
type Incoming = {
  name: string;
  size: number;
  kind: ComposerAttachment['kind'];
  file?: File;
};

const DEMO_FILE: Incoming = {
  name: 'q3-invoices.csv',
  size: 86_400,
  kind: 'file',
};

type PressKey = 'attach' | 'mic' | 'done' | 'send';

const MODE_PHRASE: Record<PermissionMode, string> = {
  ask: 'it asks before each edit',
  accept: 'it edits files as it goes',
  plan: 'it only writes a plan',
};

function kindOf(file: File): ComposerAttachment['kind'] {
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    return 'image';
  }
  return 'file';
}

function incomingOf(file: File): Incoming {
  return { name: file.name, size: file.size, kind: kindOf(file), file };
}

function previewUrlOf(incoming: Incoming) {
  if (!incoming.file) {
    return undefined;
  }
  if (incoming.kind !== 'image') {
    return undefined;
  }
  return URL.createObjectURL(incoming.file);
}

function footerClassOf(isRecording: boolean) {
  if (isRecording) {
    return 'opacity-0';
  }
  return 'opacity-100';
}

function refusalOf(tooLargeName: string | null, hasOverflow: boolean) {
  if (tooLargeName) {
    const limit = formatBytes(MAX_BYTES);
    return `“${tooLargeName}” is over ${limit}. Attach a smaller copy`;
  }
  if (hasOverflow) {
    const files = countOf(MAX_FILES, 'file');
    return `${files} fit in one prompt. Remove one to add another`;
  }
  return null;
}

function hasDraggedFiles(event: React.DragEvent) {
  const types = Array.from(event.dataTransfer.types);
  return types.includes('Files');
}

function revokePreview(attachment: ComposerAttachment) {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

function sendKeyLabelOf(isAnswering: boolean) {
  if (isAnswering) {
    return 'Stop the answer';
  }
  return 'Send the prompt';
}

function noticeKeyOf(notice: Notice) {
  return `${notice.tone}:${notice.text}`;
}

export default function Prompt02() {
  const [draft, setDraft] = useState(SEED_DRAFT);
  const [attachments, setAttachments] =
    useState<ComposerAttachment[]>(SEED_ATTACHMENTS);
  const [mode, setMode] = useState<PermissionMode>('ask');
  const [modelId, setModelId] = useState('lumen');
  const [apps, setApps] = useState<AppId[]>(['calendar', 'tracker']);
  const [folder, setFolder] = useState(FOLDERS[0]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [recordingSince, setRecordingSince] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(SEED_NOTICE);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const { schedule, clearAll } = useTimeouts();
  const { pressed, press } = usePress<PressKey>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);
  const previews = useRef(new Set<string>());
  const dragDepth = useRef(0);
  const idCounter = useRef(0);
  const sentDraft = useRef('');
  const shouldReduceMotion = useReducedMotion();
  const noticePresence = fadePresence();
  const stripPresence = risePresenceOf(shouldReduceMotion);
  const layoutSpring = springOf(shouldReduceMotion);
  const isRecording = phase === 'recording';
  const isAnswering = phase === 'answering';
  const isBusy = phase !== 'idle';
  const hasText = draft.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const isUploading = attachments.some((item) => item.isUploading);
  const hasContent = hasText || hasAttachments;
  const canSend = hasContent && !isUploading;
  const isKeyEnabled = isAnswering || canSend;
  const model = modelOf(modelId);
  const announcement = notice?.text ?? '';
  const attachmentIds = attachments.map((item) => item.id);
  const attachmentOrder = attachmentIds.join(' ');
  useAutosize(textareaRef, draft, MAX_FIELD_HEIGHT);

  useEffect(() => {
    const urls = previews.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  function nextId() {
    idCounter.current += 1;
    return `file-${idCounter.current}`;
  }

  function finishUpload(id: string) {
    setAttachments((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        return { ...item, isUploading: false };
      })
    );
  }

  function attach(incoming: Incoming[]) {
    const room = MAX_FILES - attachments.length;
    const accepted: ComposerAttachment[] = [];
    let tooLargeName: string | null = null;
    let hasOverflow = false;
    for (const item of incoming) {
      const isTooLarge = item.size > MAX_BYTES;
      if (isTooLarge) {
        tooLargeName = item.name;
        continue;
      }
      const isOutOfRoom = accepted.length >= room;
      if (isOutOfRoom) {
        hasOverflow = true;
        continue;
      }
      const previewUrl = previewUrlOf(item);
      if (previewUrl) {
        previews.current.add(previewUrl);
      }
      accepted.push({
        id: nextId(),
        name: item.name,
        size: item.size,
        kind: item.kind,
        isUploading: true,
        previewUrl,
      });
    }
    setAttachments((current) => [...current, ...accepted]);
    accepted.forEach((item, index) => {
      const stagger = index * 250;
      schedule(() => finishUpload(item.id), UPLOAD_MS + stagger);
    });
    const refusal = refusalOf(tooLargeName, hasOverflow);
    if (refusal) {
      setNotice({ tone: 'refusal', text: refusal });
    }
  }

  function addFiles(files: File[]) {
    attach(files.map(incomingOf));
  }

  function removeAttachment(id: string) {
    const removed = attachments.find((item) => item.id === id);
    if (removed) {
      revokePreview(removed);
    }
    setAttachments((current) => current.filter((item) => item.id !== id));
    setNotice(null);
  }

  function pickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const list = event.target.files;
    if (list) {
      addFiles(Array.from(list));
    }
    event.target.value = '';
  }

  function pasteFiles(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) {
      return;
    }
    event.preventDefault();
    addFiles(files);
  }

  function enterDrag(event: React.DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }
    event.preventDefault();
    dragDepth.current += 1;
    setIsDraggingFiles(true);
  }

  function holdDrag(event: React.DragEvent<HTMLDivElement>) {
    if (hasDraggedFiles(event)) {
      event.preventDefault();
    }
  }

  function leaveDrag(event: React.DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setIsDraggingFiles(false);
    }
  }

  function dropFiles(event: React.DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }
    event.preventDefault();
    dragDepth.current = 0;
    setIsDraggingFiles(false);
    const files = Array.from(event.dataTransfer.files);
    if (isBusy) {
      return;
    }
    addFiles(files);
  }

  function startRecording() {
    setNotice(null);
    setRecordingSince(Date.now());
    setPhase('recording');
    if (isAutoplaying) {
      return;
    }
    requestAnimationFrame(() => doneRef.current?.focus());
  }

  function cancelRecording() {
    setPhase('idle');
    requestAnimationFrame(() => micRef.current?.focus());
  }

  function finishRecording() {
    setPhase('idle');
    const words = wordsOf(TRANSCRIPT);
    words.forEach((word, index) => {
      const delay = (index + 1) * WORD_GAP_MS;
      schedule(() => setDraft((current) => appendWord(current, word)), delay);
    });
    if (isAutoplaying) {
      return;
    }
    const streamEnd = (words.length + 1) * WORD_GAP_MS;
    schedule(() => caretToEnd(textareaRef), streamEnd);
    caretToEnd(textareaRef);
  }

  function send() {
    if (!canSend) {
      return;
    }
    if (isBusy) {
      return;
    }
    clearAll();
    sentDraft.current = draft;
    const phrase = MODE_PHRASE[mode];
    setPhase('answering');
    setNotice({
      tone: 'working',
      text: `${model.name} is working in ${folder}, ${phrase}`,
    });
    schedule(() => {
      attachments.forEach(revokePreview);
      setPhase('idle');
      setDraft('');
      setAttachments([]);
      setNotice({ tone: 'done', text: `${model.name} answered` });
    }, ANSWER_MS);
  }

  function stop() {
    clearAll();
    setPhase('idle');
    setDraft(sentDraft.current);
    setNotice({
      tone: 'stopped',
      text: 'Stopped. Your prompt is back in the field',
    });
    caretToEnd(textareaRef);
  }

  function pressSendKey() {
    if (isAnswering) {
      stop();
      return;
    }
    send();
  }

  function handleFieldKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    send();
  }

  function handleEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    if (!isOwnKey(event)) {
      return;
    }
    if (isRecording) {
      event.preventDefault();
      cancelRecording();
      return;
    }
    if (isAnswering) {
      event.preventDefault();
      stop();
    }
  }

  function resetDemo() {
    clearAll();
    setAttachments(SEED_ATTACHMENTS);
    setDraft(SEED_DRAFT);
    setMode('ask');
    setModelId('lumen');
    setPhase('idle');
    setNotice(SEED_NOTICE);
  }

  const dictatedWords = wordsOf(TRANSCRIPT);
  const streamMs = (dictatedWords.length + 1) * WORD_GAP_MS;
  const steps: AutoplayStep[] = [
    { after: 1500, run: () => press('attach') },
    { after: PRESS_LEAD_MS, run: () => attach([DEMO_FILE]) },
    { after: UPLOAD_MS + CHECK_HOLD_MS + 500, run: () => setMode('accept') },
    { after: 1300, run: () => setMode('ask') },
    { after: 900, run: () => setModelId('lumen-max') },
    { after: 1100, run: () => press('mic') },
    { after: PRESS_LEAD_MS, run: startRecording },
    { after: 2400, run: () => press('done') },
    { after: PRESS_LEAD_MS, run: finishRecording },
    { after: streamMs + 700, run: () => press('send') },
    { after: PRESS_LEAD_MS, run: pressSendKey },
    { after: ANSWER_MS + 500, run: hold },
  ];
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2600,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onKeyDown={handleEscape}
      className='flex w-full max-w-2xl flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <div
          onDragEnter={enterDrag}
          onDragOver={holdDrag}
          onDragLeave={leaveDrag}
          onDrop={dropFiles}
          className='bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[textarea:focus]:ring-ring/25 relative flex flex-col rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 has-[textarea:focus]:ring-[3px]'
        >
          <AnimatedSize>
            <ul
              aria-label='Attachments'
              className={cn(
                'flex flex-wrap gap-2',
                hasAttachments && 'px-1 pt-1.5 pb-2'
              )}
            >
              <AnimatePresence initial={false} mode='popLayout'>
                {attachments.map((attachment) => (
                  <motion.li
                    key={attachment.id}
                    layout
                    layoutDependency={attachmentOrder}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={layoutSpring}
                  >
                    <AttachmentTile
                      attachment={attachment}
                      onRemove={removeAttachment}
                      disabled={isBusy}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <Textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleFieldKeys}
              onPaste={pasteFiles}
              readOnly={isRecording}
              aria-label='Prompt'
              placeholder='Ask Lumen to plan, edit or explain. Paste or drop files'
              className='max-h-none min-h-10 border-0 bg-transparent px-2 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
            />
            <input
              ref={fileInputRef}
              type='file'
              multiple
              tabIndex={-1}
              aria-hidden='true'
              className='hidden'
              onChange={pickFiles}
            />
          </AnimatedSize>
          {/*
                The strip lies over a footer that keeps its place, so nothing resizes when one
                becomes the other and the clock of the strip ticks outside any resizing box.
              */}
          <div className='relative pt-1'>
            <div
              inert={isRecording}
              className={cn(
                'flex flex-wrap items-center gap-1 transition-opacity duration-150',
                footerClassOf(isRecording)
              )}
            >
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label='Attach files'
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'text-muted-foreground',
                  pressedQuietOf(pressed === 'attach')
                )}
              >
                <PaperclipIcon />
              </Button>
              <PermissionModeMenu
                value={mode}
                onValueChange={setMode}
                disabled={isBusy}
              />
              <ModelMenu
                value={modelId}
                onValueChange={setModelId}
                disabled={isBusy}
              />
              <ConnectedAppsMenu
                value={apps}
                onValueChange={setApps}
                disabled={isBusy}
              />
              <FolderMenu
                value={folder}
                folders={FOLDERS}
                onValueChange={setFolder}
                disabled={isBusy}
              />
              <span className='ms-auto flex items-center gap-1'>
                <Button
                  ref={micRef}
                  type='button'
                  variant='ghost'
                  size='icon'
                  aria-label='Dictate'
                  disabled={isBusy}
                  onClick={startRecording}
                  className={cn(
                    'text-muted-foreground',
                    pressedQuietOf(pressed === 'mic')
                  )}
                >
                  <MicIcon />
                </Button>
                <Button
                  type='button'
                  size='icon'
                  aria-label={sendKeyLabelOf(isAnswering)}
                  disabled={!isKeyEnabled}
                  focusableWhenDisabled
                  onClick={pressSendKey}
                  className={pressedSolidOf(pressed === 'send')}
                >
                  <Swap swapKey={String(isAnswering)}>
                    {isAnswering && (
                      <span
                        aria-hidden='true'
                        className='size-2.5 rounded-[2px] bg-current'
                      />
                    )}
                    {!isAnswering && <ArrowUpIcon />}
                  </Swap>
                </Button>
              </span>
            </div>
            <AnimatePresence initial={false}>
              {isRecording && (
                <motion.div
                  key='strip'
                  className='absolute inset-x-0 bottom-0'
                  {...stripPresence}
                >
                  <RecordingStrip
                    startedAt={recordingSince}
                    onCancel={cancelRecording}
                    onDone={finishRecording}
                    doneRef={doneRef}
                    isDonePressed={pressed === 'done'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {isDraggingFiles && (
              <motion.div
                key='drop'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className='bg-card/90 hairline-border border-primary/50 pointer-events-none absolute inset-1 flex flex-col items-center justify-center gap-1.5 rounded-[calc(var(--radius-xl)-0.25rem)] border-dashed'
              >
                <UploadCloudIcon className='text-primary-ink size-5' />
                <p className='text-[13px] font-medium'>Drop to attach</p>
                <p className='text-muted-foreground text-xs'>
                  Up to {countOf(MAX_FILES, 'file')}, {formatBytes(MAX_BYTES)}{' '}
                  each
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatedSize>
          <AnimatePresence initial={false} mode='popLayout'>
            {notice && (
              <motion.p
                key={noticeKeyOf(notice)}
                className='text-muted-foreground flex items-start gap-2 px-1 pt-1 text-[13px] leading-5'
                {...noticePresence}
              >
                <span className='mt-0.5 shrink-0'>
                  {NOTICE_ICON[notice.tone]}
                </span>
                {notice.text}
              </motion.p>
            )}
          </AnimatePresence>
        </AnimatedSize>
      </ClockGate>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
