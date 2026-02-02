import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'pagination-01',
    source: 'comp-454',
    title: 'Previous and next',
    description: 'Two ghost pills at both ends that step through the pages.',
  },
  {
    name: 'pagination-02',
    source: 'comp-455',
    title: 'Previous and next with arrows',
    description: 'Ghost pills whose arrow leans towards the page they open.',
  },
  {
    name: 'pagination-03',
    source: 'comp-456',
    title: 'Page count between arrows',
    description:
      'The current page and the total sit between two arrows at both ends.',
  },
  {
    name: 'pagination-04',
    source: 'comp-457',
    title: 'Compact page count',
    description: 'The page count and its two arrows grouped in the centre.',
  },
  {
    name: 'pagination-05',
    source: 'comp-458',
    title: 'Page count with text links',
    description: 'The page count on the left, Previous and Next on the right.',
  },
  {
    name: 'pagination-06',
    source: 'comp-459',
    title: 'Numbered pages',
    description:
      'Page numbers with ellipses and an outline pill that travels to the current page.',
  },
  {
    name: 'pagination-07',
    source: 'comp-460',
    title: 'Numbered pages with first and last',
    description: 'Page numbers framed by jumps to the first and last page.',
  },
  {
    name: 'pagination-08',
    source: 'comp-461',
    title: 'Grouped pages',
    description:
      'Page numbers joined into one segmented control; a flat fill travels to the current page.',
  },
  {
    name: 'pagination-09',
    source: 'comp-462',
    title: 'Pages with results per page',
    description:
      'The page count, the page numbers and a select for the page size.',
  },
  {
    name: 'pagination-10',
    source: 'comp-463',
    title: 'Table footer',
    description:
      'Rows per page, the visible row range and arrows to the first and last page.',
  },
  {
    name: 'pagination-11',
    source: 'comp-464',
    title: 'Page select',
    description: 'A select of every page between the arrows.',
  },
  {
    name: 'pagination-12',
    source: 'comp-465',
    title: 'Go to page',
    description: 'Page numbers next to a field that jumps to a typed page.',
  },
];
