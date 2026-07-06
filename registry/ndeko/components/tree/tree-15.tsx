'use client';

import {
  checkboxesFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';

import { WordRoll } from '@/components/core/word-roll';
import { FileTextIcon } from '@/registry/ndeko/lib/icons';
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
import { EntryGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const PATIENT_FILE: Branch = {
  id: 'patient-file',
  name: 'Juniper Health patient file',
  children: [
    {
      id: 'referral',
      name: 'Referral',
      children: [
        { id: 'referral-letter', name: 'Referral letter' },
        { id: 'insurer-approval', name: 'Insurer approval' },
      ],
    },
    {
      id: 'lab-results',
      name: 'Lab results',
      children: [
        { id: 'blood-panel-march', name: 'Blood panel, March' },
        { id: 'blood-panel-june', name: 'Blood panel, June' },
        {
          id: 'imaging',
          name: 'Imaging',
          children: [
            { id: 'knee-x-ray', name: 'Knee X-ray' },
            { id: 'radiology-report', name: 'Radiology report' },
          ],
        },
      ],
    },
    {
      id: 'visit-notes',
      name: 'Visit notes',
      children: [
        { id: 'first-assessment', name: 'First assessment' },
        { id: 'six-week-review', name: 'Six-week review' },
      ],
    },
  ],
};

const RECORDS = indexBranches(PATIENT_FILE);

const RECORD_LOADER = branchLoaderOf(RECORDS);

const DOCUMENT_IDS = leafIdsOf(RECORDS);

const OPEN_AT_START = ['lab-results', 'imaging'];

const SHARED_AT_START = ['blood-panel-march', 'blood-panel-june'];

function shareLabelOf(documentCount: number) {
  if (documentCount === 0) {
    return 'No document to share';
  }
  if (documentCount === 1) {
    return '1 document to share';
  }
  return `${documentCount} documents to share`;
}

export default function Tree15() {
  const tree = useTree<Branch>({
    initialState: {
      expandedItems: OPEN_AT_START,
      checkedItems: SHARED_AT_START,
    },
    rootItemId: PATIENT_FILE.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: RECORD_LOADER,
    canCheckFolders: true,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      checkboxesFeature,
    ],
  });
  const { checkedItems } = tree.getState();
  const documentCount = countIn(DOCUMENT_IDS, checkedItems);
  const shareLabel = shareLabelOf(documentCount);

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <Tree aria-label={PATIENT_FILE.name} tree={tree}>
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow
              key={item.getId()}
              item={item}
              leading={<ItemCheckbox item={item} />}
              hasGuides
            >
              <TreeItemLabel>
                <EntryGlyph isFolder={item.isFolder()} leaf={FileTextIcon} />
                <span className='truncate'>{item.getItemName()}</span>
              </TreeItemLabel>
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <p className='text-muted-foreground text-xs tabular-nums'>
        <WordRoll text={shareLabel} value={documentCount} />
      </p>
      <LiveRegion message={shareLabel} />
    </div>
  );
}
