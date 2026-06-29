import {
  SpotlightCard,
  SpotlightCards,
} from '@/components/core/spotlight-cards';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';

const SECTIONS = [
  {
    title: 'Workspace',
    description: 'Name, address and the default view for new members',
  },
  {
    title: 'Members and roles',
    description: 'Invite people and decide who can change billing',
  },
  {
    title: 'Notifications',
    description: 'Choose what reaches your inbox and what stays in the app',
  },
  {
    title: 'Security',
    description: 'Two-step sign-in, sessions and allowed domains',
  },
];

export function SpotlightCardsSettings() {
  return (
    <SpotlightCards tint='neutral' className='w-full max-w-2xl sm:grid-cols-2'>
      {SECTIONS.map((section) => (
        <SpotlightCard key={section.title} href='#' className='px-4 py-3.5'>
          <span className='flex items-center gap-3'>
            <span className='flex flex-1 flex-col gap-0.5'>
              <span className='text-foreground text-sm font-medium'>
                {section.title}
              </span>
              <span className='text-muted-foreground text-[13px]'>
                {section.description}
              </span>
            </span>
            <ChevronRightIcon className='text-muted-foreground size-4' />
          </span>
        </SpotlightCard>
      ))}
    </SpotlightCards>
  );
}
