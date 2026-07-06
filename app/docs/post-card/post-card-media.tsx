import { PostCard } from '@/components/core/post-card';

export function PostCardMedia() {
  return (
    <div className='flex w-full max-w-lg flex-col gap-2 p-4'>
      <p className='text-muted-foreground text-xs'>
        Fictional post, written for this example
      </p>
      <PostCard
        author={{
          name: 'Lea Moreau',
          handle: 'leamoreau',
        }}
        text='Two mornings on the same ridge, one week apart. @tomas_i guessed the second one first.'
        date='2026-09-02T06:15:00Z'
        media={[
          {
            src: '/images/scenes/scene-02.svg',
            alt: 'Flat landscape of a ridge in early light',
          },
          {
            src: '/images/scenes/scene-06.svg',
            alt: 'The same ridge a week later under a paler sky',
          },
        ]}
        counts={{ replies: 1, reposts: 3, likes: 27 }}
        href='#'
      />
    </div>
  );
}
