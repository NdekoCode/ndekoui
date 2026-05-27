import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Badge, type BadgeProps } from '@/registry/ndeko/ui/badge';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/registry/ndeko/ui/timeline';

type BadgeVariant = BadgeProps['variant'];

type Person = {
  name: string;
  initials: string;
  image: string;
};

type Task = {
  title: string;
  assignee: string;
  status: string;
  statusVariant: BadgeVariant;
  due: string;
  hours: number;
};

const TEAM: Person[] = [
  { name: 'Lena Fischer', initials: 'LF', image: '/avatars/avatar-03.svg' },
  { name: 'Omar Haddad', initials: 'OH', image: '/avatars/avatar-04.svg' },
  { name: 'Priya Nair', initials: 'PN', image: '/avatars/avatar-05.svg' },
  { name: 'Tomás Ortega', initials: 'TO', image: '/avatars/avatar-07.svg' },
];

const LEAD = TEAM[0];

const BADGES: { label: string; variant: BadgeVariant }[] = [
  { label: 'New', variant: 'default' },
  { label: 'Draft', variant: 'secondary' },
  { label: 'Archived', variant: 'outline' },
  { label: 'Paid', variant: 'success' },
  { label: 'Due soon', variant: 'warning' },
  { label: 'In review', variant: 'info' },
  { label: 'Overdue', variant: 'destructive' },
];

const LABELS = [
  { name: 'Design', color: 'var(--primary)' },
  { name: 'Bug', color: 'var(--destructive)' },
  { name: 'Ready', color: 'var(--success)' },
  { name: 'Waiting', color: 'var(--warning)' },
  { name: 'Docs', color: 'var(--info)' },
];

const SHORTCUTS = [
  { action: 'Search', keys: ['⌘', 'K'] },
  { action: 'New task', keys: ['C'] },
  { action: 'Send a comment', keys: ['⌘', 'Enter'] },
];

const QUESTIONS = [
  {
    value: 'plan',
    question: 'Can I change my plan later?',
    answer: 'Yes. The new price applies from the next billing date.',
  },
  {
    value: 'private',
    question: 'Who can see a private project?',
    answer: 'Only the people you invite to it, and the workspace admins.',
  },
  {
    value: 'export',
    question: 'How do I export my tasks?',
    answer: 'From the project menu, as a CSV or a JSON file.',
  },
];

const MILESTONES = [
  {
    step: 1,
    date: 'Mar 3',
    title: 'Kickoff',
    description: 'Scope, owners and the first milestones agreed.',
  },
  {
    step: 2,
    date: 'Mar 17',
    title: 'Design review',
    description: 'Wireframes and the new pricing page signed off.',
  },
  {
    step: 3,
    date: 'Apr 7',
    title: 'Beta release',
    description: 'Fifty workspaces try the new pages behind a switch.',
  },
  {
    step: 4,
    date: 'Apr 28',
    title: 'Public launch',
    description: 'The redesign ships to every workspace.',
  },
];

const TASKS: Task[] = [
  {
    title: 'Pricing page copy',
    assignee: 'Lena Fischer',
    status: 'In review',
    statusVariant: 'info',
    due: 'Mar 12',
    hours: 6,
  },
  {
    title: 'Docs search',
    assignee: 'Omar Haddad',
    status: 'In progress',
    statusVariant: 'secondary',
    due: 'Mar 14',
    hours: 12,
  },
  {
    title: 'Changelog layout',
    assignee: 'Priya Nair',
    status: 'Done',
    statusVariant: 'success',
    due: 'Mar 9',
    hours: 4,
  },
  {
    title: 'Hero demo',
    assignee: 'Tomás Ortega',
    status: 'Overdue',
    statusVariant: 'destructive',
    due: 'Mar 8',
    hours: 9,
  },
];

function totalHoursOf(tasks: Task[]) {
  let total = 0;
  for (const task of tasks) {
    total += task.hours;
  }
  return total;
}

export function AvatarDemo() {
  return (
    <div className='flex flex-col items-center gap-5'>
      <div className='flex items-center gap-3'>
        <Avatar className='size-10'>
          <AvatarImage src={LEAD.image} alt={LEAD.name} />
          <AvatarFallback>{LEAD.initials}</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
        <Avatar className='size-6 text-[10px]'>
          <AvatarFallback>JW</AvatarFallback>
        </Avatar>
      </div>
      <div className='flex -space-x-2'>
        {TEAM.map((person) => (
          <Avatar key={person.name} className='ring-card ring-2'>
            <AvatarImage src={person.image} alt={person.name} />
            <AvatarFallback>{person.initials}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  );
}

export function BadgeDemo() {
  return (
    <div className='flex max-w-64 flex-wrap items-center justify-center gap-2'>
      {BADGES.map((badge) => (
        <Badge key={badge.label} variant={badge.variant}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}

export function ChipDemo() {
  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      {LABELS.map((label) => (
        <Chip key={label.name} color={label.color}>
          {label.name}
        </Chip>
      ))}
    </div>
  );
}

export function KbdDemo() {
  return (
    <dl className='grid grid-cols-[1fr_auto] items-center gap-x-10 gap-y-3 text-[13px]'>
      {SHORTCUTS.map((shortcut) => (
        <div key={shortcut.action} className='contents'>
          <dt className='text-muted-foreground'>{shortcut.action}</dt>
          <dd>
            <KbdGroup>
              {shortcut.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </KbdGroup>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AccordionDemo() {
  return (
    <Accordion defaultValue={['plan']} className='max-w-md'>
      {QUESTIONS.map((entry) => (
        <AccordionItem key={entry.value} value={entry.value}>
          <AccordionTrigger>{entry.question}</AccordionTrigger>
          <AccordionContent>{entry.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function TimelineDemo() {
  return (
    <Timeline defaultValue={2} className='w-full max-w-sm'>
      {MILESTONES.map((milestone) => (
        <TimelineItem key={milestone.step} step={milestone.step}>
          <TimelineHeader>
            <TimelineSeparator />
            <TimelineDate>{milestone.date}</TimelineDate>
            <TimelineTitle>{milestone.title}</TimelineTitle>
            <TimelineIndicator />
          </TimelineHeader>
          <TimelineContent>{milestone.description}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

export function TableDemo() {
  const totalHours = totalHoursOf(TASKS);

  return (
    <Table>
      <TableCaption>Website redesign, this sprint</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className='text-end'>Estimate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {TASKS.map((task) => (
          <TableRow key={task.title}>
            <TableCell className='font-medium'>{task.title}</TableCell>
            <TableCell>{task.assignee}</TableCell>
            <TableCell>
              <Badge variant={task.statusVariant}>{task.status}</Badge>
            </TableCell>
            <TableCell>{task.due}</TableCell>
            <TableCell className='text-end tabular-nums'>
              {task.hours} h
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total</TableCell>
          <TableCell className='text-end tabular-nums'>
            {totalHours} h
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
