import type { Metadata } from 'next';

import { pageMetadataOf } from '@/app/_site/seo';

import { BundleIndexPage } from './_shared/bundle-pages';

export const metadata: Metadata = pageMetadataOf({
  title: 'Blocks for React apps and marketing sites - ndekoui',
  description:
    'Whole sections of a product built from ndekoui components with fictional data, installable with the shadcn CLI.',
  keywords: [
    'React blocks',
    'Tailwind CSS blocks',
    'shadcn blocks',
    'app sections',
    'dashboard blocks',
  ],
  path: '/blocks',
});

export default function BlocksPage() {
  return <BundleIndexPage kind='blocks' />;
}
