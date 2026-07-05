'use client';

import { createContext, useContext, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/registry/ndeko/ui/sheet';

export type DrawerSide = 'top' | 'right' | 'bottom' | 'left';

type Axis = 'x' | 'y';

type DragSample = { travel: number; time: number };

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  panelSize: number;
  isActive: boolean;
  samples: DragSample[];
};

const FLICK_VELOCITY = 0.11;

const DISMISS_FRACTION = 0.35;

const DRAG_THRESHOLD = 6;

const WRONG_WAY_LIMIT = 28;

const VELOCITY_WINDOW = 100;

const MAX_SAMPLES = 12;

const SNAP_BACK_MS = 300;

const DRAWER_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const CONTROLS =
  'button, a, input, select, textarea, label, [contenteditable="true"], [data-drawer-no-drag]';

const AXIS_OF: Record<DrawerSide, Axis> = {
  top: 'y',
  right: 'x',
  bottom: 'y',
  left: 'x',
};

const DISMISS_SIGN: Record<DrawerSide, number> = {
  top: -1,
  right: 1,
  bottom: 1,
  left: -1,
};

const TOUCH_ACTION: Record<DrawerSide, string> = {
  top: 'touch-pan-x',
  right: 'touch-pan-y',
  bottom: 'touch-pan-x',
  left: 'touch-pan-y',
};

const GRIP: Record<DrawerSide, string> = {
  top: 'bottom-2 left-1/2 h-1 w-10 -translate-x-1/2',
  right: 'left-2 top-1/2 h-10 w-1 -translate-y-1/2',
  bottom: 'top-2 left-1/2 h-1 w-10 -translate-x-1/2',
  left: 'right-2 top-1/2 h-10 w-1 -translate-y-1/2',
};

type DrawerContextValue = {
  close: () => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error(
      'DirectionalDrawerContent must be used inside DirectionalDrawer'
    );
  }
  return context;
}

export type DirectionalDrawerProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

function openStateOf(controlled: boolean | undefined, uncontrolled: boolean) {
  if (controlled === undefined) {
    return uncontrolled;
  }
  return controlled;
}

export function DirectionalDrawer({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: DirectionalDrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = openStateOf(open, uncontrolledOpen);

  function changeOpen(next: boolean) {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  function close() {
    changeOpen(false);
  }

  return (
    <DrawerContext.Provider value={{ close }}>
      <Sheet open={isOpen} onOpenChange={changeOpen}>
        {children}
      </Sheet>
    </DrawerContext.Provider>
  );
}

function travelOf(side: DrawerSide, deltaX: number, deltaY: number) {
  const sign = DISMISS_SIGN[side];
  if (AXIS_OF[side] === 'x') {
    return deltaX * sign;
  }
  return deltaY * sign;
}

function dampenedTravel(travel: number) {
  if (travel >= 0) {
    return travel;
  }
  const pull = -travel;
  const ratio = pull / WRONG_WAY_LIMIT;
  const reach = 1 - Math.exp(-ratio);
  const resisted = WRONG_WAY_LIMIT * reach;
  return -resisted;
}

function translationOf(side: DrawerSide, shown: number) {
  const offset = shown * DISMISS_SIGN[side];
  if (AXIS_OF[side] === 'x') {
    return `translate3d(${offset}px, 0, 0)`;
  }
  return `translate3d(0, ${offset}px, 0)`;
}

function sizeAlong(side: DrawerSide, element: HTMLElement) {
  const box = element.getBoundingClientRect();
  if (AXIS_OF[side] === 'x') {
    return box.width;
  }
  return box.height;
}

function velocityOf(samples: DragSample[]) {
  const latest = samples[samples.length - 1];
  const recent = samples.find(
    (sample) => latest.time - sample.time <= VELOCITY_WINDOW
  );
  if (!recent) {
    return 0;
  }
  const elapsed = latest.time - recent.time;
  if (elapsed <= 0) {
    return 0;
  }
  const covered = latest.travel - recent.travel;
  return covered / elapsed;
}

function startsOnControl(event: React.PointerEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  return target.closest(CONTROLS) !== null;
}

export type DirectionalDrawerContentProps = React.ComponentProps<
  typeof SheetContent
> & {
  side?: DrawerSide;
};

type PanelPointerEvent = Parameters<
  NonNullable<DirectionalDrawerContentProps['onPointerDown']>
>[0];

export function DirectionalDrawerContent({
  side = 'right',
  className,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...props
}: DirectionalDrawerContentProps) {
  const { close } = useDrawer();
  const prefersReducedMotion = usePrefersReducedMotion();
  const session = useRef<DragSession | null>(null);
  const snapAnimation = useRef<Animation | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function press(event: PanelPointerEvent) {
    onPointerDown?.(event);
    if (session.current) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    if (startsOnControl(event)) {
      return;
    }
    const panel = event.currentTarget;
    snapAnimation.current?.cancel();
    snapAnimation.current = null;
    session.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panelSize: sizeAlong(side, panel),
      isActive: false,
      samples: [],
    };
  }

  function follow(event: PanelPointerEvent) {
    onPointerMove?.(event);
    const current = session.current;
    if (!current) {
      return;
    }
    if (event.pointerId !== current.pointerId) {
      return;
    }
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    const travel = travelOf(side, deltaX, deltaY);
    const distance = Math.abs(travel);
    const isStillAPress = !current.isActive && distance < DRAG_THRESHOLD;
    if (isStillAPress) {
      return;
    }
    if (!current.isActive) {
      current.isActive = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      window.getSelection()?.removeAllRanges();
      setIsDragging(true);
    }
    current.samples.push({ travel, time: event.timeStamp });
    if (current.samples.length > MAX_SAMPLES) {
      current.samples.shift();
    }
    const shown = dampenedTravel(travel);
    event.currentTarget.style.transform = translationOf(side, shown);
  }

  function snapBack(panel: HTMLElement) {
    const from = panel.style.transform;
    panel.style.transform = '';
    if (prefersReducedMotion) {
      return;
    }
    snapAnimation.current = panel.animate(
      [{ transform: from }, { transform: 'none' }],
      { duration: SNAP_BACK_MS, easing: DRAWER_EASE }
    );
  }

  function release(event: PanelPointerEvent) {
    onPointerUp?.(event);
    finishDrag(event, true);
  }

  function cancel(event: PanelPointerEvent) {
    onPointerCancel?.(event);
    finishDrag(event, false);
  }

  function finishDrag(event: PanelPointerEvent, canDismiss: boolean) {
    const current = session.current;
    if (!current) {
      return;
    }
    if (event.pointerId !== current.pointerId) {
      return;
    }
    session.current = null;
    if (!current.isActive) {
      return;
    }
    setIsDragging(false);
    const lastSample = current.samples[current.samples.length - 1];
    const travel = lastSample?.travel ?? 0;
    const velocity = velocityOf(current.samples);
    const isFlick = velocity > FLICK_VELOCITY;
    const dismissDistance = current.panelSize * DISMISS_FRACTION;
    const isPastThreshold = travel > dismissDistance;
    const isPullingBack = velocity < -FLICK_VELOCITY;
    const isFarEnough = isPastThreshold && !isPullingBack;
    const shouldDismiss = isFlick || isFarEnough;
    if (canDismiss && shouldDismiss) {
      close();
      return;
    }
    snapBack(event.currentTarget);
  }

  return (
    <SheetContent
      side={side}
      data-dragging={isDragging}
      className={cn(
        TOUCH_ACTION[side],
        'data-[dragging=true]:cursor-grabbing data-[dragging=true]:select-none',
        className
      )}
      onPointerDown={press}
      onPointerMove={follow}
      onPointerUp={release}
      onPointerCancel={cancel}
      {...props}
    >
      <span
        aria-hidden='true'
        className={cn('bg-foreground/15 absolute rounded-full', GRIP[side])}
      />
      {children}
    </SheetContent>
  );
}

export {
  SheetClose as DirectionalDrawerClose,
  SheetDescription as DirectionalDrawerDescription,
  SheetFooter as DirectionalDrawerFooter,
  SheetHeader as DirectionalDrawerHeader,
  SheetTitle as DirectionalDrawerTitle,
  SheetTrigger as DirectionalDrawerTrigger,
};
