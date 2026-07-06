export type Person = {
  name: string;
};

export type ReplyStatus = 'thinking' | 'streaming' | 'done' | 'stopped';

export type UserTurn = {
  id: string;
  role: 'user';
  text: string;
};

export type AssistantTurn = {
  id: string;
  role: 'assistant';
  text: string;
  status: ReplyStatus;
};

export type ChatTurn = UserTurn | AssistantTurn;

export type Feedback = 'helpful' | 'not-helpful';

export const reader: Person = {
  name: 'Amara Diallo',
};

export const page = {
  title: 'Onboarding guide',
  space: 'People team',
};

export const seedTurns: ChatTurn[] = [
  {
    id: 'turn-1',
    role: 'user',
    text: 'The intro of the onboarding guide runs long. Can you tighten it without losing the part about buddies?',
  },
  {
    id: 'turn-2',
    role: 'assistant',
    status: 'done',
    text: 'Here is a tighter intro, down from 182 words to 74:\n\nWelcome to Fernhill. Your first two weeks are about meeting people, not shipping. Each new teammate gets a buddy who has been here at least a year. They book your first coffee and answer the questions you would rather not ask in a channel.\n\nI moved the paragraph on laptops and accounts to the Setup section, where people already look for it.',
  },
];

export const replies = [
  'A title that says what the page is for: "Your first two weeks at Fernhill". It matches how the other guides in People team are named, and it reads well in search.\n\nI can also write a one-line summary under it, so the link preview in chat says something useful.',
  'Done. The buddy paragraph is now second, since it is what most new people ask about, and the history of the office is a single sentence that links to the About page.\n\nThe intro fits on one phone screen now. The rest of the guide is unchanged.',
  'Three sections repeat the same advice about the calendar: Day one, Meetings and Tools. I would keep it in Meetings and link to it from the other two.\n\nWant me to make that change and leave a comment for Jonas, who owns the Tools section?',
];

export const thinkingMs = 700;

export const wordDelayMs = 45;
