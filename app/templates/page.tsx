import type { Metadata } from 'next';

import { pageMetadataOf } from '@/app/_site/seo';
import { BundleIndexPage } from '@/app/blocks/_shared/bundle-pages';

export const metadata: Metadata = pageMetadataOf({
  title: 'Templates - ndekoui',
  description:
    'Complete pages assembled from ndekoui blocks, ready to install and fill with your own data.',
  path: '/templates',
});

export default function TemplatesPage() {
  return <BundleIndexPage kind='templates' />;
}
