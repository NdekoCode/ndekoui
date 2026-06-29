import { HoverEffectCard } from '@/components/core/hover-cards';
import { ClockIcon } from '@/registry/ndeko/lib/icons';

const ARTICLES = [
  {
    title: 'Planning a quarter without a roadmap deck',
    description: 'How the Fernhill team keeps goals in one living page',
    readingTime: '6 min read',
    image: {
      src: '/images/scenes/scene-02.svg',
      alt: 'Flat illustration of teal hills under an orange sun',
    },
  },
  {
    title: 'What we learned shipping weekly for a year',
    description: 'Small releases, fewer surprises and a calmer on-call',
    readingTime: '9 min read',
    image: {
      src: '/images/scenes/scene-06.svg',
      alt: 'Flat illustration of olive hills under a yellow sun',
    },
  },
];

export function HoverCardsZoom() {
  return (
    <div className='grid w-full max-w-xl gap-4 sm:grid-cols-2'>
      {ARTICLES.map((article) => (
        <HoverEffectCard
          key={article.title}
          effect='zoom'
          href='#'
          title={article.title}
          description={article.description}
          image={article.image}
          meta={
            <>
              <ClockIcon className='size-3.5' />
              <span>{article.readingTime}</span>
            </>
          }
        />
      ))}
    </div>
  );
}
