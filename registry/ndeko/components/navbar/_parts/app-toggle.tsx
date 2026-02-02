import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

function AppToggle() {
  return (
    <Tabs defaultValue='wireframe'>
      <TabsList variant='segmented' aria-label='View'>
        <TabsTab value='sitemap'>Sitemap</TabsTab>
        <TabsTab value='wireframe'>Wireframe</TabsTab>
      </TabsList>
    </Tabs>
  );
}

export { AppToggle };
