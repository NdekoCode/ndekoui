import { Divisions } from './divisions';
import { Hero } from './hero';
import { Newsroom } from './newsroom';
import { OfficeMap } from './office-map';
import { Offices } from './offices';
import { Planner } from './planner';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing16() {
  return (
    <div className='dark bg-background text-foreground @container flex min-h-screen flex-col scheme-dark'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <Offices />
        <Divisions />
        <OfficeMap />
        <Planner />
        <Newsroom />
      </main>
      <SiteFooter />
    </div>
  );
}
