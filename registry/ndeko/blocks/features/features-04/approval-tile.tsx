'use client';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CircleDashedIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Wash } from '@/registry/ndeko/ui/wash';

import { APPROVAL, TILES } from './data';
import type { Approval } from './session';
import { Tile } from './tile';

function layerClassOf(isActive: boolean) {
  if (isActive) {
    return 'opacity-100 transition-opacity delay-100 duration-200 ease-(--ease-out-strong)';
  }
  return 'pointer-events-none opacity-0 transition-opacity duration-150';
}

type ApprovalTileProps = {
  approval: Approval;
  isApprovePressed: boolean;
  onApprove: () => void;
  onDecline: () => void;
};

export function ApprovalTile({
  approval,
  isApprovePressed,
  onApprove,
  onDecline,
}: ApprovalTileProps) {
  const isNone = approval === 'none';
  const isWaiting = approval === 'waiting';
  const isApproved = approval === 'approved';
  const isDeclined = approval === 'declined';

  return (
    <Tile copy={TILES.approval}>
      <Wash color='var(--warning)' isShown={isWaiting} />
      <div className='grid *:col-start-1 *:row-start-1'>
        <p
          inert={!isNone}
          aria-hidden={!isNone}
          className={cn(
            'text-muted-foreground flex items-center gap-2 text-[13px]',
            layerClassOf(isNone)
          )}
        >
          <CircleDashedIcon className='size-4 shrink-0' />
          Nothing is waiting for you
        </p>
        <div
          inert={!isWaiting}
          aria-hidden={!isWaiting}
          className={cn(
            'bg-card dark:bg-foreground/[0.06] flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
            layerClassOf(isWaiting)
          )}
        >
          <div className='flex flex-col gap-1'>
            <p className='text-[13px] font-medium'>{APPROVAL.title}</p>
            <p className='text-muted-foreground text-xs text-pretty'>
              {APPROVAL.detail}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              onClick={onApprove}
              className={pressedSolidOf(isApprovePressed)}
            >
              Approve
            </Button>
            <Button size='sm' variant='outline' onClick={onDecline}>
              Decline
            </Button>
          </div>
        </div>
        <p
          inert={!isApproved}
          aria-hidden={!isApproved}
          className={cn(
            'flex items-center gap-2 text-[13px]',
            layerClassOf(isApproved)
          )}
        >
          {isApproved && <DrawnCheck tone='success' entrance='draw' />}
          Approved, 38 matches posted
        </p>
        <p
          inert={!isDeclined}
          aria-hidden={!isDeclined}
          className={cn(
            'text-muted-foreground flex items-center gap-2 text-[13px]',
            layerClassOf(isDeclined)
          )}
        >
          <XIcon className='size-4 shrink-0' />
          Declined, the step was skipped
        </p>
      </div>
    </Tile>
  );
}
