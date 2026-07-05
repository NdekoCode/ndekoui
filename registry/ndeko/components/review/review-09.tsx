'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  emptyRun,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  PencilIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import {
  risePresenceOf,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { JsonView } from '@/registry/ndeko/ui/json-view';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { countOf } from './_parts/words';

export type ExtractedField = {
  id: string;
  label: string;
  /** The key the field takes in the saved record. */
  key: string;
  value: string;
  /** From 0 to 1. */
  confidence: number;
  /** Why the reader is unsure, shown when the field is checked by a person. */
  reason?: string;
};

export type FieldCheck = 'confirmed' | 'edited';

type FieldOutput = { value: string; confidence: number };

type Box = { x: number; y: number; width: number; height: number };

type Thread = { fieldId: string; path: string; box: Box };

const LOW_CONFIDENCE = 0.8;

const BOX_PAD = 3;

const BEND = 36;

function isFieldOutput(value: unknown): value is FieldOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof (value as FieldOutput).value === 'string';
}

function outputOf(call: ToolCall | undefined) {
  if (!call) {
    return null;
  }
  if (isFieldOutput(call.output)) {
    return call.output;
  }
  return null;
}

function isLow(field: ExtractedField) {
  return field.confidence < LOW_CONFIDENCE;
}

function percentOf(confidence: number) {
  const percent = confidence * 100;
  return Math.round(percent);
}

type Rect = { left: number; top: number; width: number; height: number };

function relativeRectOf(element: HTMLElement, origin: DOMRect): Rect {
  const rect = element.getBoundingClientRect();
  const left = rect.left - origin.left;
  const top = rect.top - origin.top;
  return { left, top, width: rect.width, height: rect.height };
}

function paddedBoxOf(rect: Rect): Box {
  const padding = BOX_PAD * 2;
  return {
    x: rect.left - BOX_PAD,
    y: rect.top - BOX_PAD,
    width: rect.width + padding,
    height: rect.height + padding,
  };
}

/** Beside the document the thread leaves the field sideways; under it, it leaves from the top. */
function sidePathOf(field: Rect, box: Box) {
  const x1 = field.left;
  const halfField = field.height / 2;
  const y1 = field.top + halfField;
  const x2 = box.x + box.width;
  const halfBox = box.height / 2;
  const y2 = box.y + halfBox;
  const pull1 = x1 - BEND;
  const pull2 = x2 + BEND;
  return `M ${x1} ${y1} C ${pull1} ${y1} ${pull2} ${y2} ${x2} ${y2}`;
}

function verticalPathOf(field: Rect, box: Box) {
  const x1 = field.left + 14;
  const y1 = field.top;
  const halfBox = box.width / 2;
  const x2 = box.x + halfBox;
  const y2 = box.y + box.height;
  const pull1 = y1 - BEND;
  const pull2 = y2 + BEND;
  return `M ${x1} ${y1} C ${x1} ${pull1} ${x2} ${pull2} ${x2} ${y2}`;
}

function threadOf(root: HTMLElement, field: HTMLElement, region: HTMLElement) {
  const origin = root.getBoundingClientRect();
  const fieldRect = relativeRectOf(field, origin);
  const regionRect = relativeRectOf(region, origin);
  const box = paddedBoxOf(regionRect);
  const regionRight = regionRect.left + regionRect.width;
  const isBeside = fieldRect.left >= regionRight;
  if (isBeside) {
    return { path: sidePathOf(fieldRect, box), box };
  }
  return { path: verticalPathOf(fieldRect, box), box };
}

function threadFor(thread: Thread | null, activeId: string | null) {
  if (!thread) {
    return null;
  }
  if (thread.fieldId !== activeId) {
    return null;
  }
  return thread;
}

const THREAD_DRAW = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
  transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
} as const;

const THREAD_FADE = {
  initial: { pathLength: 1, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function threadMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return THREAD_FADE;
  }
  return THREAD_DRAW;
}

function ThreadLayer({ thread }: { thread: Thread | null }) {
  const shouldReduceMotion = useReducedMotion();
  const threadMotion = threadMotionOf(shouldReduceMotion);

  return (
    <svg
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 z-10 size-full overflow-visible'
    >
      <AnimatePresence>
        {thread && (
          <motion.g
            key={thread.fieldId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <rect
              x={thread.box.x}
              y={thread.box.y}
              width={thread.box.width}
              height={thread.box.height}
              rx={5}
              fill='color-mix(in oklab, var(--primary) 10%, transparent)'
              stroke='var(--primary)'
              strokeWidth={1.25}
            />
            <motion.path
              d={thread.path}
              fill='none'
              stroke='var(--primary)'
              strokeWidth={1.5}
              strokeLinecap='round'
              {...threadMotion}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

type RegionProps = {
  id: string;
  isActive: boolean;
  register: (id: string, node: HTMLElement | null) => void;
  onEnter: (id: string) => void;
  onLeave: () => void;
  className?: string;
  children: React.ReactNode;
};

function Region({
  id,
  isActive,
  register,
  onEnter,
  onLeave,
  className,
  children,
}: RegionProps) {
  return (
    <span
      ref={(node) => register(id, node)}
      onPointerEnter={() => onEnter(id)}
      onPointerLeave={onLeave}
      className={cn(
        'rounded-[3px] transition-colors duration-150',
        regionToneOf(isActive),
        className
      )}
    >
      {children}
    </span>
  );
}

function regionToneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return '';
}

type InvoiceProps = {
  activeId: string | null;
  register: (id: string, node: HTMLElement | null) => void;
  onEnter: (id: string) => void;
  onLeave: () => void;
};

function Invoice({ activeId, register, onEnter, onLeave }: InvoiceProps) {
  const regionProps = { register, onEnter, onLeave };

  function isActive(id: string) {
    return activeId === id;
  }

  return (
    <figure
      aria-label='Invoice from Brightmoor Supply, as scanned'
      className='bg-card hairline-ring ring-border relative flex flex-col gap-3 overflow-hidden rounded-lg p-4 text-[11px] leading-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col gap-0.5'>
          <Region
            id='supplier'
            isActive={isActive('supplier')}
            className='text-[13px] font-semibold'
            {...regionProps}
          >
            Brightmoor Supply Ltd
          </Region>
          <span className='text-muted-foreground'>14 Quay Street, Hull</span>
          <span className='text-muted-foreground relative w-fit'>
            VAT{' '}
            <Region
              id='vat'
              isActive={isActive('vat')}
              className='font-mono'
              {...regionProps}
            >
              GB 412 7781 06
            </Region>
            <span
              aria-hidden='true'
              className='hairline-border border-destructive/40 text-destructive-ink/60 absolute -top-1.5 left-14 rotate-[-8deg] rounded-sm px-1 text-[8px] font-semibold'
            >
              RECEIVED
            </span>
          </span>
        </div>
        <div className='flex flex-col items-end gap-0.5 text-end'>
          <span className='text-muted-foreground text-[10px] font-medium'>
            Invoice
          </span>
          <Region
            id='number'
            isActive={isActive('number')}
            className='font-mono'
            {...regionProps}
          >
            INV-2026-0417
          </Region>
          <span className='text-muted-foreground'>
            Issued{' '}
            <Region
              id='issued'
              isActive={isActive('issued')}
              className='text-foreground'
              {...regionProps}
            >
              3 Nov 2026
            </Region>
          </span>
          <span className='text-muted-foreground'>
            Due{' '}
            <Region
              id='due'
              isActive={isActive('due')}
              className='text-foreground inline-block -rotate-3 font-serif text-[12px]'
              {...regionProps}
            >
              19 Nov
            </Region>
          </span>
        </div>
      </div>
      <div className='flex flex-col gap-0.5'>
        <span className='text-muted-foreground'>Bill to</span>
        <span>Kestrel Foods GmbH</span>
        <span className='text-muted-foreground'>
          Order{' '}
          <Region
            id='po'
            isActive={isActive('po')}
            className='text-foreground font-mono'
            {...regionProps}
          >
            PO-88213
          </Region>
        </span>
      </div>
      <table className='w-full tabular-nums'>
        <thead className='text-muted-foreground'>
          <tr>
            <th scope='col' className='pb-1 text-start font-normal'>
              Item
            </th>
            <th scope='col' className='pb-1 text-end font-normal'>
              EUR
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className='hairline-t border-border'>
            <td className='py-1'>40 pallets at the flat fee</td>
            <td className='py-1 text-end'>736.00</td>
          </tr>
          <tr className='hairline-t border-border'>
            <td className='py-1'>Handling</td>
            <td className='py-1 text-end'>184.00</td>
          </tr>
          <tr className='hairline-t border-border'>
            <td className='text-muted-foreground py-1'>VAT 20%</td>
            <td className='py-1 text-end'>184.00</td>
          </tr>
          <tr className='hairline-t border-border font-semibold'>
            <td className='py-1'>Total</td>
            <td className='py-1 text-end'>
              <Region id='total' isActive={isActive('total')} {...regionProps}>
                1,104.00
              </Region>
            </td>
          </tr>
        </tbody>
      </table>
      <span className='text-muted-foreground'>
        Pay to{' '}
        <Region
          id='iban'
          isActive={isActive('iban')}
          className='text-foreground font-mono'
          {...regionProps}
        >
          GB29 BRMS 6016 1331 9268 19
        </Region>
      </span>
    </figure>
  );
}

function checkWordOf(check: FieldCheck) {
  if (check === 'edited') {
    return 'Edited';
  }
  return 'Confirmed';
}

type FieldStatus = 'reading' | 'sure' | 'unsure' | FieldCheck;

function statusOf(
  field: ExtractedField,
  isRead: boolean,
  check: FieldCheck | undefined
): FieldStatus {
  if (!isRead) {
    return 'reading';
  }
  if (check) {
    return check;
  }
  if (isLow(field)) {
    return 'unsure';
  }
  return 'sure';
}

function FieldMeter({
  field,
  status,
}: {
  field: ExtractedField;
  status: FieldStatus;
}) {
  const percent = percentOf(field.confidence);
  if (status === 'reading') {
    return <span className='text-muted-foreground text-xs'>Reading</span>;
  }
  if (status === 'unsure') {
    return (
      <Badge variant='warning' className='tabular-nums'>
        {percent}% sure
      </Badge>
    );
  }
  if (status === 'sure') {
    return (
      <span className='text-muted-foreground text-xs tabular-nums'>
        {percent}%
      </span>
    );
  }
  return (
    <Badge variant='success'>
      <CheckIcon />
      {checkWordOf(status)}
    </Badge>
  );
}

function fieldToneOf(status: FieldStatus, isActive: boolean) {
  if (isActive) {
    return 'bg-primary/[0.07]';
  }
  if (status === 'unsure') {
    return 'bg-warning/[0.07]';
  }
  return '';
}

type FieldRowProps = {
  field: ExtractedField;
  value: string;
  status: FieldStatus;
  isActive: boolean;
  register: (id: string, node: HTMLElement | null) => void;
  onEnter: (id: string) => void;
  onLeave: () => void;
};

function FieldRow({
  field,
  value,
  status,
  isActive,
  register,
  onEnter,
  onLeave,
}: FieldRowProps) {
  const isReading = status === 'reading';
  const percent = percentOf(field.confidence);

  return (
    <div
      ref={(node) => register(field.id, node)}
      tabIndex={0}
      aria-label={`${field.label}: ${value}, ${percent}% sure`}
      onPointerEnter={() => onEnter(field.id)}
      onPointerLeave={onLeave}
      onFocus={() => onEnter(field.id)}
      onBlur={onLeave}
      className={cn(
        'focus-visible:ring-ring/25 flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        fieldToneOf(status, isActive)
      )}
    >
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='text-muted-foreground text-xs'>{field.label}</span>
        <span className='min-h-5 truncate text-[13px]'>
          {isReading && (
            <span className='bg-foreground/10 inline-block h-3 w-24 animate-pulse rounded-full align-middle' />
          )}
          {!isReading && (
            <span className='transition-opacity duration-300 starting:opacity-0'>
              {value}
            </span>
          )}
        </span>
      </span>
      <FieldMeter field={field} status={status} />
    </div>
  );
}

type ReviewCardProps = {
  field: ExtractedField;
  position: number;
  total: number;
  onConfirm: (fieldId: string) => void;
  onEdit: (fieldId: string, value: string) => void;
};

function ReviewCard({
  field,
  position,
  total,
  onConfirm,
  onEdit,
}: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(field.value);
  const percent = percentOf(field.confidence);
  const trimmed = draft.trim();
  const canSave = trimmed !== '';
  const fieldName = field.label.toLowerCase();
  const inputId = `edit-${field.id}`;

  function save() {
    if (!canSave) {
      return;
    }
    onEdit(field.id, trimmed);
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft(field.value);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  }

  return (
    <div className='surface-raised flex flex-col gap-3 rounded-xl p-3.5'>
      <div className='flex items-center gap-2'>
        <TriangleAlertIcon className='text-warning-foreground size-4 shrink-0' />
        <span className='min-w-0 flex-1 text-[13px] font-medium'>
          Check the {fieldName}
        </span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {position} of {total}
        </span>
      </div>
      <AnimatedSize>
        {!isEditing && (
          <div className='flex flex-col gap-1'>
            <span className='flex items-baseline gap-2'>
              <span className='text-base font-semibold'>{field.value}</span>
              <Badge variant='warning' className='tabular-nums'>
                {percent}% sure
              </Badge>
            </span>
            <p className='text-muted-foreground text-xs leading-5'>
              {field.reason}
            </p>
          </div>
        )}
        {isEditing && (
          <div className='flex flex-col gap-1.5'>
            <label htmlFor={inputId} className='text-xs font-medium'>
              {field.label}
            </label>
            <Input
              id={inputId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeys}
              autoFocus
            />
          </div>
        )}
      </AnimatedSize>
      <div className='flex flex-wrap items-center gap-2'>
        {!isEditing && (
          <>
            <Button type='button' size='sm' onClick={() => onConfirm(field.id)}>
              <CheckIcon />
              Confirm
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon />
              Edit
            </Button>
          </>
        )}
        {isEditing && (
          <>
            <Button type='button' size='sm' disabled={!canSave} onClick={save}>
              Save the {fieldName}
            </Button>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

const FIELDS: ExtractedField[] = [
  {
    id: 'supplier',
    label: 'Supplier',
    key: 'supplier',
    value: 'Brightmoor Supply Ltd',
    confidence: 0.98,
  },
  {
    id: 'number',
    label: 'Invoice number',
    key: 'invoiceNumber',
    value: 'INV-2026-0417',
    confidence: 0.99,
  },
  {
    id: 'issued',
    label: 'Issue date',
    key: 'issueDate',
    value: '3 Nov 2026',
    confidence: 0.97,
  },
  {
    id: 'due',
    label: 'Due date',
    key: 'dueDate',
    value: '19 Nov 2026',
    confidence: 0.62,
    reason:
      'The date is written by hand. It reads 19, but the 9 could be a 4, which would make it 14 Nov.',
  },
  {
    id: 'vat',
    label: 'VAT number',
    key: 'vatNumber',
    value: 'GB 412 7781 06',
    confidence: 0.71,
    reason:
      'A stamp covers part of the VAT number. Two digits were read through the ink.',
  },
  {
    id: 'po',
    label: 'Purchase order',
    key: 'purchaseOrder',
    value: 'PO-88213',
    confidence: 0.93,
  },
  {
    id: 'total',
    label: 'Total',
    key: 'totalEur',
    value: '1,104.00 EUR',
    confidence: 0.99,
  },
  {
    id: 'iban',
    label: 'IBAN',
    key: 'iban',
    value: 'GB29 BRMS 6016 1331 9268 19',
    confidence: 0.95,
  },
];

const FIELD_READ_MS = 220;

const FIELD_GAP_MS = 120;

function scriptOf(fields: ExtractedField[]): RunScriptStep[] {
  const steps: RunScriptStep[] = [
    { after: 500, event: { type: 'run.started' } },
  ];
  for (const field of fields) {
    steps.push({
      after: FIELD_GAP_MS,
      event: {
        type: 'call.started',
        call: {
          id: field.id,
          tool: 'read_field',
          label: field.label,
          status: 'running',
        },
      },
    });
    steps.push({
      after: FIELD_READ_MS,
      event: {
        type: 'call.updated',
        id: field.id,
        patch: {
          status: 'done',
          output: { value: field.value, confidence: field.confidence },
        },
      },
    });
  }
  steps.push({ after: 0, event: { type: 'run.finished', status: 'done' } });
  return steps;
}

const SCRIPT = scriptOf(FIELDS);

const INITIAL_RUN = emptyRun({ id: 'extraction', title: 'INV-2026-0417' });

const LOW_FIELDS = FIELDS.filter(isLow);

const SAVING_MS = 800;

type Tab = 'fields' | 'json';

function callOf(run: RunSnapshot, fieldId: string) {
  return run.calls.find((call) => call.id === fieldId);
}

function readFieldsOf(run: RunSnapshot) {
  return FIELDS.filter((field) => callOf(run, field.id) !== undefined);
}

function valueOf(field: ExtractedField, edits: Record<string, string>) {
  return edits[field.id] ?? field.value;
}

function recordOf(
  fields: ExtractedField[],
  run: RunSnapshot,
  edits: Record<string, string>
) {
  const record: Record<string, string> = {};
  for (const field of fields) {
    const output = outputOf(callOf(run, field.id));
    if (!output) {
      continue;
    }
    record[field.key] = valueOf(field, edits);
  }
  return record;
}

function progressWordsOf(read: number, total: number): WordRollWord[] {
  const countWord = {
    key: 'read',
    text: String(read),
    node: <MotionNumber value={read} />,
  };
  if (read === total) {
    return ['All', countWord, 'fields', 'read'];
  }
  return [countWord, 'of', String(total), 'fields', 'read'];
}

export default function Review09() {
  const [checks, setChecks] = useState<Record<string, FieldCheck>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [tab, setTab] = useState<Tab>('fields');
  const [saveState, setSaveState] = useState<MorphState>('idle');
  const [notice, setNotice] = useState('');
  const fieldNodes = useRef(new Map<string, HTMLElement>());
  const regionNodes = useRef(new Map<string, HTMLElement>());
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const risePresence = risePresenceOf(shouldReduceMotion);
  const { schedule, clearAll } = useTimeouts();
  const { ref, snapshot, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
  });
  const readFields = readFieldsOf(snapshot);
  const isAllRead = snapshot.status === 'done';
  const unchecked = LOW_FIELDS.filter(
    (field) => checks[field.id] === undefined
  );
  const reviewing = firstReviewOf(unchecked, isAllRead);
  const checkedCount = LOW_FIELDS.length - unchecked.length;
  const isReviewed = isAllRead && unchecked.length === 0;
  const isSaved = saveState === 'done';
  const isFieldsTab = tab === 'fields';
  const activeId = activeIdOf(hoveredId, reviewing, isFieldsTab);
  const shownThread = threadFor(thread, activeId);
  const record = recordOf(FIELDS, snapshot, edits);
  const progressWords = progressWordsOf(readFields.length, FIELDS.length);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    if (!activeId) {
      return;
    }
    const fieldId = activeId;
    const observer = new ResizeObserver(() => {
      const field = fieldNodes.current.get(fieldId);
      const region = regionNodes.current.get(fieldId);
      if (!field || !region) {
        return;
      }
      const geometry = threadOf(root, field, region);
      setThread({ fieldId, ...geometry });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [ref, activeId]);

  function registerField(id: string, node: HTMLElement | null) {
    if (node) {
      fieldNodes.current.set(id, node);
      return;
    }
    fieldNodes.current.delete(id);
  }

  function registerRegion(id: string, node: HTMLElement | null) {
    if (node) {
      regionNodes.current.set(id, node);
      return;
    }
    regionNodes.current.delete(id);
  }

  function enter(id: string) {
    setHoveredId(id);
  }

  function leave() {
    setHoveredId(null);
  }

  function confirm(fieldId: string) {
    setChecks((current) => ({ ...current, [fieldId]: 'confirmed' }));
    const field = FIELDS.find((candidate) => candidate.id === fieldId);
    setNotice(`${field?.label ?? 'Field'} confirmed`);
  }

  function edit(fieldId: string, value: string) {
    setEdits((current) => ({ ...current, [fieldId]: value }));
    setChecks((current) => ({ ...current, [fieldId]: 'edited' }));
    const field = FIELDS.find((candidate) => candidate.id === fieldId);
    setNotice(`${field?.label ?? 'Field'} changed to ${value}`);
  }

  function acceptAll() {
    if (!isReviewed) {
      return;
    }
    setSaveState('busy');
    schedule(() => {
      setSaveState('done');
      const fields = countOf(FIELDS.length, 'field');
      setNotice(`Saved ${fields} to Payables`);
    }, SAVING_MS);
  }

  function replay() {
    clearAll();
    setChecks({});
    setEdits({});
    setHoveredId(null);
    setSaveState('idle');
    setNotice('');
    restart();
  }

  function changeTab(value: unknown) {
    const next = tabFrom(value);
    setTab(next);
  }

  return (
    <div
      ref={ref}
      className='bg-card hairline-ring ring-border @container relative w-full max-w-[52rem] rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='grid grid-cols-1 gap-4 @xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]'>
        <Invoice
          activeId={activeId}
          register={registerRegion}
          onEnter={enter}
          onLeave={leave}
        />
        <div className='flex min-w-0 flex-col gap-3'>
          <Tabs value={tab} onValueChange={changeTab} className='gap-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-muted-foreground text-xs'>
                <WordRoll words={progressWords} />
              </span>
              <TabsList variant='segmented'>
                <TabsTab value='fields'>Fields</TabsTab>
                <TabsTab value='json'>JSON</TabsTab>
              </TabsList>
            </div>
            <TabsPanel value='fields'>
              <ul aria-label='Extracted fields' className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {readFields.map((field) => {
                    const call = callOf(snapshot, field.id);
                    const isRead = outputOf(call) !== null;
                    const status = statusOf(field, isRead, checks[field.id]);
                    return (
                      <motion.li
                        key={field.id}
                        className='overflow-hidden'
                        {...rowPresence}
                      >
                        <FieldRow
                          field={field}
                          value={valueOf(field, edits)}
                          status={status}
                          isActive={activeId === field.id}
                          register={registerField}
                          onEnter={enter}
                          onLeave={leave}
                        />
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </TabsPanel>
            <TabsPanel value='json'>
              <JsonView value={record} className='max-h-80 overflow-y-auto' />
            </TabsPanel>
          </Tabs>
          <AnimatedSize>
            <AnimatePresence initial={false} mode='popLayout'>
              {reviewing && (
                <motion.div key={reviewing.id} {...risePresence}>
                  <ReviewCard
                    field={reviewing}
                    position={checkedCount + 1}
                    total={LOW_FIELDS.length}
                    onConfirm={confirm}
                    onEdit={edit}
                  />
                </motion.div>
              )}
              {isReviewed && (
                <motion.div
                  key='accept'
                  className='flex flex-wrap items-center gap-2'
                  {...risePresence}
                >
                  <p className='text-muted-foreground min-w-0 flex-1 text-xs'>
                    {acceptLineOf(isSaved)}
                  </p>
                  <ReplayButton
                    isShown={isSaved}
                    onReplay={replay}
                    label='Read again'
                  />
                  <MorphButton
                    type='button'
                    size='sm'
                    state={saveState}
                    labels={SAVE_LABELS}
                    onClick={acceptAll}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </AnimatedSize>
        </div>
      </div>
      <ThreadLayer thread={shownThread} />
      <LiveRegion message={notice} />
    </div>
  );
}

const SAVE_LABELS: Record<MorphState, string> = {
  idle: 'Accept all',
  busy: 'Saving',
  done: 'Saved',
};

function acceptLineOf(isSaved: boolean) {
  if (isSaved) {
    return 'Saved to Payables';
  }
  return 'Every unsure field is checked';
}

function firstReviewOf(unchecked: ExtractedField[], isAllRead: boolean) {
  if (!isAllRead) {
    return undefined;
  }
  return unchecked[0];
}

function activeIdOf(
  hoveredId: string | null,
  reviewing: ExtractedField | undefined,
  isFieldsTab: boolean
) {
  if (!isFieldsTab) {
    return null;
  }
  if (hoveredId) {
    return hoveredId;
  }
  return reviewing?.id ?? null;
}

function tabFrom(value: unknown): Tab {
  if (value === 'json') {
    return 'json';
  }
  return 'fields';
}
