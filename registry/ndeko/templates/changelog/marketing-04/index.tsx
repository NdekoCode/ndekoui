import { Changelog } from './changelog';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export default function Marketing04() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <Changelog />
      </main>
      <SiteFooter />
    </div>
  );
}
