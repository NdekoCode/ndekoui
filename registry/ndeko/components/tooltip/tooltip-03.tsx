import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

export default function Tooltip03() {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        closeOnClick={false}
        render={
          <Button
            variant='outline'
            size='sm'
            disabled
            focusableWhenDisabled
            className='data-disabled:pointer-events-auto data-disabled:cursor-not-allowed'
          />
        }
      >
        Merge
      </TooltipTrigger>
      <TooltipContent>Needs one more approval to merge</TooltipContent>
    </Tooltip>
  );
}
