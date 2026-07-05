export type FieldId =
  | 'po_number'
  | 'order_date'
  | 'supplier'
  | 'bill_to'
  | 'currency'
  | 'total'
  | 'payment_terms'
  | 'delivery_date';

export type PageNumber = 1 | 2;

export type ExtractField = {
  id: FieldId;
  label: string;
  type: 'string' | 'date' | 'number';
  value: string;
  /** How the value is printed on the page, when the document writes it another way. */
  printed: string;
  page: PageNumber;
  /** Between 0 and 100. Illustrative: the demonstration does not read a real document. */
  confidence: number;
  /** Why a person should look, for a value read with low confidence. */
  reason?: string;
};

export const DOCUMENT_NAME = 'purchase-order-2291.pdf';

export const FIELDS: ExtractField[] = [
  {
    id: 'po_number',
    label: 'PO number',
    type: 'string',
    value: 'PO-2291',
    printed: 'PO-2291',
    page: 1,
    confidence: 99,
  },
  {
    id: 'order_date',
    label: 'Order date',
    type: 'date',
    value: '2026-03-04',
    printed: '4 March 2026',
    page: 1,
    confidence: 98,
  },
  {
    id: 'supplier',
    label: 'Supplier',
    type: 'string',
    value: 'Harbourline Freight Ltd',
    printed: 'Harbourline Freight Ltd',
    page: 1,
    confidence: 97,
  },
  {
    id: 'bill_to',
    label: 'Bill to',
    type: 'string',
    value: 'Tallis Studio, 14 Quay Street',
    printed: 'Tallis Studio, 14 Quay Street',
    page: 1,
    confidence: 96,
  },
  {
    id: 'currency',
    label: 'Currency',
    type: 'string',
    value: 'EUR',
    printed: 'EUR',
    page: 2,
    confidence: 99,
  },
  {
    id: 'total',
    label: 'Total',
    type: 'number',
    value: '4860.00',
    printed: '4,860.00',
    page: 2,
    confidence: 98,
  },
  {
    id: 'payment_terms',
    label: 'Payment terms',
    type: 'string',
    value: 'Net 30',
    printed: 'Net 30',
    page: 2,
    confidence: 71,
    reason: 'A handwritten note beside the printed terms reads Net 45',
  },
  {
    id: 'delivery_date',
    label: 'Delivery date',
    type: 'date',
    value: '2026-03-18',
    printed: '18 March 2026',
    page: 2,
    confidence: 64,
    reason: 'A stamp covers part of the date',
  },
];

export const FLAGGED_IDS: FieldId[] = FIELDS.filter(
  (field) => field.reason !== undefined
).map((field) => field.id);

export const LINE_ITEMS = [
  {
    name: 'Pallet freight, Rotterdam to Lisbon',
    quantity: 12,
    amount: '2,160.00',
  },
  { name: 'Customs handling', quantity: 30, amount: '1,620.00' },
  { name: 'Cargo insurance', quantity: 1, amount: '1,080.00' },
];

export function fieldOf(id: FieldId) {
  const field = FIELDS.find((candidate) => candidate.id === id);
  return field ?? FIELDS[0];
}

export function isLowConfidence(field: ExtractField) {
  return field.reason !== undefined;
}
