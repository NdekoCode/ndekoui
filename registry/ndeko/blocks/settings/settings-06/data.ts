export type LicenseId = 'desktop' | 'server';

export type LicenseStatus = 'active' | 'expiring';

export type License = {
  id: LicenseId;
  product: string;
  plan: string;
  /** The key in groups of four, as it is printed and typed. */
  groups: string[];
  issuedOn: string;
  /** Renews on, or expires on: what happens at the end of the term. */
  termLine: string;
  status: LicenseStatus;
  statusLabel: string;
  /** What one place in the license is called, and what takes it. */
  unit: { one: string; many: string };
  meterLabel: string;
  holders: { one: string; many: string };
  used: number;
  limit: number;
};

export const WORKSPACE_NAME = 'Tidewell Studio';

/** A share of places in use from which the meter turns to the warning pair. */
export const NEAR_LIMIT_SHARE = 0.8;

/**
 * Sample keys, each with the word DEMO in it: they unlock nothing. A regenerated key takes the
 * next one of its product.
 */
export const NEXT_KEYS: Record<LicenseId, string[][]> = {
  desktop: [
    ['TWD', '8PLA', 'DEMO', 'W3NC', '5VJE'],
    ['TWD', 'R2KX', 'DEMO', 'H7QB', '9MTF'],
  ],
  server: [
    ['TWS', 'J4ZE', 'DEMO', 'C8LU', '2PXR'],
    ['TWS', 'N6WD', 'DEMO', 'K3YA', '7GHS'],
  ],
};

export const LICENSES: License[] = [
  {
    id: 'desktop',
    product: 'Tidewell Desktop',
    plan: 'Team license, 25 seats',
    groups: ['TWD', '4K7Q', 'DEMO', '2XM9', 'TW8R'],
    issuedOn: 'Mar 3, 2026',
    termLine: 'Renews Mar 3, 2027',
    status: 'active',
    statusLabel: 'Active',
    unit: { one: 'seat', many: 'seats' },
    meterLabel: 'Seats in use',
    holders: { one: 'computer', many: 'computers' },
    used: 18,
    limit: 25,
  },
  {
    id: 'server',
    product: 'Tidewell Server',
    plan: 'Self-hosted, 4 nodes',
    groups: ['TWS', '9BHT', 'DEMO', '6QNV', 'K4DW'],
    issuedOn: 'Dec 1, 2025',
    termLine: 'Expires Dec 1, 2026',
    status: 'expiring',
    statusLabel: 'Expires in 19 days',
    unit: { one: 'node', many: 'nodes' },
    meterLabel: 'Nodes in use',
    holders: { one: 'server', many: 'servers' },
    used: 4,
    limit: 4,
  },
];
