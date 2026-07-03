import type { Metadata } from 'next';

import { pageMetadataOf } from '@/app/_site/seo';
import { BundleIndexPage } from '@/app/blocks/_shared/bundle-pages';

export const metadata: Metadata = pageMetadataOf({
  title: 'Templates for React apps and marketing sites - ndekoui',
  description:
    'Complete pages assembled from ndekoui blocks, ready to install and fill with your own data.',
  keywords: [
    'React templates',
    'Next.js templates',
    'Tailwind CSS templates',
    'shadcn templates',
    'landing page templates',
    'SaaS templates',
  ],
  path: '/templates',
});

export default function TemplatesPage() {
  return <BundleIndexPage kind='templates' />;
}
