'use client';

import {
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type TooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

export type Viewport = 'desktop' | 'tablet' | 'phone';

/** Every control of a preview toolbar shares one tooltip that glides between them. */
export type PreviewHint = Viewport | 'reload' | 'full-page';

type ViewportOption = {
  value: Viewport;
  icon: Icon;
  /** What the option aims for; the current option shows the measured width of the frame instead. */
  target: string;
};

const VIEWPORTS: ViewportOption[] = [
  { value: 'desktop', icon: MonitorIcon, target: 'Full width' },
  { value: 'tablet', icon: TabletIcon, target: '768 px' },
  { value: 'phone', icon: SmartphoneIcon, target: '375 px' },
];

const HINT_LABELS: Record<PreviewHint, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  phone: 'Phone',
  reload: 'Reload preview',
  'full-page': 'Open full page',
};

export const VIEWPORT_WIDTH_CLASS: Record<Viewport, string> = {
  desktop: 'w-full',
  tablet: 'w-[48rem] max-w-full',
  phone: 'w-[23.4375rem] max-w-full',
};

const ICON_TAB = 'group-data-[variant=segmented]/tabs-list:px-2';

export function isViewport(value: unknown): value is Viewport {
  return VIEWPORTS.some((option) => option.value === value);
}

type ViewportSwitchProps = {
  value: Viewport;
  onValueChange: (viewport: Viewport) => void;
  hint: TooltipHandle<PreviewHint>;
  label: string;
  className?: string;
};

export function ViewportSwitch({
  value,
  onValueChange,
  hint,
  label,
  className,
}: ViewportSwitchProps) {
  function changeViewport(next: unknown) {
    if (isViewport(next)) {
      onValueChange(next);
    }
  }

  return (
    <Tabs value={value} onValueChange={changeViewport} className={className}>
      <TabsList variant='segmented' aria-label={label}>
        {VIEWPORTS.map((option) => (
          <TooltipTrigger
            key={option.value}
            handle={hint}
            payload={option.value}
            closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
            render={
              <TabsTab
                value={option.value}
                aria-label={HINT_LABELS[option.value]}
                className={ICON_TAB}
              />
            }
          >
            <option.icon />
          </TooltipTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function viewportTargetOf(viewport: Viewport) {
  const option = VIEWPORTS.find((candidate) => candidate.value === viewport);
  if (!option) {
    return null;
  }
  return option.target;
}

function hintDetailOf(
  hint: PreviewHint,
  viewport: Viewport,
  frameWidth: number | null
) {
  if (hint === 'full-page') {
    return 'New tab';
  }
  if (!isViewport(hint)) {
    return null;
  }
  const isCurrent = hint === viewport;
  const isMeasured = frameWidth !== null;
  if (isCurrent && isMeasured) {
    const wholeWidth = Math.round(frameWidth);
    return `${wholeWidth} px`;
  }
  return viewportTargetOf(hint);
}

type PreviewHintLabelProps = {
  hint: PreviewHint | undefined;
  viewport: Viewport;
  frameWidth: number | null;
};

function PreviewHintLabel({
  hint,
  viewport,
  frameWidth,
}: PreviewHintLabelProps) {
  if (!hint) {
    return null;
  }
  const detail = hintDetailOf(hint, viewport, frameWidth);

  return (
    <span className='flex items-center gap-1.5'>
      {HINT_LABELS[hint]}
      {detail && (
        <span className='text-muted-foreground tabular-nums'>{detail}</span>
      )}
    </span>
  );
}

type PreviewHintTooltipProps = {
  hint: TooltipHandle<PreviewHint>;
  viewport: Viewport;
  frameWidth: number | null;
  side?: 'top' | 'bottom';
};

/** The width of the current viewport is the live width of the frame, so it follows the frame while it resizes. */
export function PreviewHintTooltip({
  hint,
  viewport,
  frameWidth,
  side = 'top',
}: PreviewHintTooltipProps) {
  return (
    <Tooltip handle={hint}>
      {({ payload }) => (
        <TooltipContent glide side={side}>
          <PreviewHintLabel
            hint={payload}
            viewport={viewport}
            frameWidth={frameWidth}
          />
        </TooltipContent>
      )}
    </Tooltip>
  );
}
