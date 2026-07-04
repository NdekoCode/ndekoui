import type { RunAgent } from '@/registry/ndeko/lib/agent-run';

export const RUN_TITLE = 'Quarterly vendor review for Brightmoor Supply';

export const PLANNER: RunAgent = {
  id: 'planner',
  name: 'Planner',
  series: 1,
  status: 'idle',
  model: 'Lumen Max',
  role: 'Lead',
};

export const RESEARCHER: RunAgent = {
  id: 'researcher',
  name: 'Researcher',
  series: 2,
  status: 'idle',
  model: 'Lumen',
  parentId: 'planner',
};

export const WRITER: RunAgent = {
  id: 'writer',
  name: 'Writer',
  series: 3,
  status: 'idle',
  model: 'Lumen Swift',
  parentId: 'planner',
};

export const PRICING_URL = 'https://brightmoor-supply.example/pricing';

export const SEARCH_INPUT = {
  query: 'Brightmoor Supply wholesale price list',
  limit: 5,
};

export const SEARCH_OUTPUT = {
  results: 5,
  top: PRICING_URL,
};

export const PAGE_INPUT = {
  url: PRICING_URL,
  timeoutMs: 8000,
};

export const PAGE_ERROR = '403 Forbidden: the site refused the reader';

export const PAGE_OUTPUT = {
  title: 'Wholesale pricing',
  tables: 3,
  updated: '2026-10-02',
};

export const SHEET_INPUT = {
  file: 'q3-invoices.xlsx',
  sheet: 'Brightmoor',
  range: 'A1:F118',
};

export const SHEET_OUTPUT = {
  rows: 117,
  total: 48210.5,
  currency: 'USD',
  flagged: false,
};

export const SCRIPT_INPUT = {
  script: 'compare_prices.py',
  args: ['--quarter', 'Q3'],
};

export const SCRIPT_OUTPUT = {
  items: 42,
  aboveList: 6,
  overpaid: 1840.2,
};

export const EMAIL_INPUT = {
  to: 'accounts@brightmoor-supply.example',
  subject: 'Q3 pricing review',
};

export const EMAIL_OUTPUT = {
  words: 186,
  attachments: 1,
};
