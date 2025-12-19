import {
  BoxIcon,
  HouseIcon,
  PanelsTopLeftIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
  return (
    <Tabs defaultValue='overview' className='items-center'>
      <TabsList variant='segmented'>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={<TabsTab value='overview' aria-label='Overview' />}
          >
            <HouseIcon />
          </TooltipTrigger>
          <TooltipContent>Overview</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <TabsTab value='projects' aria-label='Projects, 3 active' />
            }
          >
            <span className='relative flex'>
              <PanelsTopLeftIcon />
              <span className={ICON_COUNT}>3</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>Projects</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={<TabsTab value='packages' aria-label='Packages' />}
          >
            <BoxIcon />
          </TooltipTrigger>
          <TooltipContent>Packages</TooltipContent>
        </Tooltip>
      </TabsList>
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
