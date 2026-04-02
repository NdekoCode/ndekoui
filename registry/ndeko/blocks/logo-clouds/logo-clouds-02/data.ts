export type ShapeId = 'leaf' | 'wave' | 'bolt' | 'ring' | 'quarter' | 'diamond';

export type PlaceholderMark = {
  name: string;
  shape: ShapeId;
};

export const SECTION = {
  title: 'Studios that send their invoices with Tallyfold',
  note: 'Example marks with fictional names',
};

export const MARKS: PlaceholderMark[] = [
  { name: 'Fenwick Hall', shape: 'leaf' },
  { name: 'Saltmarsh & Co', shape: 'wave' },
  { name: 'Ninefold Press', shape: 'bolt' },
  { name: 'Arden Vale', shape: 'ring' },
  { name: 'Kiln Works', shape: 'quarter' },
  { name: 'Pellucid', shape: 'diamond' },
];
