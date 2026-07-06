import { Contact } from './contact';
import { Faq } from './faq';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing05() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Contact />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
