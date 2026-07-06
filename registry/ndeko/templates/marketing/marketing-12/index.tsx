import { Banks } from './banks';
import { Closing } from './closing';
import { Comparison } from './comparison';
import { Hero } from './hero';
import { Manifesto } from './manifesto';
import { Reviews } from './reviews';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { Steps } from './steps';

export default function Marketing12() {
  return (
    <div className='@container flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <Manifesto />
        <Steps />
        <Banks />
        <Comparison />
        <Reviews />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  );
}
