import { SiteShell } from '@/app/_site/site-shell';

export default function ThemesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
