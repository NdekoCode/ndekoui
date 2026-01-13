import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

export default function Popover04() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>
        About previews
      </PopoverTrigger>
      <PopoverContent side='top' className='flex w-64 flex-col gap-3 p-3'>
        <div className='flex flex-col gap-1'>
          <PopoverTitle className='text-[13px]'>Branch previews</PopoverTitle>
          <PopoverDescription className='text-xs'>
            Every pull request gets its own preview link. Turn them on in the
            project settings.
          </PopoverDescription>
        </div>
        <Button size='sm' className='self-start'>
          Open settings
        </Button>
      </PopoverContent>
    </Popover>
  );
}
