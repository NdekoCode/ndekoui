import { Chapters } from './chapters';
import { Closing } from './closing';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { StoryHero } from './story-hero';

export default function Marketing09() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />
      <main className='flex-1'>
        <StoryHero />
        <Chapters />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  );
}
