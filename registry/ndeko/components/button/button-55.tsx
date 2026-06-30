import { DownloadIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

const SLIDE = 'transition-[translate,opacity] ease-(--ease-out-strong)';

const LABEL_SLIDE =
  'duration-200 group-hover/button:-translate-x-3 group-hover/button:opacity-0 group-hover/button:duration-150';

const ICON_SLIDE =
  'translate-x-3 opacity-0 duration-150 group-hover/button:translate-x-0 group-hover/button:opacity-100 group-hover/button:duration-200';

export default function Button55() {
  return (
    <Button className='overflow-hidden'>
      <span className={cn(SLIDE, LABEL_SLIDE)}>Download</span>
      <span
        aria-hidden='true'
        className={cn(
          SLIDE,
          ICON_SLIDE,
          'absolute inset-0 flex items-center justify-center'
        )}
      >
        <DownloadIcon />
      </span>
    </Button>
  );
}
