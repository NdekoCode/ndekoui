'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  LaptopIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

import type { DeviceKind, SignedInDevice } from './data';
import { devicesWordOf } from './session';
import { SURFACE } from './settings-frame';

const DEVICE_ICON: Record<DeviceKind, Icon> = {
  laptop: LaptopIcon,
  phone: SmartphoneIcon,
  desktop: MonitorIcon,
  tablet: TabletIcon,
};

type DeviceRowProps = {
  device: SignedInDevice;
  isPressed: boolean;
  onSignOut: (id: string) => void;
};

function DeviceRow({ device, isPressed, onSignOut }: DeviceRowProps) {
  const DeviceIcon = DEVICE_ICON[device.kind];

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3'>
      <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
        <DeviceIcon className='size-4' />
      </span>
      <div className='flex min-w-0 flex-1 basis-44 flex-col gap-0.5'>
        <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium'>
          <span className='min-w-0'>{device.device}</span>
          {device.isThisDevice && <Badge>This device</Badge>}
        </p>
        <p className='text-muted-foreground text-xs'>
          {device.place} · {device.lastActive}
        </p>
      </div>
      {!device.isThisDevice && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-sign-out={device.id}
          onClick={() => onSignOut(device.id)}
          className={cn('text-muted-foreground', pressedQuietOf(isPressed))}
        >
          Sign out
        </Button>
      )}
    </div>
  );
}

type SignOutAllConfirmProps = {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

function SignOutAllConfirm({
  count,
  onCancel,
  onConfirm,
}: SignOutAllConfirmProps) {
  function cancelOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onCancel();
  }

  return (
    <div
      role='group'
      aria-label='Sign out of every other device'
      onKeyDown={cancelOnEscape}
      className='bg-foreground/[0.03] flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3'
    >
      <p className='min-w-0 flex-1 basis-56 text-[13px] text-pretty'>
        <span className='font-medium'>{`Sign out of ${devicesWordOf(count)}?`}</span>{' '}
        Each one asks for a new sign-in.
      </p>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-sign-out-cancel
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type='button'
          variant='destructive'
          size='sm'
          onClick={onConfirm}
        >
          Sign out all
        </Button>
      </div>
    </div>
  );
}

type DeviceListProps = {
  devices: SignedInDevice[];
  otherCount: number;
  isConfirmingAll: boolean;
  pressed: string | null;
  onSignOut: (id: string) => void;
  onCancelAll: () => void;
  onConfirmAll: () => void;
};

/** A device signed out folds away; the confirm for all of them opens above the list, in place. */
export function DeviceList({
  devices,
  otherCount,
  isConfirmingAll,
  pressed,
  onSignOut,
  onCancelAll,
  onConfirmAll,
}: DeviceListProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);

  return (
    <div className={cn(SURFACE, 'overflow-hidden')}>
      <Fold open={isConfirmingAll}>
        <SignOutAllConfirm
          count={otherCount}
          onCancel={onCancelAll}
          onConfirm={onConfirmAll}
        />
      </Fold>
      <ul
        data-devices
        tabIndex={-1}
        aria-label='Signed-in devices'
        className='hairline-divide-y divide-border flex flex-col outline-none'
      >
        <AnimatePresence initial={false}>
          {devices.map((device) => (
            <motion.li
              key={device.id}
              className='overflow-hidden'
              {...presence}
            >
              <DeviceRow
                device={device}
                isPressed={pressed === `sign-out-${device.id}`}
                onSignOut={onSignOut}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
