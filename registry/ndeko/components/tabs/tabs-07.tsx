import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

const TABS = [
  {
    value: 'overview',
    label: 'Overview',
    content: 'Open tasks, recent activity and the next deadlines.',
  },
  {
    value: 'projects',
    label: 'Projects',
    content: 'Three active projects, sorted by their latest update.',
  },
  {
    value: 'packages',
    label: 'Packages',
    content:
      'Packages published from this workspace, with their latest version.',
  },
];

const LIST =
  'relative flex w-full gap-0.5 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-(--hairline) before:bg-border';

const FOLDER_TAB = [
  'h-8 rounded-t-lg px-3 hairline-x hairline-t border-border bg-foreground/[0.03]',
  'data-active:bg-card',
].join(' ');

export default function Tabs07() {
  return (
    <Tabs defaultValue='overview' className='w-full'>
      <TabsPrimitive.List className={LIST}>
        {TABS.map((tab) => (
          <TabsTab key={tab.value} value={tab.value} className={FOLDER_TAB}>
            {tab.label}
          </TabsTab>
        ))}
      </TabsPrimitive.List>
      <AnimatedSize>
        {TABS.map((tab) => (
          <TabsPanel key={tab.value} value={tab.value}>
            <p className='text-muted-foreground p-4 text-center text-xs'>
              {tab.content}
            </p>
          </TabsPanel>
        ))}
      </AnimatedSize>
    </Tabs>
  );
}
