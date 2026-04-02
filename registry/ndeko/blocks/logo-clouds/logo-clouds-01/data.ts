export type ShapeId =
  | 'orbit'
  | 'peaks'
  | 'stack'
  | 'petals'
  | 'arch'
  | 'hexagon'
  | 'split'
  | 'tiles';

export type PlaceholderMark = {
  name: string;
  shape: ShapeId;
};

export const SECTION = {
  title: 'Teams that plan their week on Loomboard',
  note: 'Example marks with fictional names, to replace with logos you have permission to show',
};

export const MARKS: PlaceholderMark[] = [
  { name: 'Basalt & Pine', shape: 'peaks' },
  { name: 'Cinderwell', shape: 'orbit' },
  { name: 'Oxbow Studio', shape: 'arch' },
  { name: 'Marrow Lane', shape: 'stack' },
  { name: 'Quietfield', shape: 'petals' },
  { name: 'Tern Assembly', shape: 'hexagon' },
  { name: 'Halcyon Row', shape: 'split' },
  { name: 'Lindqvist Ade', shape: 'tiles' },
];
