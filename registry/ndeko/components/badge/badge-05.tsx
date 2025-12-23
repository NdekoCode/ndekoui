import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';

export default function Badge05() {
  return (
    <Badge
      render={<a href='#' />}
      className={cn('hover:bg-primary/15 transition-colors', FOCUS_RING)}
    >
      Changelog
    </Badge>
  );
}
