import { cn } from '@/registry/ndeko/lib/utils';
import { TimelineDate } from '@/registry/ndeko/ui/timeline';

import { agoLabelOf, stampLabelOf } from './dates';

type AgoTimeProps = {
  at: string;
  className?: string;
};

export function AgoTime({ at, className }: AgoTimeProps) {
  return (
    <TimelineDate
      dateTime={at}
      title={stampLabelOf(at)}
      className={cn('mb-0', className)}
    >
      {agoLabelOf(at)}
    </TimelineDate>
  );
}
