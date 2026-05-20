import type { Metadata } from 'next';

import { BareShell } from '@/app/_site/site-shell';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BareShell>{children}</BareShell>;
}
