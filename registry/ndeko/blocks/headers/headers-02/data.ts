export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'features', label: 'Features', href: '#' },
  { id: 'pricing', label: 'Pricing', href: '#' },
  { id: 'changelog', label: 'Changelog', href: '#' },
  { id: 'docs', label: 'Docs', href: '#' },
];

export const DEFAULT_LINK_ID = 'features';
