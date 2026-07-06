import { Closing } from './closing';
import { Hero } from './hero';
import { Pillars } from './pillars';
import { Process } from './process';
import { ScrollLine } from './scroll-line';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing17() {
  return (
    <div className='dark bg-background text-foreground @container flex min-h-screen flex-col scheme-dark'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <ScrollLine />
        <Pillars />
        <Process />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  );
}
