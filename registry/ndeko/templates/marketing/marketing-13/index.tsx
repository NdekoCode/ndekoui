import { Faq } from './faq';
import { Figures } from './figures';
import { Hero } from './hero';
import { LightAndSeed } from './light-and-seed';
import { Offer } from './offer';
import { Pins } from './pins';
import { Reviews } from './reviews';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { Triage } from './triage';

export default function Marketing13() {
  return (
    <div className='@container flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <Figures />
        <Pins />
        <Triage />
        <LightAndSeed />
        <Reviews />
        <Offer />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
