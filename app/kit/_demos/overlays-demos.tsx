import { CopyButton } from '@/app/_site/copy-button';
import { FilterIcon, ShareIcon, TrashIcon } from '@/registry/ndeko/lib/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/registry/ndeko/ui/alert-dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/registry/ndeko/ui/sheet';

const SHARE_LINK = 'https://atlas.example.com/p/website-redesign';

const FILTERS = [
  { label: 'Assigned to me', isChecked: true },
  { label: 'Has a due date', isChecked: false },
  { label: 'Blocked', isChecked: false },
];

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>
        <ShareIcon />
        Share
      </PopoverTrigger>
      <PopoverContent className='flex w-80 flex-col gap-3'>
        <div className='flex flex-col gap-1'>
          <PopoverTitle>Share this project</PopoverTitle>
          <PopoverDescription>
            Anyone with the link can view it.
          </PopoverDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Input readOnly defaultValue={SHARE_LINK} aria-label='Project link' />
          <CopyButton value={SHARE_LINK} label='Copy link' />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function HoverCardDemo() {
  return (
    <div className='text-muted-foreground text-[13px]'>
      Assigned to{' '}
      <HoverCard>
        <HoverCardTrigger
          href='#lena-fischer'
          className='text-foreground focus-visible:ring-ring/25 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
        >
          Lena Fischer
        </HoverCardTrigger>
        <HoverCardContent className='flex flex-col gap-3'>
          <div className='flex items-center gap-3'>
            <Avatar className='size-10' aria-hidden='true'>
              <AvatarImage src='/avatars/avatar-03.svg' alt='' />
              <AvatarFallback>LF</AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-0.5'>
              <p className='text-sm font-medium'>Lena Fischer</p>
              <p className='text-muted-foreground text-xs'>Product designer</p>
            </div>
          </div>
          <p className='text-muted-foreground'>
            Leads the design system and the onboarding flow at Atlas Studio.
          </p>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

export function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant='outline' />}>
        <TrashIcon />
        Delete project
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Website redesign?</AlertDialogTitle>
          <AlertDialogDescription>
            Its tasks and files go with it. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep project</AlertDialogCancel>
          <AlertDialogAction variant='destructive'>
            Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant='outline' />}>
        <FilterIcon />
        Filters
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Applied as soon as you pick them.</SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-3'>
          {FILTERS.map((filter) => (
            <Label key={filter.label}>
              <Checkbox defaultChecked={filter.isChecked} />
              {filter.label}
            </Label>
          ))}
        </div>
        <SheetFooter>
          <Button variant='outline' size='lg'>
            Clear filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
