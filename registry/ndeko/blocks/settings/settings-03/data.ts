export type SectionId = 'general' | 'members' | 'danger';

export type Role = 'member' | 'viewer' | 'guest';

export type InvitePolicy = 'admins' | 'admins-members';

export type WorkspaceValues = {
  name: string;
  slug: string;
  timeZone: string;
  defaultRole: Role;
  invitePolicy: InvitePolicy;
  approveJoins: boolean;
  allowedDomain: string;
};

export type WorkspaceField = keyof WorkspaceValues;

export type RoleOption = {
  value: Role;
  label: string;
  line: string;
  /** How many people hold the role today, so the choice reads against real numbers. */
  holders: number;
};

export const INITIAL_WORKSPACE: WorkspaceValues = {
  name: 'Tidewell Studio',
  slug: 'tidewell-studio',
  timeZone: 'africa-lagos',
  defaultRole: 'member',
  invitePolicy: 'admins-members',
  approveJoins: true,
  allowedDomain: 'tidewell.example',
};

export const WORKSPACE_HOST = 'app.tidewell.example/';

export const WORKSPACE_FACTS = {
  members: 14,
  projects: 6,
  tasks: 1284,
  graceDays: 14,
  deletionDate: '19 November 2026',
};

export const SECTION_KEYS: Record<SectionId, WorkspaceField[]> = {
  general: ['name', 'slug', 'timeZone'],
  members: ['defaultRole', 'invitePolicy', 'approveJoins', 'allowedDomain'],
  danger: [],
};

export const FIELD_SECTION: Record<WorkspaceField, SectionId> = {
  name: 'general',
  slug: 'general',
  timeZone: 'general',
  defaultRole: 'members',
  invitePolicy: 'members',
  approveJoins: 'members',
  allowedDomain: 'members',
};

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'member',
    label: 'Member',
    line: 'Creates and edits tasks, tracks time, sees every project',
    holders: 11,
  },
  {
    value: 'viewer',
    label: 'Viewer',
    line: 'Reads and comments, cannot track time or edit',
    holders: 2,
  },
  {
    value: 'guest',
    label: 'Guest',
    line: 'Sees only the projects someone invites them to',
    holders: 1,
  },
];

export const INVITE_POLICIES: { value: InvitePolicy; label: string }[] = [
  { value: 'admins', label: 'Admins only' },
  { value: 'admins-members', label: 'Admins and members' },
];

export const TIME_ZONES = [
  { value: 'africa-lagos', label: 'Lagos, West Africa Time' },
  { value: 'africa-kinshasa', label: 'Kinshasa, West Africa Time' },
  { value: 'europe-london', label: 'London, Greenwich Mean Time' },
  { value: 'europe-paris', label: 'Paris, Central European Time' },
  { value: 'america-new-york', label: 'New York, Eastern Time' },
  { value: 'asia-tokyo', label: 'Tokyo, Japan Standard Time' },
];
