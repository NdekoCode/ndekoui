import {
  CloudIcon,
  LifeBuoyIcon,
  MapPinIcon,
  RouteIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type SitePage = {
  id: string;
  title: string;
  section: string;
  href: string;
};

export type PopularPage = {
  id: string;
  title: string;
  lead: string;
  href: string;
  icon: Icon;
};

export const SITE = {
  name: 'Larchway',
  homeHref: '#',
  missingAddress: 'larchway.example/guides/winter-routes-dolomites',
};

export const PAGES: SitePage[] = [
  {
    id: 'winter-dolomites',
    title: 'Winter routes in the Dolomites',
    section: 'Guides',
    href: '#guides-winter-routes-in-the-dolomites',
  },
  {
    id: 'planning-winter',
    title: 'Planning a winter route',
    section: 'Help',
    href: '#help-planning-a-winter-route',
  },
  {
    id: 'huts-dolomites',
    title: 'Huts and bivouacs in the Dolomites',
    section: 'Guides',
    href: '#guides-huts-and-bivouacs',
  },
  {
    id: 'snow-layers',
    title: 'Snow and avalanche layers',
    section: 'Maps',
    href: '#maps-snow-and-avalanche-layers',
  },
  {
    id: 'offline-alps',
    title: 'Offline maps for the Alps',
    section: 'Maps',
    href: '#maps-offline-alps',
  },
  {
    id: 'grades',
    title: 'Route difficulty grades explained',
    section: 'Guides',
    href: '#guides-difficulty-grades',
  },
  {
    id: 'gpx',
    title: 'Import a GPX file',
    section: 'Help',
    href: '#help-import-gpx',
  },
  {
    id: 'share-group',
    title: 'Share a route with your group',
    section: 'Help',
    href: '#help-share-a-route',
  },
  {
    id: 'download-offline',
    title: 'Download routes for offline use',
    section: 'Help',
    href: '#help-download-routes',
  },
  {
    id: 'conditions',
    title: 'Trail conditions this week',
    section: 'Community',
    href: '#community-trail-conditions',
  },
  {
    id: 'pricing',
    title: 'Plans and pricing',
    section: 'Larchway',
    href: '#pricing',
  },
];

export const POPULAR: PopularPage[] = [
  {
    id: 'plan',
    title: 'Plan a route',
    lead: 'Draw it on the map and check the climb',
    href: '#plan-a-route',
    icon: RouteIcon,
  },
  {
    id: 'offline',
    title: 'Offline maps',
    lead: 'Download a region before you lose signal',
    href: '#offline-maps',
    icon: MapPinIcon,
  },
  {
    id: 'conditions',
    title: 'Trail conditions',
    lead: 'Snow, closures and reports from this week',
    href: '#trail-conditions',
    icon: CloudIcon,
  },
  {
    id: 'help',
    title: 'Help center',
    lead: 'GPX import, groups and billing',
    href: '#help-center',
    icon: LifeBuoyIcon,
  },
];
