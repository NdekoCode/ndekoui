import type { Metadata } from 'next';

import { BareShell } from '@/app/_site/site-shell';
import { StillPreviewScript } from '@/app/_site/still-preview';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StillPreviewScript />
      <BareShell>{children}</BareShell>
    </>
  );
}
