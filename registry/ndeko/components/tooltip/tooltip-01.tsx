import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

export default function Tooltip01() {
  return (
    <Tooltip>
      <TooltipTrigger delay={0} render={<Button variant='outline' size='sm' />}>
        Publish
      </TooltipTrigger>
      <TooltipContent>Anyone with the link can view it</TooltipContent>
    </Tooltip>
  );
}
