import { About } from './about';
import { Bento } from './bento';
import { Hero } from './hero';
import { Projects } from './projects';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { Subscribe } from './subscribe';
import { Talks } from './talks';

export default function Marketing10() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Hero />
        <Bento />
        <About />
        <Projects />
        <Talks />
        <Subscribe />
      </main>
      <SiteFooter />
    </div>
  );
}
