import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

export default function Button22() {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={<Button variant='outline' size='icon' aria-label='Add item' />}
      >
        <PlusIcon />
      </TooltipTrigger>
      <TooltipContent>Add item</TooltipContent>
    </Tooltip>
  );
}
