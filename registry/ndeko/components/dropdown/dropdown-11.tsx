import {
  BoltIcon,
  BookOpenIcon,
  CircleUserRoundIcon,
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

export default function Dropdown11() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            aria-label='Open account menu'
          />
        }
      >
        <CircleUserRoundIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='max-w-64'>
        <DropdownMenuLabel className='flex items-center gap-2.5'>
          <Avatar aria-hidden='true' seed='Keith Kennedy' />
          <span className='flex min-w-0 flex-col gap-0.5'>
            <span className='text-foreground truncate text-[13px]'>
              Keith Kennedy
            </span>
            <span className='truncate font-normal'>
              keith.kennedy@example.com
            </span>
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
