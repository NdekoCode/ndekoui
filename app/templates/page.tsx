import type { Metadata } from 'next';

import { BundleIndexPage } from '@/app/blocks/_shared/bundle-pages';

export const metadata: Metadata = {
  title: 'Templates - Ndeko UI',
  description:
    'Complete pages assembled from Ndeko UI blocks, ready to install and fill with your own data.',
};

export default function TemplatesPage() {
  return <BundleIndexPage kind='templates' />;
}
