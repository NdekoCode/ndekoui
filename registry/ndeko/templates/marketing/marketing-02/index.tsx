import { Faq } from './faq';
import { Features } from './features';
import { Hero } from './hero';
import { Pricing } from './pricing';
import { SdkCard } from './sdk-card';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing02() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <Features />
        <Pricing />
        <Faq />
        <SdkCard />
      </main>
      <SiteFooter />
    </div>
  );
}
