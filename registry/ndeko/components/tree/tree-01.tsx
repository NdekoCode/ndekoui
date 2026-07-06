'use client';

import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core';

import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import {
  branchLoaderOf,
  hasChildren,
  indexBranches,
  nameOf,
  type Branch,
} from './_parts/tree-data';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const HELP_CENTER: Branch = {
  id: 'help-center',
  name: 'Harbor help center',
  children: [
    {
      id: 'getting-started',
      name: 'Getting started',
      children: [
        { id: 'create-account', name: 'Create your account' },
        { id: 'invite-team', name: 'Invite your team' },
        { id: 'import-data', name: 'Import your data' },
      ],
    },
    {
      id: 'billing',
      name: 'Billing',
      children: [
        { id: 'plans', name: 'Plans and seats' },
        {
          id: 'invoices',
          name: 'Invoices',
          children: [
            { id: 'download-invoice', name: 'Download an invoice' },
            { id: 'billing-address', name: 'Change the billing address' },
            { id: 'tax-number', name: 'Add a tax number' },
          ],
        },
        { id: 'refunds', name: 'Refunds' },
      ],
    },
    {
      id: 'security',
      name: 'Security',
      children: [
        { id: 'two-step', name: 'Two-step sign-in' },
        { id: 'single-sign-on', name: 'Single sign-on' },
      ],
    },
  ],
};

const TOPICS = indexBranches(HELP_CENTER);

const TOPIC_LOADER = branchLoaderOf(TOPICS);

const OPEN_AT_START = ['billing', 'invoices'];

export default function Tree01() {
  const tree = useTree<Branch>({
    initialState: { expandedItems: OPEN_AT_START },
    rootItemId: HELP_CENTER.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: TOPIC_LOADER,
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  return (
    <Tree aria-label={HELP_CENTER.name} tree={tree} className='w-full'>
      <TreeRows>
        {tree.getItems().map((item) => (
          <TreeRow key={item.getId()} item={item}>
            <TreeItemLabel />
          </TreeRow>
        ))}
      </TreeRows>
    </Tree>
  );
}
