import type { EmptyPage as EmptyPageCopy, NavItem } from './data';

type EmptyPageProps = {
  item: NavItem;
  page: EmptyPageCopy;
};

export function EmptyPage({ item, page }: EmptyPageProps) {
  const ItemIcon = item.icon;

  return (
    <div className='flex flex-col items-center gap-3 px-4 py-24 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-10 items-center justify-center rounded-lg'>
        <ItemIcon className='size-5' />
      </span>
      <div className='flex flex-col gap-1'>
        <h1 className='text-sm font-medium text-balance'>{page.title}</h1>
        <p className='text-muted-foreground max-w-xs text-[13px] text-balance'>
          {page.line}
        </p>
      </div>
    </div>
  );
}
