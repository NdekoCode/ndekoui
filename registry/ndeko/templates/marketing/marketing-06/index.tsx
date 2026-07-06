import { Cta } from './cta';
import { Faq } from './faq';
import { Features } from './features';
import { Figures } from './figures';
import { Hero } from './hero';
import { Pricing } from './pricing';
import { PulseBand } from './pulse-band';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { Testimonials } from './testimonials';

export default function Marketing06() {
  return (
    <div className='@container flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <PulseBand />
        <Features />
        <Figures />
        <Pricing />
        <Testimonials />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  );
}
