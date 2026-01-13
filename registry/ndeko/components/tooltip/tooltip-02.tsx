import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

export default function Tooltip02() {
  return (
    <Tooltip>
      <TooltipTrigger delay={0} render={<Button variant='outline' size='sm' />}>
        Sync
      </TooltipTrigger>
      <TooltipContent className='dark'>
        Last synced 4 minutes ago
      </TooltipContent>
    </Tooltip>
  );
}
