'use client';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  type TooltipHandle,
  TooltipProvider,
  TooltipTrigger,
  useTooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

type PanSide = 'top' | 'right' | 'bottom' | 'left';

type PanDirection = {
  label: string;
  hint: string;
  shortcut: string;
  side: PanSide;
  icon: Icon;
  className?: string;
};

const PAN_UP: PanDirection = {
  label: 'Pan camera up',
  hint: 'Pan up',
  shortcut: 'T',
  side: 'top',
  icon: ChevronUpIcon,
  className: 'col-start-2',
};

const PAN_LEFT: PanDirection = {
  label: 'Pan camera left',
  hint: 'Pan left',
  shortcut: 'L',
  side: 'left',
  icon: ChevronLeftIcon,
  className: 'col-start-1',
};

const PAN_RIGHT: PanDirection = {
  label: 'Pan camera right',
  hint: 'Pan right',
  shortcut: 'R',
  side: 'right',
  icon: ChevronRightIcon,
};

const PAN_DOWN: PanDirection = {
  label: 'Pan camera down',
  hint: 'Pan down',
  shortcut: 'B',
  side: 'bottom',
  icon: ChevronDownIcon,
  className: 'col-start-2',
};

function sideOf(direction: PanDirection | undefined): PanSide {
  if (!direction) {
    return 'top';
  }
  return direction.side;
}

type PanButtonProps = {
  direction: PanDirection;
  panHint: TooltipHandle<PanDirection>;
};

function PanButton({ direction, panHint }: PanButtonProps) {
  return (
    <TooltipTrigger
      handle={panHint}
      payload={direction}
      closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
      render={
        <Button
          variant='outline'
          size='icon'
          aria-label={direction.label}
          className={direction.className}
        />
      }
    >
      <direction.icon />
    </TooltipTrigger>
  );
}

function PanHint({ direction }: { direction: PanDirection | undefined }) {
  if (!direction) {
    return null;
  }
  return (
    <span className='flex items-center gap-2'>
      {direction.hint}
      <KbdGroup className='-me-1'>
        <Kbd>⌘</Kbd>
        <Kbd>{direction.shortcut}</Kbd>
      </KbdGroup>
    </span>
  );
}

export default function Tooltip07() {
  const panHint = useTooltipHandle<PanDirection>();

  return (
    <TooltipProvider delay={0}>
      <div className='inline-grid w-fit grid-cols-3 gap-1'>
        <PanButton direction={PAN_UP} panHint={panHint} />
        <PanButton direction={PAN_LEFT} panHint={panHint} />
        <div className='flex items-center justify-center' aria-hidden='true'>
          <CircleIcon className='size-4 opacity-60' />
        </div>
        <PanButton direction={PAN_RIGHT} panHint={panHint} />
        <PanButton direction={PAN_DOWN} panHint={panHint} />
      </div>
      <Tooltip handle={panHint}>
        {({ payload }) => (
          <TooltipContent glide side={sideOf(payload)}>
            <PanHint direction={payload} />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
