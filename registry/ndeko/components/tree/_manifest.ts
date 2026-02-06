import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'tree-01',
    source: 'comp-565',
    title: 'Basic tree',
    description: 'Teams in folders that open with the arrow keys or a click.',
  },
  {
    name: 'tree-02',
    source: 'comp-566',
    title: 'Tree with guide lines',
    description: 'Vertical lines show which folder each row belongs to.',
  },
  {
    name: 'tree-03',
    source: 'comp-567',
    title: 'Tree with icons',
    description: 'Folder and file icons, the folder opening with its row.',
  },
  {
    name: 'tree-04',
    source: 'comp-568',
    title: 'Chevron on the right',
    description: 'Icons lead each row and the chevron sits at the end.',
  },
  {
    name: 'tree-05',
    source: 'comp-569',
    title: 'Drag and drop tree',
    description: 'Select several rows and drag them to a new place.',
  },
  {
    name: 'tree-06',
    source: 'comp-570',
    title: 'Renamable tree',
    description:
      'Press F2 to rename the focused row; it moves to its new place.',
  },
  {
    name: 'tree-07',
    source: 'comp-571',
    title: 'Searchable tree',
    description: 'Typing opens every folder and highlights the matches.',
  },
  {
    name: 'tree-08',
    source: 'comp-572',
    title: 'Filterable tree',
    description: 'Only the matches and their folders stay in the tree.',
  },
  {
    name: 'tree-09',
    source: 'comp-573',
    title: 'Double-click to open',
    description: 'A click selects a row and a double click opens its folder.',
  },
  {
    name: 'tree-10',
    source: 'comp-574',
    title: 'Expand and collapse all',
    description: 'Two buttons open or close every folder, with child counts.',
  },
  {
    name: 'tree-11',
    source: 'comp-575',
    title: 'File explorer',
    description: 'Project files by type, sorted again after a drop.',
  },
  {
    name: 'tree-12',
    source: 'comp-576',
    title: 'Navigation tree',
    description: 'Documentation links with the current page open and marked.',
  },
  {
    name: 'tree-13',
    source: 'comp-597',
    title: 'Checkboxes on the right',
    description:
      'A checkbox at the end of each row, folders following their items.',
  },
  {
    name: 'tree-14',
    source: 'comp-598',
    title: 'Checkboxes on the left',
    description: 'A checkbox before each row, folders following their items.',
  },
  {
    name: 'tree-15',
    source: 'comp-599',
    title: 'Checkable folders',
    description: 'Checking a folder checks it and everything inside it.',
  },
];
