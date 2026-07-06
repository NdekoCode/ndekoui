import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type ToolId = 'stripe' | 'quickbooks';

export type Tool = {
  id: ToolId;
  name: string;
  brand: BrandSlug;
};

export const AGENT = {
  id: 'reconciler',
  name: 'Reconciler',
};

export const TOOLS: Record<ToolId, Tool> = {
  stripe: { id: 'stripe', name: 'Stripe', brand: 'stripe' },
  quickbooks: { id: 'quickbooks', name: 'QuickBooks', brand: 'quickbooks' },
};

export const RUN_TITLE = 'March close';
