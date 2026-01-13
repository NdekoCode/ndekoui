import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

export default function Dropdown02() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        Export 1,284 contacts
        <ChevronDownIcon className='-me-1 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='min-w-(--anchor-width)'>
        <DropdownMenuItem>CSV file</DropdownMenuItem>
        <DropdownMenuItem>Excel workbook</DropdownMenuItem>
        <DropdownMenuItem>vCard file</DropdownMenuItem>
        <DropdownMenuItem>Plain text</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
