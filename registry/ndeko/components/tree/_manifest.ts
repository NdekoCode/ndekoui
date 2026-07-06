import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'tree-01',
    source: 'ndeko',
    title: 'Basic tree',
    description:
      'Help topics in folders that open with a click or the arrow keys, their rows arriving with height and opacity.',
  },
  {
    name: 'tree-02',
    source: 'ndeko',
    title: 'Tree with guide lines',
    description:
      'Vertical lines show which aisle each rack belongs to, and grow with the rows as a folder opens.',
  },
  {
    name: 'tree-03',
    source: 'ndeko',
    title: 'Tree with icons',
    description:
      'Folders and files with icons, the folder icon opening with its row.',
  },
  {
    name: 'tree-04',
    source: 'ndeko',
    title: 'Chevron on the right',
    description:
      'A book icon leads each shelf and opens with it, while the chevron sits at the end of the row.',
  },
  {
    name: 'tree-05',
    source: 'ndeko',
    title: 'Drag and drop tree',
    description:
      'Select several rows and drag them, or press Ctrl Shift D: they glide to their new place and the move is spoken.',
  },
  {
    name: 'tree-06',
    source: 'ndeko',
    title: 'Renamable tree',
    description:
      'Press F2 or Rename to edit the focused row in place, then it glides to its new place in the alphabet.',
  },
  {
    name: 'tree-07',
    source: 'ndeko',
    title: 'Searchable tree',
    description:
      'Typing opens every folder, highlights the matches and counts them; clearing the field brings back the folders you had open.',
  },
  {
    name: 'tree-08',
    source: 'comp-572',
    title: 'Filterable tree',
    description: 'Only the matches and their folders stay in the tree.',
  },
  {
    name: 'tree-09',
    source: 'ndeko',
    title: 'Double-click to open',
    description:
      'A click selects a folder and a double click or Enter opens it, while the highlight glides to the selected row.',
  },
  {
    name: 'tree-10',
    source: 'ndeko',
    title: 'Expand and collapse all',
    description:
      'Two buttons open or close every folder, with the number of children at the end of each row.',
  },
  {
    name: 'tree-11',
    source: 'ndeko',
    title: 'File explorer',
    description:
      'A repository with an icon per file type, sorted again when a file is dropped on a folder.',
  },
  {
    name: 'tree-12',
    source: 'comp-576',
    title: 'Navigation tree',
    description: 'Documentation links with the current page open and marked.',
  },
  {
    name: 'tree-13',
    source: 'ndeko',
    title: 'Checkboxes on the right',
    description:
      'A checkbox at the end of each row, folders following their items, and a count that rolls as boxes change.',
  },
  {
    name: 'tree-14',
    source: 'ndeko',
    title: 'Checkboxes on the left',
    description:
      'A checkbox before each row, folders following their items, with Select all and Clear under the tree.',
  },
  {
    name: 'tree-15',
    source: 'ndeko',
    title: 'Checkable folders',
    description:
      'Checking a folder checks it and everything inside it, and the number of documents rolls to the new total.',
  },
];
