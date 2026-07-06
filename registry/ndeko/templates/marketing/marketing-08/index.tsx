import { Abilities } from './abilities';
import { Chat } from './chat';
import { Closing } from './closing';
import { Faq } from './faq';
import { Hero } from './hero';
import { PointBackdrop } from './point-backdrop';
import { POINT_STOPS } from './point-stops';
import { Pricing } from './pricing';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing08() {
  return (
    <div className='relative isolate flex min-h-screen flex-col'>
      <PointBackdrop stops={POINT_STOPS} />
      <div className='relative z-10 flex flex-1 flex-col'>
        <SiteHeader />
        <main className='flex-1'>
          <Hero />
          <Chat />
          <Abilities />
          <Pricing />
          <Faq />
          <Closing />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
