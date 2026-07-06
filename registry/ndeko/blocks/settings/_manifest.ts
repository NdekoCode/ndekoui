import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'settings-01',
    title: 'Profile form',
    description:
      'A profile in three sections with a travelling highlight, a photo picked in the browser, errors that fold in and out, and an unsaved-changes bar whose Save becomes Saving then Saved.',
    files: [
      'index.tsx',
      'profile-fields.tsx',
      'settings-kit.tsx',
      'validation.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'settings-02',
    title: 'Notifications by channel',
    description:
      'Email, push and desktop as sections, each led by its channel switch that folds its events away, with a digest choice, quiet hours and the same unsaved-changes bar.',
    files: ['index.tsx', 'channel-sections.tsx', 'settings-kit.tsx', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'settings-03',
    title: 'Workspace settings',
    description:
      'Name and address, the default role for new members read against who holds each role, and a danger zone where archiving takes a two-second hold and deleting takes the typed name.',
    files: [
      'index.tsx',
      'danger-zone.tsx',
      'role-choice.tsx',
      'settings-kit.tsx',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'settings-04',
    title: 'API keys',
    description:
      'Live and test keys whose spend this month rolls as calls come in, with idle keys flagged; Create key unfolds a form in place and shows the secret once with Copy, a row opens to its scopes, its creator and two weeks of requests, and Revoke fills across a two-second hold before the row folds away.',
    files: [
      'index.tsx',
      'create-key.tsx',
      'key-rows.tsx',
      'hold-button.tsx',
      'settings-frame.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 860,
  },
  {
    name: 'settings-05',
    title: 'Security',
    description:
      'Sign-in accounts that connect and disconnect, with a confirm in place before the last way in goes; signed-in devices with this one marked, where a device signed out folds away and the others go after one confirm; and a two-step switch that grows its setup panel while the six digits of the first code fill in.',
    files: [
      'index.tsx',
      'sign-in-ways.tsx',
      'devices.tsx',
      'two-step.tsx',
      'settings-frame.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 1040,
  },
  {
    name: 'settings-06',
    title: 'License keys',
    description:
      'A card per product whose key shows again group by group, Copy that turns into a check, seats in use on a meter, and Regenerate behind an in-place warning that the old key stops, after which the key rolls to its new groups while the seats empty and fill again as machines come back.',
    files: [
      'index.tsx',
      'license-card.tsx',
      'settings-frame.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'settings-07',
    title: 'Billing',
    description:
      'The plan with its status, renewal and a chooser whose highlight travels, meters that turn amber near their limit as runs come in, invoices that download, a drawn card that Update card replaces, and Cancel subscription that confirms in place and turns the plan into Cancels on 30 Nov with Resume beside it.',
    files: [
      'index.tsx',
      'plan-card.tsx',
      'usage-meters.tsx',
      'invoices.tsx',
      'payment-method.tsx',
      'settings-frame.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 1000,
  },
];
