export type Speaker = 'person' | 'assistant';

export type TranscriptLine = {
  id: string;
  speaker: Speaker;
  text: string;
};

export const CALL_TITLE = 'Tallis launch plan';

export const TRANSCRIPT: TranscriptLine[] = [
  {
    id: 'l1',
    speaker: 'person',
    text: 'Let us plan the Tallis launch. The pricing page goes live on the 14th.',
  },
  {
    id: 'l2',
    speaker: 'assistant',
    text: 'Noted. Who writes the announcement?',
  },
  {
    id: 'l3',
    speaker: 'person',
    text: 'Maren drafts it by Friday. And book the launch review with the team.',
  },
  {
    id: 'l4',
    speaker: 'assistant',
    text: 'Booked for Tuesday at 10. Should I send the agenda to everyone?',
  },
  {
    id: 'l5',
    speaker: 'person',
    text: 'Yes, send it. Legal still has to check the new terms.',
  },
  {
    id: 'l6',
    speaker: 'assistant',
    text: 'Agenda sent. I added the legal review as a to-do for Jonas.',
  },
];

export type Note = {
  id: string;
  text: string;
};

export const NOTES: Note[] = [
  { id: 'n1', text: 'The pricing page goes live on 14 May' },
  { id: 'n2', text: 'Launch review on Tuesday 13 May at 10:00' },
  { id: 'n3', text: 'Legal has to check the new terms before launch' },
];

export type Owner = {
  name: string;
  isAssistant: boolean;
};

const MAREN: Owner = { name: 'Maren Holt', isAssistant: false };

const JONAS: Owner = { name: 'Jonas Weber', isAssistant: false };

export const ASSISTANT: Owner = { name: 'Assistant', isAssistant: true };

export type Todo = {
  id: string;
  text: string;
  owner: Owner;
  due: string;
};

export const TODOS: Todo[] = [
  { id: 't1', text: 'Draft the announcement', owner: MAREN, due: 'Fri 9 May' },
  {
    id: 't2',
    text: 'Book the launch review',
    owner: ASSISTANT,
    due: 'Today',
  },
  {
    id: 't3',
    text: 'Send the agenda to the team',
    owner: ASSISTANT,
    due: 'Today',
  },
  {
    id: 't4',
    text: 'Ask legal to review the terms',
    owner: JONAS,
    due: 'Mon 12 May',
  },
];

export function summaryTextOf(notes: Note[], todos: Todo[]) {
  const noteLines = notes.map((note) => `- ${note.text}`);
  const todoLines = todos.map(
    (todo) => `- ${todo.text} (${todo.owner.name}, ${todo.due})`
  );
  const lines = [
    CALL_TITLE,
    '',
    'Notes',
    ...noteLines,
    '',
    'To-dos',
    ...todoLines,
  ];
  return lines.join('\n');
}
