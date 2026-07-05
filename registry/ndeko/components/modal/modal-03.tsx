'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Switch } from '@/registry/ndeko/ui/switch';

import { ActionButton, useTimedAction } from './_parts/action-button';
import { CopyButton } from './_parts/copy-button';
import {
  ModalDescription,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { SWAP_TRANSITION, swapVariantsOf } from './_parts/motion';
import { TEAM_NAME } from './_parts/people';
import { Swap } from './_parts/swap';

type ExpiryValue = '1' | '7' | '30' | 'never';

type ExpiryOption = { value: ExpiryValue; label: string; line: string };

type InviteLink = { token: string; code: string[] };

const LINK_BASE = 'https://lattice.example/join/';

const LINKS: InviteLink[] = [
  { token: '7q4m-92kd-h3xa', code: ['7Q4M', '92KD'] },
  { token: 'p5zr-wb81-c6tn', code: ['P5ZR', 'WB81'] },
  { token: 'k2vf-ye47-m9qd', code: ['K2VF', 'YE47'] },
];

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { value: '1', label: '1 day', line: 'The link stops working tomorrow' },
  { value: '7', label: '7 days', line: 'The link stops working on Nov 12' },
  { value: '30', label: '30 days', line: 'The link stops working on Dec 5' },
  { value: 'never', label: 'Never', line: 'The link works until you reset it' },
];

const QR_MODULES = 25;

const QR_QUIET_ZONE = 2;

const FINDER_SIZE = 7;

const QR_VIEWBOX_SIZE = QR_MODULES + QR_QUIET_ZONE * 2;

function hashOf(text: string) {
  let hash = 2166136261;
  for (const character of text) {
    const code = character.charCodeAt(0);
    hash ^= code;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomStreamOf(seed: number) {
  let state = seed || 1;
  return function next() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const unsigned = state >>> 0;
    return unsigned / 4294967296;
  };
}

function finderOriginOf(row: number, column: number) {
  const far = QR_MODULES - FINDER_SIZE;
  const isTop = row < FINDER_SIZE + 1;
  const isLeft = column < FINDER_SIZE + 1;
  const isBottom = row >= far - 1;
  const isRight = column >= far - 1;
  const isTopLeft = isTop && isLeft;
  const isTopRight = isTop && isRight;
  const isBottomLeft = isBottom && isLeft;
  if (isTopLeft) {
    return { row: 0, column: 0 };
  }
  if (isTopRight) {
    return { row: 0, column: far };
  }
  if (isBottomLeft) {
    return { row: far, column: 0 };
  }
  return null;
}

function isFinderDark(localRow: number, localColumn: number) {
  const isInside = localRow >= 0 && localRow < FINDER_SIZE;
  const isInsideColumn = localColumn >= 0 && localColumn < FINDER_SIZE;
  if (!isInside || !isInsideColumn) {
    return false;
  }
  const isEdgeRow = localRow === 0 || localRow === FINDER_SIZE - 1;
  const isEdgeColumn = localColumn === 0 || localColumn === FINDER_SIZE - 1;
  const isCoreRow = localRow >= 2 && localRow <= 4;
  const isCoreColumn = localColumn >= 2 && localColumn <= 4;
  const isEdge = isEdgeRow || isEdgeColumn;
  const isCore = isCoreRow && isCoreColumn;
  return isEdge || isCore;
}

/**
 * Draws a code with the look of a QR code, derived from the link so it changes when the link does. It is not a
 * scannable QR encoding: plug a QR encoder in to make it one.
 */
function qrPathOf(text: string) {
  const random = randomStreamOf(hashOf(text));
  const segments: string[] = [];
  for (let row = 0; row < QR_MODULES; row += 1) {
    for (let column = 0; column < QR_MODULES; column += 1) {
      const origin = finderOriginOf(row, column);
      let isDark = random() > 0.52;
      if (origin) {
        const localRow = row - origin.row;
        const localColumn = column - origin.column;
        isDark = isFinderDark(localRow, localColumn);
      }
      if (!isDark) {
        continue;
      }
      const x = column + QR_QUIET_ZONE;
      const y = row + QR_QUIET_ZONE;
      segments.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return segments.join('');
}

function isExpiryValue(value: unknown): value is ExpiryValue {
  return EXPIRY_OPTIONS.some((option) => option.value === value);
}

function approvalLineOf(needsApproval: boolean) {
  if (needsApproval) {
    return 'They wait in Requests until a manager lets them in';
  }
  return `They join the ${TEAM_NAME} team as members right away`;
}

function QrCode({ url }: { url: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion, 'label');
  const path = useMemo(() => qrPathOf(url), [url]);
  const viewBox = `0 0 ${QR_VIEWBOX_SIZE} ${QR_VIEWBOX_SIZE}`;

  return (
    <div className='bg-card hairline-ring ring-border relative size-40 overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <AnimatePresence initial={false}>
        <motion.svg
          key={url}
          viewBox={viewBox}
          role='img'
          aria-label='Illustrative code of the invite link'
          shapeRendering='crispEdges'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='text-foreground absolute inset-0 size-full'
        >
          <path d={path} fill='currentColor' />
        </motion.svg>
      </AnimatePresence>
    </div>
  );
}

function InviteLinkContent() {
  const [linkIndex, setLinkIndex] = useState(0);
  const [expiry, setExpiry] = useState<ExpiryValue>('7');
  const [needsApproval, setNeedsApproval] = useState(false);
  const resetAction = useTimedAction();
  const linkFieldId = useId();
  const expiryLabelId = useId();
  const approvalId = useId();
  const link = LINKS[linkIndex];
  const url = `${LINK_BASE}${link.token}`;
  const codeText = link.code.join('-');
  const codeKey = link.code.join('');
  const expiryOption = EXPIRY_OPTIONS.find((option) => option.value === expiry);
  const expiryLine = expiryOption?.line ?? '';
  const approvalLine = approvalLineOf(needsApproval);

  function changeExpiry(value: unknown) {
    if (isExpiryValue(value)) {
      setExpiry(value);
    }
  }

  function commitReset() {
    setLinkIndex((previous) => {
      const next = previous + 1;
      return next % LINKS.length;
    });
  }

  function resetLink() {
    resetAction.run(commitReset);
  }

  return (
    <div className='grid gap-6 sm:grid-cols-[minmax(0,1fr)_13rem]'>
      <div className='flex min-w-0 flex-col gap-5'>
        <ModalHeader>
          <ModalTitle>Invite with a link</ModalTitle>
          <ModalDescription>
            {`Anyone with this link can join the ${TEAM_NAME} team`}
          </ModalDescription>
        </ModalHeader>
        <div className='flex flex-col gap-1.5'>
          <label htmlFor={linkFieldId} className='text-[13px] font-medium'>
            Invite link
          </label>
          <div className='flex items-center gap-2'>
            <Input
              id={linkFieldId}
              readOnly
              value={url}
              className='text-muted-foreground min-w-0 flex-1 truncate'
            />
            <CopyButton
              text={url}
              label='Copy'
              size='default'
              announcement='Invite link copied'
            />
          </div>
        </div>
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between gap-3'>
            <span id={expiryLabelId} className='text-[13px] font-medium'>
              Link expires after
            </span>
            <Select
              items={EXPIRY_OPTIONS}
              value={expiry}
              onValueChange={changeExpiry}
            >
              <SelectTrigger aria-labelledby={expiryLabelId} className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align='end'>
                {EXPIRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Swap
            swapKey={expiryLine}
            kind='label'
            className='text-muted-foreground flex text-xs'
          >
            {expiryLine}
          </Swap>
        </div>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <label htmlFor={approvalId} className='text-[13px] font-medium'>
              Approve people who join
            </label>
            <Swap
              swapKey={approvalLine}
              kind='label'
              className='text-muted-foreground flex min-w-0 text-xs'
              contentClassName='max-w-full min-w-0 whitespace-normal'
            >
              {approvalLine}
            </Swap>
          </div>
          <Switch
            id={approvalId}
            checked={needsApproval}
            onCheckedChange={setNeedsApproval}
          />
        </div>
        <div className='flex items-center gap-2'>
          <ActionButton
            variant='outline'
            size='sm'
            state={resetAction.state}
            onClick={resetLink}
            idleIcon={<RefreshCwIcon />}
            labels={{
              idle: 'Reset link',
              working: 'Resetting',
              done: 'New link ready',
            }}
          />
          <p className='text-muted-foreground text-xs'>
            The old link and code stop working
          </p>
        </div>
      </div>
      <div className='bg-foreground/[0.03] flex flex-col items-center gap-4 rounded-xl px-4 py-5 text-center'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-[13px] font-medium'>Scan to join</p>
          <p className='text-muted-foreground text-xs'>
            Opens the invite on a phone
          </p>
        </div>
        <QrCode url={url} />
        <p className='text-muted-foreground text-xs'>or enter the code</p>
        <div className='flex items-center gap-1.5'>
          <Swap swapKey={codeKey} kind='label' className='gap-1'>
            {link.code.map((part) => (
              <span
                key={part}
                className='keycap-3d rounded-md px-2 py-1 font-mono text-[13px] font-medium tabular-nums'
              >
                {part}
              </span>
            ))}
          </Swap>
          <CopyButton
            text={codeText}
            variant='ghost'
            size='icon-sm'
            aria-label='Copy the invite code'
            announcement='Invite code copied'
            className='text-muted-foreground'
          />
        </div>
      </div>
    </div>
  );
}

export default function Modal03() {
  return (
    <ModalPreview triggerLabel='Open the invite link dialog' size='xl'>
      <InviteLinkContent />
    </ModalPreview>
  );
}
