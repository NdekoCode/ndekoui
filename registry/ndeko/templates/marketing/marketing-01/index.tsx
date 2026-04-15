import { CallToAction } from './call-to-action';
import { Features } from './features';
import { Hero } from './hero';
import { LogoCloud } from './logo-cloud';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing01() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <LogoCloud />
        <Features />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  );
}
