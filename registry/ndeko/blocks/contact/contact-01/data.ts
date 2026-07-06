import {
  ClockIcon,
  GlobeIcon,
  type Icon,
  MailIcon,
} from '@/registry/ndeko/lib/icons';

export type ContactDetail = {
  icon: Icon;
  label: string;
  value: string;
  href?: string;
};

export const SECTION = {
  title: 'Talk to the people who build Driftdesk',
  description:
    'Tell us how your team answers customers today. We reply with a setup that fits, and a trial workspace if you want one.',
};

export const CONTACT_DETAILS: ContactDetail[] = [
  {
    icon: MailIcon,
    label: 'Email',
    value: 'sales@driftdesk.example',
    href: 'mailto:sales@driftdesk.example',
  },
  {
    icon: ClockIcon,
    label: 'Reply time',
    value: 'Within one working day, Monday to Friday',
  },
  {
    icon: GlobeIcon,
    label: 'Team',
    value: 'Kinshasa, Lisbon and Nairobi',
  },
];

export const TEAM_SIZES = [
  { value: '1-10', label: '1 to 10 people' },
  { value: '11-50', label: '11 to 50 people' },
  { value: '51-200', label: '51 to 200 people' },
  { value: '201+', label: 'More than 200 people' },
];
