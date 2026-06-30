import { PostCard } from '@/components/core/post-card';

export function PostCardText() {
  return (
    <div className='flex w-full max-w-lg flex-col gap-2 p-4'>
      <p className='text-muted-foreground text-xs'>
        Fictional post, written for this example
      </p>
      <PostCard
        author={{
          name: 'Amani Diallo',
          handle: 'amani_builds',
          avatar: '/avatars/avatar-03.svg',
          verified: true,
        }}
        text={`Shipped dark mode for the planner today. The trick was keeping every grey as a share of the text colour, so one hover works on the page and on a card.\n\nNotes in #design-systems if you want them.`}
        date='2026-10-14T09:42:00Z'
        counts={{
          replies: 18,
          reposts: 41,
          likes: 362,
          bookmarks: 57,
          views: 12480,
        }}
      />
    </div>
  );
}
