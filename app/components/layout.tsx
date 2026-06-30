import { SiteShell } from '@/app/_site/site-shell';

import { ScrollToTopOnChange } from './_catalog/scroll-to-top-on-change';

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteShell>
      <ScrollToTopOnChange />
      {children}
    </SiteShell>
  );
}
