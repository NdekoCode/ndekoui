'use client';

import { useCallback, useMemo, useState } from 'react';

type CheckboxTreeNode = {
  id: string;
  label: string;
  defaultChecked?: boolean;
  children?: CheckboxTreeNode[];
};

type CheckedState = boolean | 'indeterminate';

function collectDefaultChecked(node: CheckboxTreeNode, checked: Set<string>) {
  if (node.defaultChecked) {
    checked.add(node.id);
  }
  node.children?.forEach((child) => collectDefaultChecked(child, checked));
}

function setNodeChecked(
  node: CheckboxTreeNode,
  isChecked: boolean,
  checked: Set<string>
) {
  if (isChecked) {
    checked.add(node.id);
  } else {
    checked.delete(node.id);
  }
  node.children?.forEach((child) => setNodeChecked(child, isChecked, checked));
}

function isFullyChecked(state: CheckedState) {
  return state === true;
}

function isPartlyChecked(state: CheckedState) {
  const isChecked = state === true;
  const isIndeterminate = state === 'indeterminate';
  return isChecked || isIndeterminate;
}

function stateOfNode(
  node: CheckboxTreeNode,
  checkedIds: Set<string>
): CheckedState {
  if (!node.children) {
    return checkedIds.has(node.id);
  }
  const childStates = node.children.map((child) =>
    stateOfNode(child, checkedIds)
  );
  if (childStates.every(isFullyChecked)) {
    return true;
  }
  if (childStates.some(isPartlyChecked)) {
    return 'indeterminate';
  }
  return false;
}

function useCheckboxTree(tree: CheckboxTreeNode) {
  const initialChecked = useMemo(() => {
    const checked = new Set<string>();
    collectDefaultChecked(tree, checked);
    return checked;
  }, [tree]);

  const [checkedIds, setCheckedIds] = useState(initialChecked);

  const stateOf = useCallback(
    (node: CheckboxTreeNode) => stateOfNode(node, checkedIds),
    [checkedIds]
  );

  const toggle = useCallback(
    (node: CheckboxTreeNode) => {
      const nextChecked = new Set(checkedIds);
      const shouldCheck = stateOf(node) !== true;
      setNodeChecked(node, shouldCheck, nextChecked);
      setCheckedIds(nextChecked);
    },
    [checkedIds, stateOf]
  );

  return { stateOf, toggle };
}

type CheckboxTreeRenderProps = {
  node: CheckboxTreeNode;
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: () => void;
  children: React.ReactNode;
};

type CheckboxTreeProps = {
  tree: CheckboxTreeNode;
  renderNode: (props: CheckboxTreeRenderProps) => React.ReactNode;
};

function CheckboxTree({ tree, renderNode }: CheckboxTreeProps) {
  const { stateOf, toggle } = useCheckboxTree(tree);

  function renderTreeNode(node: CheckboxTreeNode): React.ReactNode {
    const state = stateOf(node);
    const children = node.children?.map(renderTreeNode);
    return renderNode({
      node,
      checked: state === true,
      indeterminate: state === 'indeterminate',
      onCheckedChange: () => toggle(node),
      children,
    });
  }

  return renderTreeNode(tree);
}

export { CheckboxTree, type CheckboxTreeNode, type CheckboxTreeRenderProps };
