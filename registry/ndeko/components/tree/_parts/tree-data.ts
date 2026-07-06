import {
  isOrderedDragTarget,
  type DragTarget,
  type ItemInstance,
} from '@headless-tree/core';

export type Branch = {
  id: string;
  name: string;
  children?: Branch[];
};

type BranchIndex = Record<string, Branch>;

export type FlatNode = {
  name: string;
  isFolder: boolean;
  childIds: string[];
};

export type FlatNodes = Record<string, FlatNode>;

function idOf(branch: Branch) {
  return branch.id;
}

function childIdsOf(branch: Branch) {
  const children = branch.children ?? [];
  return children.map(idOf);
}

function collectBranches(branch: Branch, index: BranchIndex) {
  index[branch.id] = branch;
  const children = branch.children ?? [];
  children.forEach((child) => collectBranches(child, index));
}

export function indexBranches(root: Branch) {
  const index: BranchIndex = {};
  collectBranches(root, index);
  return index;
}

export function branchLoaderOf(index: BranchIndex) {
  function getItem(branchId: string) {
    return index[branchId];
  }

  function getChildren(branchId: string) {
    const branch = index[branchId];
    return childIdsOf(branch);
  }

  return { getItem, getChildren };
}

export function nameOf<Data extends { name: string }>(
  item: ItemInstance<Data>
) {
  return item.getItemData().name;
}

export function hasChildren(item: ItemInstance<Branch>) {
  const children = item.getItemData().children ?? [];
  return children.length > 0;
}

export function leafIdsOf(index: BranchIndex) {
  const branches = Object.values(index);
  const leaves = branches.filter((branch) => branch.children === undefined);
  return leaves.map(idOf);
}

export function folderIdsOf(index: BranchIndex) {
  const branches = Object.values(index);
  const folders = branches.filter((branch) => branch.children !== undefined);
  return folders.map(idOf);
}

/* A tree may list a checked id twice, so the ids are counted from the side that has each of them once. */
export function countIn(ids: string[], pickedIds: string[]) {
  const picked = ids.filter((id) => pickedIds.includes(id));
  return picked.length;
}

export function parentIdsOf(index: BranchIndex) {
  const parentIds: Record<string, string> = {};
  for (const branch of Object.values(index)) {
    for (const childId of childIdsOf(branch)) {
      parentIds[childId] = branch.id;
    }
  }
  return parentIds;
}

function flatNodeOf(branch: Branch): FlatNode {
  const isFolder = branch.children !== undefined;
  const childIds = childIdsOf(branch);
  return { name: branch.name, isFolder, childIds };
}

export function flattenBranches(root: Branch) {
  const index = indexBranches(root);
  const nodes: FlatNodes = {};
  for (const [branchId, branch] of Object.entries(index)) {
    nodes[branchId] = flatNodeOf(branch);
  }
  return nodes;
}

export function isFlatFolder(item: ItemInstance<FlatNode>) {
  return item.getItemData().isFolder;
}

function withoutIds(ids: string[], removedIds: string[]) {
  return ids.filter((id) => !removedIds.includes(id));
}

function insertedAt(ids: string[], index: number, addedIds: string[]) {
  const before = ids.slice(0, index);
  const after = ids.slice(index);
  return [...before, ...addedIds, ...after];
}

function slotOf(target: DragTarget<FlatNode>, siblingCount: number) {
  if (isOrderedDragTarget(target)) {
    return target.insertionIndex;
  }
  return siblingCount;
}

/** One update for the whole drop, so no render ever shows the moved rows missing from the tree. */
export function moveNodes(
  nodes: FlatNodes,
  movedIds: string[],
  target: DragTarget<FlatNode>
) {
  const moved: FlatNodes = {};
  for (const [nodeId, node] of Object.entries(nodes)) {
    const childIds = withoutIds(node.childIds, movedIds);
    moved[nodeId] = { ...node, childIds };
  }
  const parentId = target.item.getId();
  const parent = moved[parentId];
  const slot = slotOf(target, parent.childIds.length);
  const childIds = insertedAt(parent.childIds, slot, movedIds);
  moved[parentId] = { ...parent, childIds };
  return moved;
}
