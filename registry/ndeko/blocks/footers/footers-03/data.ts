export type FooterLink = {
  label: string;
  href: string;
};

export type FooterCategory = {
  title: string;
  links: FooterLink[];
};

export const BRAND = {
  name: 'Fernwick',
  wordmark: 'fernwick',
  tagline: 'One shared inbox for every customer conversation your team answers',
  email: 'hello@fernwick.app',
  copyright: '© 2026 Fernwick Labs',
};

export const CATEGORIES: FooterCategory[] = [
  {
    title: 'Product',
    links: [
      { label: 'Shared inbox', href: '#' },
      { label: 'Saved replies', href: '#' },
      { label: 'Routing rules', href: '#' },
      { label: 'Reports', href: '#' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press kit', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
];

export const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Security', href: '#' },
];
