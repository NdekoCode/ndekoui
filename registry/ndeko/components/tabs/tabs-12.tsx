import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import {
  BoxIcon,
  ChartLineIcon,
  HouseIcon,
  PanelsTopLeftIcon,
  SettingsIcon,
  UsersRoundIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ScrollArea } from '@/registry/ndeko/ui/scroll-area';
import { Tabs, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

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
  {
    value: 'team',
    content: 'Members of the workspace and the role of each one.',
  },
  {
    value: 'insights',
    content: 'Weekly throughput and cycle time for every project.',
  },
  {
    value: 'settings',
    content: 'Workspace name, billing contact and connected apps.',
  },
];

const LIST =
  'hairline-b border-border relative mb-2.5 flex w-max min-w-full items-center gap-1 py-1';

const INDICATOR =
  'pointer-events-none absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-primary transition-[translate,width] duration-300 ease-(--ease-out-strong)';

const TAB = 'h-8 rounded-md px-2.5 hover:bg-foreground/5';

const COUNT =
  'keycap-3d inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-[11px] font-medium tabular-nums text-muted-foreground';

export default function Tabs12() {
  return (
    <Tabs defaultValue='overview' className='w-full min-w-0'>
      <ScrollArea>
        <TabsPrimitive.List className={LIST}>
          <TabsTab value='overview' className={TAB}>
            <HouseIcon className='-ms-0.5 opacity-60' />
            Overview
          </TabsTab>
          <TabsTab value='projects' className={TAB}>
            <PanelsTopLeftIcon className='-ms-0.5 opacity-60' />
            Projects
            <span className={COUNT}>3</span>
          </TabsTab>
          <TabsTab value='packages' className={TAB}>
            <BoxIcon className='-ms-0.5 opacity-60' />
            Packages
            <Badge>New</Badge>
          </TabsTab>
          <TabsTab value='team' className={TAB}>
            <UsersRoundIcon className='-ms-0.5 opacity-60' />
            Team
          </TabsTab>
          <TabsTab value='insights' className={TAB}>
            <ChartLineIcon className='-ms-0.5 opacity-60' />
            Insights
          </TabsTab>
          <TabsTab value='settings' className={TAB}>
            <SettingsIcon className='-ms-0.5 opacity-60' />
            Settings
          </TabsTab>
          <TabsPrimitive.Indicator className={INDICATOR} />
        </TabsPrimitive.List>
      </ScrollArea>
      <AnimatedSize>
        {PANELS.map((panel) => (
          <TabsPanel key={panel.value} value={panel.value}>
            <p className='text-muted-foreground px-4 pb-4 text-center text-xs'>
              {panel.content}
            </p>
          </TabsPanel>
        ))}
      </AnimatedSize>
    </Tabs>
  );
}
