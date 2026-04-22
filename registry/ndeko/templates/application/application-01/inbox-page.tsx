import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { WORKSPACE_NAME, type InboxItem } from './data';
import { InboxList, unreadLabelOf, type InboxActions } from './inbox-list';

type InboxPageProps = InboxActions & {
  items: InboxItem[];
  onMarkAllRead: () => void;
};

export function InboxPage({
  items,
  onMarkAllRead,
  onOpen,
  onToggleRead,
  onArchive,
}: InboxPageProps) {
  const unreadCount = items.filter((item) => item.isUnread).length;
  const hasUnread = unreadCount > 0;

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='mx-auto w-full max-w-2xl px-4 py-6 sm:px-6'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <h1 className='truncate text-sm font-semibold'>Inbox</h1>
            <p className='text-muted-foreground text-xs tabular-nums'>
              {`${unreadLabelOf(unreadCount)} · ${WORKSPACE_NAME}`}
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            disabled={!hasUnread}
            onClick={onMarkAllRead}
            className='text-muted-foreground'
          >
            <CheckIcon />
            Mark all as read
          </Button>
        </div>
        <div className='bg-card hairline-ring ring-border mt-4 rounded-xl pt-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <InboxList
            items={items}
            onOpen={onOpen}
            onToggleRead={onToggleRead}
            onArchive={onArchive}
          />
        </div>
      </div>
    </div>
  );
}
