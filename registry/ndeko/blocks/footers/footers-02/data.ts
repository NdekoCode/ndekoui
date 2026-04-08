import {
  GithubIcon,
  type Icon,
  LinkedinBrandIcon,
  YoutubeBrandIcon,
} from '@/registry/ndeko/lib/icons';

export type FooterLink = {
  label: string;
  href: string;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: Icon;
};

export const BRAND = {
  name: 'Tallyfold',
  copyright: '© 2026 Tallyfold',
};

export const LINKS: FooterLink[] = [
  { label: 'Pricing', href: '#' },
  { label: 'Changelog', href: '#' },
  { label: 'Status', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Tallyfold on GitHub', href: '#', icon: GithubIcon },
  { label: 'Tallyfold on LinkedIn', href: '#', icon: LinkedinBrandIcon },
  { label: 'Tallyfold on YouTube', href: '#', icon: YoutubeBrandIcon },
];
