import {
  GithubIcon,
  type Icon,
  LinkedinBrandIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterCategory = {
  title: string;
  links: FooterLink[];
};

export type SocialLink = {
  label: string;
  href: string;
  icon: Icon;
};

export const BRAND = {
  name: 'Loomboard',
  tagline: 'Boards, timelines and reports for teams that plan every week',
  copyright: '© 2026 Loomboard Ltd',
};

export const NEWSLETTER = {
  label: 'Product updates',
  description:
    'One email a month with what shipped, each with an unsubscribe link',
};

export const CATEGORIES: FooterCategory[] = [
  {
    title: 'Product',
    links: [
      { label: 'Boards', href: '#' },
      { label: 'Timelines', href: '#' },
      { label: 'Automations', href: '#' },
      { label: 'Reports', href: '#' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Loomboard on GitHub', href: '#', icon: GithubIcon },
  { label: 'Loomboard on X', href: '#', icon: TwitterXIcon },
  { label: 'Loomboard on LinkedIn', href: '#', icon: LinkedinBrandIcon },
];
