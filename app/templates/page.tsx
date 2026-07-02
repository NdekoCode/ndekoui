import type { Metadata } from 'next';

import { BundleIndexPage } from '@/app/blocks/_shared/bundle-pages';

export const metadata: Metadata = {
  title: 'Templates - ndekoui',
  description:
    'Complete pages assembled from ndekoui blocks, ready to install and fill with your own data.',
};

export default function TemplatesPage() {
  return <BundleIndexPage kind='templates' />;
}
