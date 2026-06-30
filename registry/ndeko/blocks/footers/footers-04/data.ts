export type FooterLink = {
  label: string;
  href: string;
};

export type FooterCategory = {
  title: string;
  links: FooterLink[];
};

export type Language = {
  value: string;
  label: string;
};

export const BRAND = {
  name: 'Quillmint',
  tagline:
    'Contracts, signatures and renewals in one place for small legal teams',
  contactLabel: 'Support',
  email: 'help@quillmint.app',
  copyright: '© 2026 Quillmint',
};

export const CATEGORIES: FooterCategory[] = [
  {
    title: 'Product',
    links: [
      { label: 'Drafting', href: '#' },
      { label: 'Signatures', href: '#' },
      { label: 'Renewals', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Agencies', href: '#' },
      { label: 'Clinics', href: '#' },
      { label: 'Property managers', href: '#' },
      { label: 'Nonprofits', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Guides', href: '#' },
      { label: 'Clause library', href: '#' },
      { label: 'Webinars', href: '#' },
      { label: 'Changelog', href: '#' },
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
      { label: 'Data processing', href: '#' },
    ],
  },
];

export const LANGUAGES: Language[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
];
