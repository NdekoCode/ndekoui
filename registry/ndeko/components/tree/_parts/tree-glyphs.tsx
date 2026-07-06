import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const LAYER =
  'text-muted-foreground size-4 transition-[opacity,scale,filter] duration-150 ease-(--ease-out-strong) [grid-area:1/1]';

const GONE_WHEN_OPEN =
  'in-aria-[expanded=true]:scale-60 in-aria-[expanded=true]:opacity-0 in-aria-[expanded=true]:blur-[2px]';

const GONE_WHEN_CLOSED =
  'in-aria-[expanded=false]:scale-60 in-aria-[expanded=false]:opacity-0 in-aria-[expanded=false]:blur-[2px]';

type OpeningGlyphProps = {
  closed: Icon;
  open: Icon;
};

/* The swap reads aria-expanded on the row around it, so it needs no state and costs no script. */
export function OpeningGlyph({
  closed: Closed,
  open: Open,
}: OpeningGlyphProps) {
  return (
    <span className='grid shrink-0'>
      <Closed className={cn(LAYER, GONE_WHEN_OPEN)} />
      <Open className={cn(LAYER, GONE_WHEN_CLOSED)} />
    </span>
  );
}

export function FolderGlyph() {
  return <OpeningGlyph closed={FolderIcon} open={FolderOpenIcon} />;
}

type EntryGlyphProps = {
  isFolder: boolean;
  leaf?: Icon;
};

export function EntryGlyph({
  isFolder,
  leaf: Leaf = FileIcon,
}: EntryGlyphProps) {
  if (isFolder) {
    return <FolderGlyph />;
  }
  return <Leaf className='text-muted-foreground size-4' />;
}
