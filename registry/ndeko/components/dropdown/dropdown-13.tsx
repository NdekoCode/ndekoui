import { Menu } from '@base-ui/react/menu';

import {
  BookIcon,
  InfoIcon,
  LifeBuoyIcon,
  MessageCircleMoreIcon,
} from '@/registry/ndeko/lib/icons';
import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

export default function Dropdown13() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' aria-label='Get help' />}
      >
        <InfoIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Need help?</DropdownMenuGroupLabel>
          <Menu.LinkItem href='#' closeOnClick className={MENU_ITEM}>
            <BookIcon />
            Documentation
          </Menu.LinkItem>
          <Menu.LinkItem href='#' closeOnClick className={MENU_ITEM}>
            <LifeBuoyIcon />
            Support
          </Menu.LinkItem>
          <Menu.LinkItem href='#' closeOnClick className={MENU_ITEM}>
            <MessageCircleMoreIcon />
            Contact us
          </Menu.LinkItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
