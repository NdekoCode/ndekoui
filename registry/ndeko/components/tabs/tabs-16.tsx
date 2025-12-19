import {
  BoxIcon,
  HouseIcon,
  PanelsTopLeftIcon,
} from '@/registry/ndeko/lib/icons';
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

const PANEL_CARD =
  'grow rounded-xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border';

export default function Tabs16() {
  return (
    <Tabs defaultValue='overview' orientation='vertical' className='w-full'>
      <TabsList variant='segmented' className='flex-col self-start'>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={<TabsTab value='overview' aria-label='Overview' />}
          >
            <HouseIcon />
          </TooltipTrigger>
          <TooltipContent side='right'>Overview</TooltipContent>
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
          <TooltipContent side='right'>Projects</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={<TabsTab value='packages' aria-label='Packages' />}
          >
            <BoxIcon />
          </TooltipTrigger>
          <TooltipContent side='right'>Packages</TooltipContent>
        </Tooltip>
      </TabsList>
      <div className={PANEL_CARD}>
        {PANELS.map((panel) => (
          <TabsPanel key={panel.value} value={panel.value}>
            <p className='text-muted-foreground px-4 py-3 text-xs'>
              {panel.content}
            </p>
          </TabsPanel>
        ))}
      </div>
    </Tabs>
  );
}
