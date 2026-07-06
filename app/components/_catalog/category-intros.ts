const GENERIC_INTRO =
  'Every variant is built on ndekoui primitives and its design language. Open the code of any of them to copy it or the command that installs it.';

const CATEGORY_INTROS: Record<string, string> = {
  prompt:
    'Where people ask: composers that grow, a model and how hard it thinks, completions you take with Tab, rewrites shown as tracked changes, templates with their blanks and filters written in plain words.',
  answer:
    'Where the model answers: citations that light their sentence and source, thinking that folds once the answer starts, versions to switch between, models compared blind, and the artifact beside the chat.',
  agent:
    'Agents at work: the plan they follow and the person who approves it, lanes and graphs of who does what right now, hand-offs, trees of sub-agents, fleets, memory and the sources they search.',
  run: 'One run in detail: each tool call with its live timer and result, waterfalls of where the time went, the terminal it types in, how full the context is and what it all costs.',
  review:
    'What an agent asks a person to decide: approvals, permissions with their scope, how much it may do alone, diffs reviewed hunk by hunk, branches, extracted fields and the screen it drives.',
  voice:
    'Voice agents: an orb that listens, thinks and speaks, a voice note whose transcript follows the voice, and dictation into any field.',
  card: 'Cards that show what they hold: stacks and decks that turn, a ticket that adds up, figures that roll, a folder that fans out and a globe that draws its routes. Each one plays itself while it is on screen.',
  chart:
    'Charts that read themselves: a sentence that says what the chart shows, a hover that answers, a table behind every chart for screen readers, and data changes drawn as motion rather than a redraw.',
  illustration:
    'Living scenes for heroes, features and empty states. They play only while on screen and hold a still frame that still reads under reduced motion.',
  background:
    'Quiet fields to set behind a hero or a band, in one hue. They draw only while visible and stand still under reduced motion.',
  'text-effect':
    'Text that types, slices, lights up or forms out of characters, for marketing pages. The words stay readable to screen readers whatever the effect does.',
  effect:
    'Cards that fan out or lean with the pointer, cursors with a name, a light that runs once around a pill.',
  loading:
    'Skeletons that share one light and hand over to the content without moving the layout.',
};

export function categoryIntroOf(slug: string) {
  return CATEGORY_INTROS[slug] ?? GENERIC_INTRO;
}
