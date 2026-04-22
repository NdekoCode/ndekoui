export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar?: string;
};

export type ReplyStatus = 'thinking' | 'streaming' | 'done' | 'stopped';

export type AttachmentKind = 'document' | 'image';

export type Attachment = {
  id: string;
  name: string;
  size: number;
  kind: AttachmentKind;
};

export type UserTurn = {
  id: string;
  role: 'user';
  text: string;
  attachments: Attachment[];
};

export type AssistantTurn = {
  id: string;
  role: 'assistant';
  text: string;
  status: ReplyStatus;
};

export type ReasoningTurn = {
  id: string;
  role: 'reasoning';
};

export type ChatTurn = UserTurn | AssistantTurn | ReasoningTurn;

export type Feedback = 'helpful' | 'not-helpful';

export type ModelValue = 'swift' | 'deep';

export type Model = {
  value: ModelValue;
  label: string;
  hint: string;
};

export type PageContext = {
  title: string;
  space: string;
};

export type Conversation = {
  id: string;
  title: string;
  page?: PageContext;
  turns: ChatTurn[];
  replies: string[];
  isDraft: boolean;
};

export type RunStep = 0 | 1 | 2 | 3 | 4 | 5;

export type ScheduledStep = {
  step: RunStep;
  atMs: number;
};

export type ToolCall = {
  id: string;
  type: string;
  toolCallId: string;
  appearsAt: RunStep;
  doneAt: RunStep;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type CitedSource = {
  href: string;
  title: string;
  description: string;
};

export const PRODUCT_NAME = 'Quillstone';

export const reader: Person = {
  id: 'amara',
  name: 'Amara Diallo',
  initials: 'AD',
  role: 'People team',
  avatar: '/avatars/avatar-05.svg',
};

export const models: Model[] = [
  { value: 'swift', label: 'Quill Swift', hint: 'Quick drafts and rewrites' },
  { value: 'deep', label: 'Quill Deep', hint: 'Careful edits on long pages' },
];

export const suggestions = [
  'Summarise this page in five lines',
  'Rewrite the intro for new hires',
  'Turn my meeting notes into a checklist',
];

export const maxFiles = 4;

export const maxBytes = 10 * 1024 * 1024;

export const thinkingMs = 700;

export const wordDelayMs = 45;

export const NEW_CHAT_TITLE = 'New chat';

export const TITLE_WORD_LIMIT = 6;

export const newChatReplies = [
  'Here is a first draft. I kept your headings, put the open questions at the end and marked the two places where the notes disagree.\n\nTell me which part to expand and I will rework only that one.',
  'Done. It is shorter now and every sentence starts with what the reader does. The earlier version stays in the page history if you want to compare.',
];

export const question =
  'Check the API reference against the changelog and tell me what changed in 2.4';

export const seedConversations: Conversation[] = [
  {
    id: 'onboarding',
    title: 'Tighten the onboarding intro',
    page: { title: 'Onboarding guide', space: 'People team' },
    isDraft: false,
    turns: [
      {
        id: 'turn-1',
        role: 'user',
        text: 'The intro of the onboarding guide runs long. Can you tighten it without losing the part about buddies?',
        attachments: [],
      },
      {
        id: 'turn-2',
        role: 'assistant',
        status: 'done',
        text: 'Here is a tighter intro, down from 182 words to 74:\n\nWelcome to Fernhill. Your first two weeks are about meeting people, not shipping. Each new teammate gets a buddy who has been here at least a year. They book your first coffee and answer the questions you would rather not ask in a channel.\n\nI moved the paragraph on laptops and accounts to the Setup section, where people already look for it.',
      },
    ],
    replies: [
      'A title that says what the page is for: "Your first two weeks at Fernhill". It matches how the other guides in People team are named, and it reads well in search.\n\nI can also write a one-line summary under it, so the link preview in chat says something useful.',
      'Done. The buddy paragraph is now second, since it is what most new people ask about, and the history of the office is a single sentence that links to the About page.\n\nThe intro fits on one phone screen now. The rest of the guide is unchanged.',
      'Three sections repeat the same advice about the calendar: Day one, Meetings and Tools. I would keep it in Meetings and link to it from the other two.\n\nWant me to make that change and leave a comment for Jonas, who owns the Tools section?',
    ],
  },
  {
    id: 'api-changes',
    title: 'What changed in 2.4',
    page: { title: 'API reference', space: 'Engineering' },
    isDraft: false,
    turns: [
      { id: 'api-1', role: 'user', text: question, attachments: [] },
      { id: 'api-2', role: 'reasoning' },
    ],
    replies: [
      'I drafted the four edits as suggestions on the API reference: the cursor parameter on /documents, the new limit for workspace tokens, the DELETE endpoint for comments and the removal of archived=true on /spaces.\n\nWhoever owns the page can accept them one by one.',
      'The 2.4 entry of the changelog says nothing about webhooks, and the reference lists no change there either, so that part is up to date.\n\nI can run the same check on 2.3 if you want the whole year.',
    ],
  },
];

export const finishedStep: RunStep = 5;

export const runSchedule: ScheduledStep[] = [
  { step: 1, atMs: 500 },
  { step: 2, atMs: 1700 },
  { step: 3, atMs: 2000 },
  { step: 4, atMs: 3400 },
  { step: 5, atMs: 4000 },
];

export const reasoning =
  'The API reference was last edited on 12 March, before 2.4 shipped, so it is probably behind. I will find the 2.4 entry in the changelog first, then read the parts of the API reference it touches: pagination, rate limits and the comment endpoints.';

export const thoughtLabel = 'Thought for 4 seconds';

export const answer = [
  'Three changes from 2.4 are missing from the API reference:',
  '',
  '1. **Pagination** on `/documents` moved from `page` to `cursor`.',
  '2. Workspace tokens now get 120 requests a minute instead of 60.',
  '3. `DELETE /comments/{id}` is new and not listed yet.',
  '',
  'The reference also still documents `archived=true` on `/spaces`, which 2.4 removed. I can draft the edits as suggestions on the page.',
].join('\n');

export const reasoningWordMs = 55;

export const toolCalls: ToolCall[] = [
  {
    id: 'search',
    type: 'search_pages',
    toolCallId: 'call_7hq2',
    appearsAt: 1,
    doneAt: 2,
    input: { query: 'changelog 2.4', space: 'Engineering' },
    output: {
      matches: 3,
      best: 'Changelog / 2.4',
      updated: '2026-10-21',
    },
  },
  {
    id: 'read',
    type: 'read_page',
    toolCallId: 'call_9kd4',
    appearsAt: 3,
    doneAt: 4,
    input: { page: 'API reference', sections: ['Pagination', 'Rate limits'] },
    output: {
      words: 1240,
      lastEdited: '2026-03-12',
      endpoints: ['/documents', '/spaces', '/comments'],
    },
  },
];

export const sources: CitedSource[] = [
  {
    href: 'https://docs.quillstone.example/engineering/changelog#2-4',
    title: 'Changelog, 2.4',
    description:
      'Cursor pagination, higher limits for workspace tokens and comment deletion.',
  },
  {
    href: 'https://docs.quillstone.example/engineering/api-reference',
    title: 'API reference',
    description:
      'Endpoints, parameters and errors of the public API, last edited in March.',
  },
  {
    href: 'https://docs.quillstone.example/engineering/rate-limits',
    title: 'Rate limits',
    description:
      'How requests are counted per token and what happens past the limit.',
  },
];
