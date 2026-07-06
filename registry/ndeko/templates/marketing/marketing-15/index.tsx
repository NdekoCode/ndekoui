import { Capabilities } from './capabilities';
import { Conveyor } from './conveyor';
import { Faq } from './faq';
import { Hero } from './hero';
import { Offer } from './offer';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { Sprint } from './sprint';

export default function Marketing15() {
  return (
    <div className='@container flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <Capabilities />
        <Sprint />
        <Conveyor />
        <Offer />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
