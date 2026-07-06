export type Tone = 'info' | 'warning' | 'tip';

export type PageLink = {
  pageId: PageId;
  label: string;
};

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; code: string }
  | { kind: 'callout'; tone: Tone; text: string }
  | { kind: 'install' }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'links'; links: PageLink[] };

export type PageId = 'installation' | 'approvals' | 'events';

export type Section = {
  id: string;
  title: string;
  blocks: Block[];
};

export type DocPage = {
  id: PageId;
  category: string;
  title: string;
  lead: string;
  sections: Section[];
};

/** An invented SDK: its names, keys and addresses are illustrative. */
export const PAGES: DocPage[] = [
  {
    id: 'installation',
    category: 'Get started',
    title: 'Installation',
    lead: 'Add Wickerline to a Node app in a few minutes. Let the command line write the setup, or follow the steps by hand.',
    sections: [
      {
        id: 'requirements',
        title: 'Requirements',
        blocks: [
          {
            kind: 'list',
            items: [
              'Node 20 or later',
              'A Wickerline project and its project key, under Settings, then Keys',
              'An agent that calls tools, written with any framework',
            ],
          },
        ],
      },
      {
        id: 'install',
        title: 'Install',
        blocks: [{ kind: 'install' }],
      },
      {
        id: 'key',
        title: 'Add your key',
        blocks: [
          {
            kind: 'text',
            text: 'Copy the project key from Settings, then Keys, and put it in your environment. The SDK reads it once, when your agent starts.',
          },
          { kind: 'code', code: 'WICKERLINE_KEY=wl_pk_live_4d1a' },
          {
            kind: 'callout',
            tone: 'warning',
            text: 'Only the project key belongs in your app. The admin key starts with wl_ak_ and stays on your server.',
          },
        ],
      },
      {
        id: 'check',
        title: 'Check that it works',
        blocks: [
          {
            kind: 'text',
            text: 'Wrap one run of your agent and start it. The run appears in your dashboard within a few seconds, with every step in order.',
          },
          {
            kind: 'code',
            code: "import { record } from '@wickerline/sdk';\n\nconst run = await record('weekly-digest', agent);\nconsole.log(run.url);",
          },
          {
            kind: 'callout',
            tone: 'tip',
            text: 'Start it twice. Each run keeps its own timeline, so you can compare two runs side by side.',
          },
        ],
      },
      {
        id: 'next',
        title: 'Next steps',
        blocks: [
          {
            kind: 'links',
            links: [
              { pageId: 'approvals', label: 'Hold a step for a person' },
              { pageId: 'events', label: 'Read the run events' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'approvals',
    category: 'Build',
    title: 'Hold a step for a person',
    lead: 'Some steps should wait for an answer: sending money, deleting data, writing to a customer. Mark them, and the run stops there until someone decides.',
    sections: [
      {
        id: 'mark',
        title: 'Mark a step',
        blocks: [
          {
            kind: 'text',
            text: 'Pass `approval: required` to a step. The step does not start until a person answers, and the rest of the run waits behind it.',
          },
          {
            kind: 'code',
            code: "await run.step('refund', { approval: 'required' }, async () => {\n  await payments.refund(order.id, order.total);\n});",
          },
          {
            kind: 'callout',
            tone: 'info',
            text: 'A step that waits costs nothing. The run is saved and picks up where it stopped.',
          },
        ],
      },
      {
        id: 'answer',
        title: 'Answer from your app',
        blocks: [
          {
            kind: 'text',
            text: 'Wickerline sends an `approval.requested` event to your webhook. Show it to a person, then send their answer back with one call.',
          },
          {
            kind: 'code',
            code: "await wickerline.approvals.answer(event.approvalId, {\n  decision: 'approved',\n  by: person.email,\n});",
          },
        ],
      },
      {
        id: 'timeout',
        title: 'Set a timeout',
        blocks: [
          {
            kind: 'text',
            text: 'A request nobody answers should not hold a run forever. Set how long it waits, and what happens when the time is up.',
          },
          {
            kind: 'list',
            items: [
              'deny: the step is skipped and the run goes on',
              'fail: the run stops with the reason `approval_timeout`',
              'extend: ask once more, then deny',
            ],
          },
          {
            kind: 'callout',
            tone: 'warning',
            text: 'Answers are final. A step that was denied does not run again unless you start the run again.',
          },
        ],
      },
      {
        id: 'who',
        title: 'Who can answer',
        blocks: [
          {
            kind: 'text',
            text: 'Any member with the Approver role. A request goes to the whole role, and the first answer wins.',
          },
        ],
      },
    ],
  },
  {
    id: 'events',
    category: 'Reference',
    title: 'Run events',
    lead: 'Every run sends a stream of events. This page lists the ones you can receive at a webhook or read from the API.',
    sections: [
      {
        id: 'shape',
        title: 'Shape of an event',
        blocks: [
          {
            kind: 'text',
            text: 'Each event has a type, the run it belongs to, a time and the fields of its type.',
          },
          {
            kind: 'code',
            code: '{\n  "type": "call.finished",\n  "runId": "run_8f2c",\n  "at": "2026-03-09T09:41:07Z",\n  "call": { "tool": "quickbooks", "status": "done" }\n}',
          },
        ],
      },
      {
        id: 'types',
        title: 'Event types',
        blocks: [
          {
            kind: 'table',
            head: ['Type', 'When it is sent'],
            rows: [
              ['run.started', 'A run begins'],
              ['step.updated', 'A step starts, finishes or fails'],
              ['call.started', 'An agent starts a tool call'],
              ['call.finished', 'A tool call returns or fails'],
              ['approval.requested', 'A step waits for a person'],
              ['approval.answered', 'A person approves or denies'],
              ['run.finished', 'A run ends, with its final status'],
            ],
          },
        ],
      },
      {
        id: 'delivery',
        title: 'Delivery and retries',
        blocks: [
          {
            kind: 'text',
            text: 'Events are delivered at least once. Your endpoint answers with a 2xx status within ten seconds, or Wickerline tries again after 1, 5 and 30 minutes.',
          },
          {
            kind: 'callout',
            tone: 'info',
            text: 'Keep the id of each event you handled, so a second delivery of the same event changes nothing.',
          },
        ],
      },
      {
        id: 'verify',
        title: 'Verify the signature',
        blocks: [
          {
            kind: 'text',
            text: 'Every delivery carries a signature header. Check it before you trust the body.',
          },
          {
            kind: 'code',
            code: "const isValid = verify(body, request.headers['wickerline-signature']);",
          },
        ],
      },
    ],
  },
];

export const PAGE_ORDER: PageId[] = PAGES.map((page) => page.id);

export function pageOf(pageId: PageId) {
  const page = PAGES.find((candidate) => candidate.id === pageId);
  return page ?? PAGES[0];
}
