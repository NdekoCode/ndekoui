export type OptionalCategoryId = 'preferences' | 'analytics' | 'marketing';

export type CategoryId = 'necessary' | OptionalCategoryId;

/** What the visitor allowed. Necessary cookies cannot be refused, so they are always true. */
export type CookieConsent = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type Category = {
  id: CategoryId;
  name: string;
  line: string;
};

export const SITE_NAME = 'Brightloom';

export const STORAGE_KEY = 'brightloom-cookie-consent';

export const NECESSARY: Category = {
  id: 'necessary',
  name: 'Necessary',
  line: 'Keep you signed in, protect the forms and remember this choice. The site does not work without them, so they stay on.',
};

export const OPTIONAL_CATEGORIES: (Category & { id: OptionalCategoryId })[] = [
  {
    id: 'preferences',
    name: 'Preferences',
    line: 'Remember your language, your text size and the guides you saved',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    line: 'Count visits and the pages people leave from, without your name',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    line: 'Let partners show you ads based on what you read here',
  },
];

export const ARTICLE = {
  section: 'Guides',
  title: 'Plan the week on one board',
  meta: 'Nov 10, 2026 · 4 min read',
  paragraphs: [
    'A week that starts on a Monday morning meeting tends to end on a Friday list of what slipped. A board that the whole team can see turns that list into something you watch move, one card at a time.',
    'Start with three lanes and nothing else: what is waiting, what someone holds right now, and what is done. Each card carries one owner and one sentence that says what done means. When a lane holds more cards than the people working it, that is the conversation to have before anything new comes in.',
    'Keep the board where the work happens. A link pinned in the team channel gets opened; a board in a folder gets forgotten by Wednesday.',
    'On Friday, read the done lane out loud. It takes two minutes and it is the only status update most teams need.',
  ],
};
