import {
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GitMergeIcon,
  type Icon,
  MailIcon,
  MessageCircleIcon,
  ServerIcon,
  WalletIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';

export type CategoryId = 'messaging' | 'files' | 'finance' | 'developer';

export type ViewId = 'all' | 'connected' | CategoryId;

export type Integration = {
  id: string;
  name: string;
  category: CategoryId;
  icon: Icon;
  description: string;
  /** The first attempt asks for an owner's approval, so the block can show its error state. */
  needsApproval?: boolean;
};

export const PAGE = {
  title: 'Integrations',
  description:
    'Connect the tools Fernhollow Studio already uses. Each one only reads what its card says.',
};

export const CATEGORIES: Record<CategoryId, { label: string; hue: string }> = {
  messaging: { label: 'Messaging', hue: 'hsl(199 84% 46%)' },
  files: { label: 'Files', hue: 'hsl(239 70% 62%)' },
  finance: { label: 'Finance', hue: 'hsl(152 56% 38%)' },
  developer: { label: 'Developer', hue: 'hsl(215 18% 44%)' },
};

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'connected', label: 'Connected' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'files', label: 'Files' },
  { id: 'finance', label: 'Finance' },
  { id: 'developer', label: 'Developer' },
];

export const APPROVER = 'Rosa Ilunga';

export const INTEGRATIONS: Integration[] = [
  {
    id: 'chatterpine',
    name: 'Chatterpine',
    category: 'messaging',
    icon: MessageCircleIcon,
    description:
      'Posts task updates to a channel and lets people reply from the thread.',
  },
  {
    id: 'letterkiln',
    name: 'Letterkiln',
    category: 'messaging',
    icon: MailIcon,
    description:
      'Turns emails sent to a project address into tasks with their attachments.',
  },
  {
    id: 'folderwell',
    name: 'Folderwell',
    category: 'files',
    icon: FolderIcon,
    description: 'Attaches files from shared folders without copying them.',
  },
  {
    id: 'pagebarrow',
    name: 'Pagebarrow',
    category: 'files',
    icon: FileTextIcon,
    description: 'Links documents to tasks and keeps their titles in sync.',
  },
  {
    id: 'coinharbor',
    name: 'Coinharbor',
    category: 'finance',
    icon: WalletIcon,
    description:
      'Sends approved hours to draft invoices, one line per project.',
    needsApproval: true,
  },
  {
    id: 'tallyfern',
    name: 'Tallyfern',
    category: 'finance',
    icon: CreditCardIcon,
    description: 'Matches card payments with the expenses people log.',
  },
  {
    id: 'mergemoth',
    name: 'Mergemoth',
    category: 'developer',
    icon: GitMergeIcon,
    description:
      'Closes a task when the pull request that mentions it is merged.',
  },
  {
    id: 'buildlark',
    name: 'Buildlark',
    category: 'developer',
    icon: ServerIcon,
    description: 'Shows the latest build result on every linked task.',
  },
  {
    id: 'signalreed',
    name: 'Signalreed',
    category: 'developer',
    icon: ZapIcon,
    description:
      'Sends task events to an address you choose, signed with your key.',
  },
];

export const INITIALLY_CONNECTED = ['chatterpine', 'mergemoth'];
