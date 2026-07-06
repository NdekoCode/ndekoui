import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'prompt-01',
    source: 'ndeko',
    title: 'Prompt with a status tray',
    description:
      'A composer on a quiet tray whose one key dictates, sends or stops, while a status line slides out from under the card and rolls through the work.',
  },
  {
    name: 'prompt-02',
    source: 'ndeko',
    title: 'Composer with modes',
    description:
      'A composer with attachments that upload behind a ring, menus for permission, model, apps and folder, dictation in a live recording strip, and Send that turns into Stop.',
  },
  {
    name: 'prompt-03',
    source: 'ndeko',
    title: 'Model picker',
    description:
      'Models grouped by lab with context, speed, price and skills, searched and picked from the keyboard, with a compare view that widens the panel.',
  },
  {
    name: 'prompt-04',
    source: 'ndeko',
    title: 'Model and effort',
    description:
      'An effort slider with four stops you drag and flick, with every model’s time and cost rolling under your finger, also folded into a chip for a composer.',
  },
  {
    name: 'prompt-05',
    source: 'ndeko',
    title: 'Ghost text',
    description:
      'A faint completion after the caret in a textarea or a line of code: Tab takes it, Ctrl or Cmd with Right takes one word and Escape dismisses it.',
  },
  {
    name: 'prompt-06',
    source: 'ndeko',
    title: 'Rewrite in place',
    description:
      'Select a phrase, say how it should read and watch it rewritten as a tracked change word by word, whose marks fade into the text when you accept it.',
  },
  {
    name: 'prompt-07',
    source: 'ndeko',
    title: 'Prompt templates',
    description:
      'Saved prompts with blanks typed straight into the sentence, a filled count that rolls, a live preview with a token estimate, Copy and Use prompt.',
  },
  {
    name: 'prompt-08',
    source: 'ndeko',
    title: 'Ask filter',
    description:
      'Plain words become filter chips tied to their phrases by threads, an ambiguous week asks which one you mean, and the orders fold away as they stop matching.',
  },
  {
    name: 'prompt-09',
    source: 'ndeko',
    title: 'Queued prompts',
    description:
      'Prompts sent while an answer streams wait as cards you edit, drag or move, then fly into the thread one by one as each answer ends.',
  },
  {
    name: 'prompt-10',
    source: 'ndeko',
    title: 'Conversation list',
    description:
      'Chats grouped by day under the pinned ones, with a highlight that travels, rename in place, delete asked in the row, and arrows, F2 and Delete.',
  },
  {
    name: 'prompt-11',
    source: 'ndeko',
    title: 'Prompt deck',
    description:
      'Suggested prompts as a stack of cards: the front one is dragged or sent away with Left and Right and the next lifts into place, and pressing a card types its prompt into the composer.',
  },
  {
    name: 'prompt-12',
    source: 'ndeko',
    title: 'Mention picker',
    description:
      'Typing @ opens files, symbols, diffs, docs and pages that filter with marks and move with the arrows and Tab, and the picked item flies into the composer as a chip while the token total rolls.',
  },
  {
    name: 'prompt-13',
    source: 'ndeko',
    title: 'Slash commands',
    description:
      'Typing / lists the commands an agent knows with their arguments, and the chosen command settles into a token followed by its argument, selected so that typing replaces it.',
  },
];
