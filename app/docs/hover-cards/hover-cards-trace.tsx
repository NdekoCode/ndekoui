import { HoverEffectCard } from '@/components/core/hover-cards';
import { BookOpenIcon } from '@/registry/ndeko/lib/icons';

const GUIDES = [
  {
    title: 'Invite your team',
    description: 'Send invitations, pick roles and set who can see billing',
    pages: 4,
  },
  {
    title: 'Connect a calendar',
    description: 'Show meetings beside your tasks and block focus time',
    pages: 1,
  },
];

function pagesLabel(count: number) {
  if (count === 1) {
    return '1 page';
  }
  return `${count} pages`;
}

export function HoverCardsTrace() {
  return (
    <div className='grid w-full max-w-xl gap-4 sm:grid-cols-2'>
      {GUIDES.map((guide) => (
        <HoverEffectCard
          key={guide.title}
          effect='trace'
          href='#'
          title={guide.title}
          description={guide.description}
          meta={
            <>
              <BookOpenIcon className='size-3.5' />
              <span className='tabular-nums'>{pagesLabel(guide.pages)}</span>
            </>
          }
        />
      ))}
    </div>
  );
}
