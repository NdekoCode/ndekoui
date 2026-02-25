import { AnimatedBackground } from '@/components/core/animated-background';

const ITEMS = [
  {
    id: 'inbox',
    title: 'Inbox',
    description: 'Mentions and replies waiting for you.',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'Every meeting of the team in one week view.',
  },
  {
    id: 'boards',
    title: 'Boards',
    description: 'Plan a launch from first idea to release.',
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Specs and notes that stay next to the work.',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Time spent per project, updated each night.',
  },
  {
    id: 'automations',
    title: 'Automations',
    description: 'Move a card when a pull request is merged.',
  },
];

export function AnimatedCardBackgroundHover() {
  return (
    <div className='grid grid-cols-2 p-10 md:grid-cols-3'>
      <AnimatedBackground
        className='bg-foreground/[0.04] rounded-lg'
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.6,
        }}
        enableHover
      >
        {ITEMS.map((item) => (
          <div key={item.id} data-id={`card-${item.id}`}>
            <div className='flex flex-col space-y-1 p-4 select-none'>
              <h3 className='text-foreground text-sm font-medium'>
                {item.title}
              </h3>
              <p className='text-muted-foreground text-[13px]'>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </AnimatedBackground>
    </div>
  );
}
