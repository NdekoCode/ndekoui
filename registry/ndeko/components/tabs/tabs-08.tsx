import {
  BoxIcon,
  HouseIcon,
  PanelsTopLeftIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ScrollArea } from '@/registry/ndeko/ui/scroll-area';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

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

const DIMMED_WHEN_INACTIVE =
  'opacity-50 transition-opacity group-data-active/tab:opacity-100';

const COUNT = [
  'keycap-3d inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-[11px] font-medium tabular-nums text-muted-foreground',
  DIMMED_WHEN_INACTIVE,
].join(' ');

export default function Tabs08() {
  return (
    <Tabs defaultValue='overview' className='w-full min-w-0'>
      <ScrollArea>
        <TabsList variant='segmented' className='mb-2.5'>
          <TabsTab value='overview'>
            <HouseIcon className='-ms-0.5 opacity-60' />
            Overview
          </TabsTab>
          <TabsTab value='projects' className='group/tab'>
            <PanelsTopLeftIcon className='-ms-0.5 opacity-60' />
            Projects
            <span className={COUNT}>3</span>
          </TabsTab>
          <TabsTab value='packages' className='group/tab'>
            <BoxIcon className='-ms-0.5 opacity-60' />
            Packages
            <Badge className={DIMMED_WHEN_INACTIVE}>New</Badge>
          </TabsTab>
        </TabsList>
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
