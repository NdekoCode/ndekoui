import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/registry/ndeko/ui/stepper';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

const ONBOARDING_STEPS = [
  { step: 1, title: 'Account', description: 'Your name and email' },
  { step: 2, title: 'Workspace', description: 'Name and web address' },
  { step: 3, title: 'Invite team', description: 'Add a few teammates' },
  { step: 4, title: 'First project', description: 'Pick a template' },
];

const LAST_STEP = ONBOARDING_STEPS.length;

const TAB_PANEL = 'text-muted-foreground text-[13px]';

export function StepperDemo() {
  return (
    <Stepper defaultValue={2} className='@container w-full max-w-3xl'>
      {ONBOARDING_STEPS.map(({ step, title, description }) => {
        const hasNextStep = step < LAST_STEP;
        return (
          <StepperItem
            key={step}
            step={step}
            className='not-last:flex-1 @max-xl:items-start'
          >
            <StepperTrigger className='rounded-md @max-xl:flex-col'>
              <StepperIndicator />
              <div className='text-center @xl:text-left'>
                <StepperTitle>{title}</StepperTitle>
                <StepperDescription className='@max-md:hidden'>
                  {description}
                </StepperDescription>
              </div>
            </StepperTrigger>
            {hasNextStep && (
              <StepperSeparator className='@max-xl:mt-3.5 @xl:mx-4' />
            )}
          </StepperItem>
        );
      })}
    </Stepper>
  );
}

export function TabsDemo() {
  return (
    <div className='grid w-full gap-8 sm:grid-cols-2'>
      <Tabs defaultValue='overview'>
        <TabsList>
          <TabsTab value='overview'>Overview</TabsTab>
          <TabsTab value='activity'>Activity</TabsTab>
          <TabsTab value='settings'>Settings</TabsTab>
        </TabsList>
        <TabsPanel value='overview' className={TAB_PANEL}>
          The project at a glance.
        </TabsPanel>
        <TabsPanel value='activity' className={TAB_PANEL}>
          What changed, newest first.
        </TabsPanel>
        <TabsPanel value='settings' className={TAB_PANEL}>
          Name, members and access.
        </TabsPanel>
      </Tabs>
      <Tabs defaultValue='list'>
        <TabsList variant='segmented'>
          <TabsTab value='list'>List</TabsTab>
          <TabsTab value='board'>Board</TabsTab>
          <TabsTab value='timeline'>Timeline</TabsTab>
        </TabsList>
        <TabsPanel value='list' className={TAB_PANEL}>
          Rows grouped by status.
        </TabsPanel>
        <TabsPanel value='board' className={TAB_PANEL}>
          Columns you can drag cards across.
        </TabsPanel>
        <TabsPanel value='timeline' className={TAB_PANEL}>
          Bars on a calendar.
        </TabsPanel>
      </Tabs>
    </div>
  );
}

export function BreadcrumbDemo() {
  return (
    <div className='flex flex-col items-center gap-5'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='#crumb-atlas'>Atlas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='#crumb-projects'>Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Website redesign</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Breadcrumb aria-label='Breadcrumb with hidden levels'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='#crumb-atlas-docs'>Atlas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='#crumb-design'>Design</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Hero section</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
