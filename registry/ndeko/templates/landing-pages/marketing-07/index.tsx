import { Countdown } from './countdown';
import { Feed } from './feed';
import { GoalFigure } from './goal-figure';
import { Hero } from './hero';
import { Perks } from './perks';
import { Share } from './share';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing07() {
  return (
    <div className='@container flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <GoalFigure />
        <Feed />
        <Perks />
        <Countdown />
        <Share />
      </main>
      <SiteFooter />
    </div>
  );
}
