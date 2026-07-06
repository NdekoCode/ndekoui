import { Faq } from './faq';
import { Pricing } from './pricing';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing03() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
