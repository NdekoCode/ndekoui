import { Contact } from './contact';
import { SECTIONS } from './data';
import { PointBackdrop } from './point-backdrop';
import { POINT_STOPS } from './point-stops';
import { SectionRail } from './section-rail';
import { StudioSections } from './sections';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing11() {
  return (
    <div className='relative isolate flex min-h-screen flex-col'>
      <PointBackdrop stops={POINT_STOPS} />
      <SectionRail sections={SECTIONS} />
      <div className='relative z-10 flex flex-1 flex-col'>
        <SiteHeader />
        <main className='flex-1'>
          <StudioSections />
          <Contact />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
