import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

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

const PANEL_CARD =
  'grow rounded-xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border';

export default function Tabs17() {
  return (
    <Tabs defaultValue='overview' orientation='vertical' className='w-full'>
      <TabsList variant='segmented' className='flex-col self-start'>
        {TABS.map((tab) => (
          <TabsTab key={tab.value} value={tab.value} className='w-full'>
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>
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
