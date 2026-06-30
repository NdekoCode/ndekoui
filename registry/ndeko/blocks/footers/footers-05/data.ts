export type FooterLink = {
  label: string;
  href: string;
};

export const BRAND = {
  name: 'Tidepost',
  headline: 'Plan the next release in Tidepost',
  description:
    'Roadmaps, release notes and the status page your customers read, kept in one workspace',
  copyright: '© 2026 Tidepost',
};

export const ACTIONS = {
  primary: { label: 'Start a workspace', href: '#' },
  secondary: { label: 'Book a walkthrough', href: '#' },
};

export const STATUS = {
  label: 'All services running',
  href: '#',
};

export const LINKS: FooterLink[] = [
  { label: 'Product', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Changelog', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
];
