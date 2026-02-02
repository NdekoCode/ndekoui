import {
  ChevronLeftIcon,
  HistoryIcon,
  MessageSquareTextIcon,
  UserRoundPlusIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

const COLLABORATORS = [
  {
    name: 'Kelly King',
    initials: 'KK',
    image: '/avatars/avatar-07.svg',
    isOnline: true,
  },
  {
    name: 'Martha Johnson',
    initials: 'MJ',
    image: '/avatars/avatar-06.svg',
    isOnline: false,
  },
  {
    name: 'Linda Green',
    initials: 'LG',
    image: '/avatars/avatar-05.svg',
    isOnline: false,
  },
];

const HIDDEN_COLLABORATORS = 3;

function presenceLabelOf(isOnline: boolean) {
  if (isOnline) {
    return 'Online';
  }
  return 'Offline';
}

function presenceColorOf(isOnline: boolean) {
  if (isOnline) {
    return 'bg-success';
  }
  return 'bg-muted-foreground';
}

export default function Navbar19() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Go back'
            nativeButton={false}
            render={<a href='#' />}
          >
            <ChevronLeftIcon />
          </Button>
          <h1 className='text-sm font-medium'>Basic UI</h1>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Show history'
            className='text-muted-foreground'
          >
            <HistoryIcon />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Open comments'
            className='text-muted-foreground'
          >
            <MessageSquareTextIcon />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Invite people'
            className='text-muted-foreground'
          >
            <UserRoundPlusIcon />
          </Button>
          <ul className='ml-2 flex items-center gap-2'>
            {COLLABORATORS.map((collaborator) => (
              <li key={collaborator.name} className='relative flex'>
                <Avatar>
                  <AvatarImage
                    src={collaborator.image}
                    alt={collaborator.name}
                  />
                  <AvatarFallback>{collaborator.initials}</AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    'ring-background absolute -end-0.5 -bottom-0.5 size-2.5 rounded-full ring-2',
                    presenceColorOf(collaborator.isOnline)
                  )}
                >
                  <span className='sr-only'>
                    {presenceLabelOf(collaborator.isOnline)}
                  </span>
                </span>
              </li>
            ))}
            <li className='flex'>
              <Button
                variant='secondary'
                size='icon'
                aria-label={`Show ${HIDDEN_COLLABORATORS} more collaborators`}
                className='text-muted-foreground hover:text-foreground text-xs tabular-nums'
              >
                +{HIDDEN_COLLABORATORS}
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
