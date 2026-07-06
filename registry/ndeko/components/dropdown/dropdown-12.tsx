import {
  BoltIcon,
  BookOpenIcon,
  ChevronDownIcon,
  Layers2Icon,
  LogOutIcon,
  PinIcon,
  UserPenIcon,
} from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

export default function Dropdown12() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            aria-label='Open account menu'
            className='h-auto p-0 hover:bg-transparent data-popup-open:bg-transparent'
          />
        }
      >
        <Avatar seed='Keith Kennedy' />
        <ChevronDownIcon className='opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='max-w-64'>
        <DropdownMenuLabel className='flex min-w-0 flex-col gap-0.5'>
          <span className='text-foreground truncate text-[13px]'>
            Keith Kennedy
          </span>
          <span className='truncate font-normal'>
            keith.kennedy@example.com
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BoltIcon />
            Preferences
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Layers2Icon />
            Workspaces
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BookOpenIcon />
            Documentation
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PinIcon />
            Pinned items
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPenIcon />
            Edit profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
