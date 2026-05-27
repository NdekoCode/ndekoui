import { SiteShell } from '@/app/_site/site-shell';

export default function KitLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
