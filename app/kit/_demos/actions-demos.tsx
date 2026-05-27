import {
  ArrowRightIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  LinkIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Toggle } from '@/registry/ndeko/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

export function ButtonDemo() {
  return (
    <div className='flex flex-col items-center gap-4'>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        <Button>Create project</Button>
        <Button variant='outline'>Invite people</Button>
        <Button variant='secondary'>Duplicate</Button>
        <Button variant='ghost'>Cancel</Button>
        <Button variant='destructive'>
          <TrashIcon />
          Delete project
        </Button>
        <Button
          variant='link'
          nativeButton={false}
          render={<a href='#button-guide' />}
        >
          Read the guide
        </Button>
      </div>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        <Button size='sm'>Add task</Button>
        <Button>Save changes</Button>
        <Button size='lg'>
          Start a trial
          <ArrowRightIcon />
        </Button>
        <Button size='icon-sm' variant='ghost' aria-label='Open settings'>
          <SettingsIcon />
        </Button>
        <Button size='icon' variant='outline' aria-label='Search tasks'>
          <SearchIcon />
        </Button>
        <Button size='icon-lg' aria-label='New task'>
          <PlusIcon />
        </Button>
        <Button disabled>Publish</Button>
      </div>
    </div>
  );
}

export function ToggleDemo() {
  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      <Toggle aria-label='Pin to sidebar' defaultPressed>
        <PinIcon />
      </Toggle>
      <Toggle variant='outline' aria-label='Add to favourites'>
        <StarIcon />
      </Toggle>
      <Toggle variant='outline'>
        <EyeIcon />
        Show archived
      </Toggle>
    </div>
  );
}

export function ToggleGroupDemo() {
  return (
    <div className='flex flex-col items-center gap-4'>
      <ToggleGroup travel defaultValue={['list']} aria-label='Layout'>
        <ToggleGroupItem value='list'>List</ToggleGroupItem>
        <ToggleGroupItem value='board'>Board</ToggleGroupItem>
        <ToggleGroupItem value='timeline'>Timeline</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        variant='outline'
        multiple
        defaultValue={['assigned']}
        aria-label='Filters'
      >
        <ToggleGroupItem value='assigned'>Assigned to me</ToggleGroupItem>
        <ToggleGroupItem value='due'>Has a due date</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='outline' size='icon' aria-label='Project actions' />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuItem>
          <PencilIcon />
          Rename
          <DropdownMenuShortcut>R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CopyIcon />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LinkIcon />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Design</DropdownMenuItem>
            <DropdownMenuItem>Engineering</DropdownMenuItem>
            <DropdownMenuItem>Marketing</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem defaultChecked>
          Show completed tasks
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup defaultValue='updated'>
          <DropdownMenuRadioItem value='updated'>
            Last updated
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='name'>Name</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant='destructive'>
          <TrashIcon />
          Delete project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
