import {
  CommandIcon,
  HistoryIcon,
  type Icon,
  MessageSquareTextIcon,
  MoonIcon,
  ShuffleIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';

export type Feature = {
  icon: Icon;
  title: string;
  description: string;
  shortcut?: string;
};

export const SECTION = {
  eyebrow: 'Inside Driftdesk',
  title: 'A shared inbox that stays calm on a busy Monday',
  description:
    'Small decisions, made once, so the team answers faster without stepping on each other.',
};

export const FEATURES: Feature[] = [
  {
    icon: UsersIcon,
    title: 'Collision notice',
    description:
      'See that a teammate is already replying before you write a word',
  },
  {
    icon: CommandIcon,
    title: 'Saved replies',
    description: 'Type a slash to insert an answer, then edit it like your own',
    shortcut: '/',
  },
  {
    icon: ShuffleIcon,
    title: 'Routing rules',
    description:
      'Billing questions go to billing, bug reports to whoever is on call',
  },
  {
    icon: MoonIcon,
    title: 'Quiet hours',
    description:
      'Notifications pause outside each person’s working hours, then catch up',
  },
  {
    icon: HistoryIcon,
    title: 'Customer history',
    description:
      'Earlier conversations and orders sit beside the one you are reading',
  },
  {
    icon: MessageSquareTextIcon,
    title: 'Private notes',
    description:
      'Mention a colleague inside a thread without the customer seeing it',
    shortcut: 'N',
  },
];
