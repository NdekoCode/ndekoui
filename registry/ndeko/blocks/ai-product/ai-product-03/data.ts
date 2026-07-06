import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export type LeadStatus = 'new' | 'contacted' | 'qualified';

export type OwnerId = 'grace' | 'samuel' | 'aline';

export type Owner = {
  id: OwnerId;
  name: string;
  firstName: string;
};

export const OWNERS: Owner[] = [
  { id: 'grace', name: 'Grace Mbuyi', firstName: 'Grace' },
  { id: 'samuel', name: 'Samuel Mukendi', firstName: 'Samuel' },
  { id: 'aline', name: 'Aline Kasongo', firstName: 'Aline' },
];

export type Lead = {
  id: string;
  name: string;
  company: string;
  city: string;
  status: LeadStatus;
  owner: OwnerId;
  /** What the agent finds out. The table shows it once the agent has landed it. */
  email: string;
  employees: number;
};

/** Invented people at invented companies. The addresses use a reserved domain. */
export const LEADS: Lead[] = [
  {
    id: 'ilunga',
    name: 'Patrick Ilunga',
    company: 'Zomba Freight',
    city: 'Lubumbashi',
    status: 'qualified',
    owner: 'grace',
    email: 'p.ilunga@zomba-freight.example',
    employees: 120,
  },
  {
    id: 'mukendi',
    name: 'Chantal Mukendi',
    company: 'Lualaba Mills',
    city: 'Kolwezi',
    status: 'contacted',
    owner: 'samuel',
    email: 'c.mukendi@lualaba-mills.example',
    employees: 340,
  },
  {
    id: 'kabasele',
    name: 'Joël Kabasele',
    company: 'Ituri Tea Works',
    city: 'Kisangani',
    status: 'new',
    owner: 'aline',
    email: 'j.kabasele@ituri-tea.example',
    employees: 58,
  },
  {
    id: 'tshibangu',
    name: 'Marie-Louise Tshibangu',
    company: 'Nyiragongo Labs',
    city: 'Goma',
    status: 'qualified',
    owner: 'grace',
    email: 'ml.tshibangu@nyiragongo-labs.example',
    employees: 24,
  },
  {
    id: 'mbala',
    name: 'Dieudonné Mbala',
    company: 'Mbuji Cold Chain',
    city: 'Mbuji-Mayi',
    status: 'new',
    owner: 'samuel',
    email: 'd.mbala@mbuji-coldchain.example',
    employees: 76,
  },
  {
    id: 'kasongo',
    name: 'Sylvie Kasongo',
    company: 'Tshopo Logistics',
    city: 'Kisangani',
    status: 'contacted',
    owner: 'aline',
    email: 's.kasongo@tshopo-logistics.example',
    employees: 210,
  },
  {
    id: 'bahati',
    name: 'Trésor Bahati',
    company: 'Maniema Solar',
    city: 'Bukavu',
    status: 'new',
    owner: 'grace',
    email: 't.bahati@maniema-solar.example',
    employees: 33,
  },
  {
    id: 'mwamba',
    name: 'Aline Mwamba',
    company: 'Kasai Print House',
    city: 'Kananga',
    status: 'qualified',
    owner: 'samuel',
    email: 'a.mwamba@kasai-print.example',
    employees: 18,
  },
  {
    id: 'lukusa',
    name: 'Fiston Lukusa',
    company: 'Katanga Fresh',
    city: 'Likasi',
    status: 'contacted',
    owner: 'aline',
    email: 'f.lukusa@katanga-fresh.example',
    employees: 95,
  },
  {
    id: 'kalala',
    name: 'Nadine Kalala',
    company: 'Equateur Boats',
    city: 'Mbandaka',
    status: 'new',
    owner: 'grace',
    email: 'n.kalala@equateur-boats.example',
    employees: 41,
  },
  {
    id: 'mutombo',
    name: 'Héritier Mutombo',
    company: 'Boma Port Services',
    city: 'Boma',
    status: 'contacted',
    owner: 'samuel',
    email: 'h.mutombo@boma-port.example',
    employees: 260,
  },
  {
    id: 'nkulu',
    name: 'Esther Nkulu',
    company: 'Kisangani Bikes',
    city: 'Kisangani',
    status: 'qualified',
    owner: 'aline',
    email: 'e.nkulu@kisangani-bikes.example',
    employees: 12,
  },
  {
    id: 'mavungu',
    name: 'Gloire Mavungu',
    company: 'Likasi Copper Tools',
    city: 'Likasi',
    status: 'new',
    owner: 'grace',
    email: 'g.mavungu@likasi-copper.example',
    employees: 88,
  },
  {
    id: 'ngoy',
    name: 'Rachel Ngoy',
    company: 'Goma Coffee Roasters',
    city: 'Goma',
    status: 'qualified',
    owner: 'samuel',
    email: 'r.ngoy@goma-coffee.example',
    employees: 29,
  },
  {
    id: 'kitenge',
    name: 'Bienvenu Kitenge',
    company: 'Uvira Fisheries',
    city: 'Uvira',
    status: 'contacted',
    owner: 'aline',
    email: 'b.kitenge@uvira-fisheries.example',
    employees: 64,
  },
  {
    id: 'mulumba',
    name: 'Clarisse Mulumba',
    company: 'Kananga Radio',
    city: 'Kananga',
    status: 'new',
    owner: 'grace',
    email: 'c.mulumba@kananga-radio.example',
    employees: 15,
  },
];

export const PASS_IDS = [
  'ilunga',
  'mukendi',
  'kabasele',
  'tshibangu',
  'mbala',
  'kasongo',
];

export const AGENT: { name: string; series: SeriesSlot } = {
  name: 'Researcher',
  series: 3,
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
};

export const STATUS_ORDER: Record<LeadStatus, number> = {
  new: 0,
  contacted: 1,
  qualified: 2,
};

const FALLBACK_OWNER = OWNERS[0];

export function ownerOf(id: OwnerId) {
  const owner = OWNERS.find((candidate) => candidate.id === id);
  return owner ?? FALLBACK_OWNER;
}

export function leadOf(id: string) {
  return LEADS.find((candidate) => candidate.id === id);
}
