import {
  SpotlightCard,
  SpotlightCards,
} from '@/components/core/spotlight-cards';
import {
  BellIcon,
  CalendarCheckIcon,
  GitPullRequestIcon,
  InboxIcon,
  RocketIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

type Template = {
  name: string;
  description: string;
  steps: number;
  icon: Icon;
};

const TEMPLATES: Template[] = [
  {
    name: 'Sprint board',
    description: 'Two-week cycles with a backlog and a review column',
    steps: 5,
    icon: CalendarCheckIcon,
  },
  {
    name: 'Bug triage',
    description: 'Sort new reports by impact before they reach a sprint',
    steps: 4,
    icon: InboxIcon,
  },
  {
    name: 'Launch checklist',
    description: 'Everything that has to be true on release day',
    steps: 9,
    icon: RocketIcon,
  },
  {
    name: 'Code review rota',
    description: 'Share reviews fairly across the team each week',
    steps: 3,
    icon: GitPullRequestIcon,
  },
  {
    name: 'Onboarding',
    description: 'A first week plan for someone joining the team',
    steps: 7,
    icon: UsersIcon,
  },
  {
    name: 'Incident follow-up',
    description: 'Timeline, causes and actions after an outage',
    steps: 1,
    icon: BellIcon,
  },
];

function stepsLabel(count: number) {
  if (count === 1) {
    return '1 step';
  }
  return `${count} steps`;
}

function TemplateCard({ template }: { template: Template }) {
  const TemplateIcon = template.icon;

  return (
    <SpotlightCard href='#' className='p-4'>
      <span className='keycap-3d text-muted-foreground grid size-8 place-items-center rounded-lg'>
        <TemplateIcon className='size-4' />
      </span>
      <span className='text-foreground mt-4 text-sm font-medium'>
        {template.name}
      </span>
      <span className='text-muted-foreground mt-1 text-[13px]'>
        {template.description}
      </span>
      <span className='text-muted-foreground mt-3 text-xs tabular-nums'>
        {stepsLabel(template.steps)}
      </span>
    </SpotlightCard>
  );
}

export function SpotlightCardsTemplates() {
  return (
    <SpotlightCards className='w-full max-w-3xl sm:grid-cols-2 lg:grid-cols-3'>
      {TEMPLATES.map((template) => (
        <TemplateCard key={template.name} template={template} />
      ))}
    </SpotlightCards>
  );
}
