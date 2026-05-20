import type { Metadata } from 'next';

import { BundleIndexPage } from './_shared/bundle-pages';

export const metadata: Metadata = {
  title: 'Blocks - Ndeko UI',
  description:
    'Whole sections of a product built from Ndeko UI components with fictional data, installable with the shadcn CLI.',
};

export default function BlocksPage() {
  return <BundleIndexPage kind='blocks' />;
}
