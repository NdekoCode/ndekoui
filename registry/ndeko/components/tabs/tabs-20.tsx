import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

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

const INDICATOR =
  'pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-y-(--active-tab-top) rounded-md bg-foreground/[0.06] transition-[translate,height] duration-200 ease-(--ease-out-strong)';

const PANEL_CARD =
  'grow rounded-xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border';

export default function Tabs20() {
  return (
    <Tabs defaultValue='overview' orientation='vertical' className='w-full'>
      <TabsPrimitive.List className='relative flex flex-col gap-1 self-start'>
        {TABS.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            className='h-8 w-full justify-start rounded-md px-3'
          >
            {tab.label}
          </TabsTab>
        ))}
        <TabsPrimitive.Indicator className={INDICATOR} />
      </TabsPrimitive.List>
      <div className={PANEL_CARD}>
        {TABS.map((tab) => (
          <TabsPanel key={tab.value} value={tab.value}>
            <p className='text-muted-foreground px-4 py-3 text-xs'>
              {tab.content}
            </p>
          </TabsPanel>
        ))}
      </div>
    </Tabs>
  );
}
