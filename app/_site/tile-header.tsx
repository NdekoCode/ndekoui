import { CodeDialog } from './code-dialog';
import { FullPageButton } from './full-page-button';

export type TitleTag = 'h2' | 'h3';

type TileHeaderProps = {
  title: string;
  name: string;
  description: string;
  /** `h3` when the tile sits under a section that has its own `h2`. */
  titleAs?: TitleTag;
  /** Where the item opens alone on a page of its own, in a new tab. */
  fullPageHref?: string;
};

/** Sits on the line of the item name, where there is room, and leaves that line as tall as it was. */
const FULL_PAGE_BUTTON = 'text-muted-foreground -my-1 size-6';

export function TileHeader({
  title,
  name,
  description,
  titleAs: Title = 'h2',
  fullPageHref,
}: TileHeaderProps) {
  return (
    <header className='@container/tile-header flex items-center gap-3 py-1.5 ps-3 pe-0.5'>
      <div className='flex min-w-0 flex-1 flex-col'>
        <Title className='truncate text-[13px] font-medium'>{title}</Title>
        <div className='flex min-w-0 items-center gap-0.5'>
          <p className='text-muted-foreground truncate font-mono text-[11px]'>
            {name}
          </p>
          {fullPageHref && (
            <FullPageButton
              href={fullPageHref}
              title={title}
              className={FULL_PAGE_BUTTON}
            />
          )}
        </div>
      </div>
      <CodeDialog title={title} description={description} itemName={name} />
    </header>
  );
}
