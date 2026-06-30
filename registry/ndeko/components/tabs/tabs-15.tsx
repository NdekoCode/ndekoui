'use client';

import {
  BoxIcon,
  HouseIcon,
  PanelsTopLeftIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useTooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

const PANELS = [
  {
    value: 'overview',
    content: 'Open tasks, recent activity and the next deadlines.',
  },
  {
    value: 'projects',
    content: 'Three active projects, sorted by their latest update.',
  },
  {
    value: 'packages',
    content:
      'Packages published from this workspace, with their latest version.',
  },
];

const ICON_COUNT =
  'keycap-3d absolute -top-1.5 left-full inline-flex h-4 min-w-4 -translate-x-2 items-center justify-center rounded-[4px] px-0.5 text-[10px] font-medium tabular-nums text-muted-foreground';

export default function Tabs15() {
  const tabHint = useTooltipHandle<string>();

  return (
    <Tabs defaultValue='overview' className='items-center'>
      <TabsList variant='segmented'>
        <TooltipTrigger
          handle={tabHint}
          payload='Overview'
          delay={0}
          closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
          render={<TabsTab value='overview' aria-label='Overview' />}
        >
          <HouseIcon />
        </TooltipTrigger>
        <TooltipTrigger
          handle={tabHint}
          payload='Projects'
          delay={0}
          closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
          render={<TabsTab value='projects' aria-label='Projects, 3 active' />}
        >
          <span className='relative flex'>
            <PanelsTopLeftIcon />
            <span className={ICON_COUNT}>3</span>
          </span>
        </TooltipTrigger>
        <TooltipTrigger
          handle={tabHint}
          payload='Packages'
          delay={0}
          closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
          render={<TabsTab value='packages' aria-label='Packages' />}
        >
          <BoxIcon />
        </TooltipTrigger>
      </TabsList>
      <Tooltip handle={tabHint}>
        {({ payload }) => <TooltipContent glide>{payload}</TooltipContent>}
      </Tooltip>
      <AnimatedSize>
        {PANELS.map((panel) => (
          <TabsPanel key={panel.value} value={panel.value}>
            <p className='text-muted-foreground p-4 text-center text-xs'>
              {panel.content}
            </p>
          </TabsPanel>
        ))}
      </AnimatedSize>
    </Tabs>
  );
}
