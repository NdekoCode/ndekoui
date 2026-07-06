'use client';

import {
  checkboxesFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';

import { WordRoll } from '@/components/core/word-roll';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import { ItemCheckbox } from './_parts/item-checkbox';
import {
  branchLoaderOf,
  countIn,
  hasChildren,
  indexBranches,
  leafIdsOf,
  nameOf,
  type Branch,
} from './_parts/tree-data';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const NOTIFICATIONS: Branch = {
  id: 'notifications',
  name: 'Harbor push notifications',
  children: [
    {
      id: 'projects',
      name: 'Projects',
      children: [
        {
          id: 'tasks',
          name: 'Tasks',
          children: [
            { id: 'assigned-to-me', name: 'Assigned to me' },
            { id: 'due-tomorrow', name: 'Due tomorrow' },
            { id: 'marked-done', name: 'Marked done' },
          ],
        },
        { id: 'mentions', name: 'Comments and mentions' },
        { id: 'weekly-summary', name: 'Weekly summary' },
      ],
    },
    {
      id: 'billing',
      name: 'Billing',
      children: [
        { id: 'invoice-ready', name: 'Invoice ready' },
        { id: 'payment-failed', name: 'Payment failed' },
      ],
    },
    {
      id: 'security',
      name: 'Security',
      children: [
        { id: 'new-sign-in', name: 'New sign-in' },
        { id: 'password-changed', name: 'Password changed' },
      ],
    },
  ],
};

const TOPICS = indexBranches(NOTIFICATIONS);

const TOPIC_LOADER = branchLoaderOf(TOPICS);

const ALERT_IDS = leafIdsOf(TOPICS);

const OPEN_AT_START = ['projects', 'tasks'];

const ON_AT_START = [
  'assigned-to-me',
  'due-tomorrow',
  'payment-failed',
  'new-sign-in',
];

export default function Tree13() {
  const tree = useTree<Branch>({
    initialState: {
      expandedItems: OPEN_AT_START,
      checkedItems: ON_AT_START,
    },
    rootItemId: NOTIFICATIONS.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: TOPIC_LOADER,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      checkboxesFeature,
    ],
  });
  const { checkedItems } = tree.getState();
  const onCount = countIn(ALERT_IDS, checkedItems);
  const summary = `${onCount} of ${ALERT_IDS.length} on`;

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <div className='flex items-baseline justify-between gap-2'>
        <h3 className='truncate text-[13px] font-medium'>Push notifications</h3>
        <WordRoll
          text={summary}
          value={onCount}
          className='text-muted-foreground text-xs tabular-nums'
        />
      </div>
      <Tree aria-label={NOTIFICATIONS.name} tree={tree}>
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow
              key={item.getId()}
              item={item}
              trailing={<ItemCheckbox item={item} />}
            >
              <TreeItemLabel />
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <LiveRegion message={`Push notifications: ${summary}`} />
    </div>
  );
}
