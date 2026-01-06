'use client';

import { Fragment, useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  CheckboxTree,
  type CheckboxTreeNode,
  type CheckboxTreeRenderProps,
} from '@/registry/ndeko/ui/checkbox-tree';
import { Label } from '@/registry/ndeko/ui/label';

const PROJECTS: CheckboxTreeNode = {
  id: 'all',
  label: 'All projects',
  children: [
    { id: 'website', label: 'Website redesign', defaultChecked: true },
    {
      id: 'mobile',
      label: 'Mobile app',
      children: [
        { id: 'ios', label: 'iOS release' },
        { id: 'android', label: 'Android release', defaultChecked: true },
      ],
    },
    { id: 'brand', label: 'Brand refresh' },
  ],
};

export default function Checkbox18() {
  const id = useId();

  function renderNode({
    node,
    checked,
    indeterminate,
    onCheckedChange,
    children,
  }: CheckboxTreeRenderProps) {
    const nodeId = `${id}-${node.id}`;

    return (
      <Fragment key={nodeId}>
        <div className='flex items-center gap-2'>
          <Checkbox
            id={nodeId}
            checked={checked}
            indeterminate={indeterminate}
            onCheckedChange={onCheckedChange}
          />
          <Label htmlFor={nodeId}>{node.label}</Label>
        </div>
        {children && <div className='ms-6 space-y-3'>{children}</div>}
      </Fragment>
    );
  }

  return (
    <div className='space-y-3'>
      <CheckboxTree tree={PROJECTS} renderNode={renderNode} />
    </div>
  );
}
