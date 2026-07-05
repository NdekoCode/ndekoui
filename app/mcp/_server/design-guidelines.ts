import { loadDesignSystem } from './registry-store';
import { slugOf } from './slug';

export type DesignSection = {
  number: string;
  title: string;
  slug: string;
  markdown: string;
};

const SECTION_HEADING = /^## /m;

const NUMBERED_TITLE = /^(\d+)\.\s+(.*)$/;

/** The short version an agent reads before writing UI. Each rule points to the section that explains it. */
const KEY_RULES = `# Writing UI with ndekoui

Install pieces with the shadcn CLI and compose them; do not restyle them. Every piece depends on the \`theme\` item, which ships the tokens and utilities named below.

## Surfaces and lines (sections 3 and 4)
- A surface is drawn with a hairline ring and a soft shadow, never a full opaque border: a card is \`bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]\`. A real border is only a separator.
- Hairlines come from the \`hairline-*\` utilities (\`hairline-ring\`, \`hairline-b\`, \`hairline-divide-y\`...). Solid for the outline of an object, dashed only for an empty slot that invites an addition.
- No line between the header, body and footer of one card: type and spacing separate them. Row lines belong to tables of figures only.
- Materials, one meaning each: \`chip-3d\` with \`--chip\` for an assigned value or label, \`keycap-3d\` for a key or an icon tile in a row, \`gem-plate\` with \`--gem\` for a kind holding a white glyph, \`surface-raised\` for floating layers, \`surface-brand\` for the one lifted object of a block. Control states (pressed, selected, checked) stay flat.

## Radius (section 2)
- \`rounded-sm\` chips, \`rounded-md\` menu rows, ghost buttons and fields, \`rounded-lg\` tooltips and tiles, \`rounded-xl\` cards, popovers and menus, \`rounded-2xl\` dialogs and sheets. No \`rounded-3xl\`.
- Buttons are pills (\`rounded-full\`), except ghost and link buttons.
- A surface nested in another keeps concentric corners: inner radius = outer radius minus the gap.

## Colour (sections 1 and 13)
- Semantic tokens only: \`bg-primary\` for the one primary action, \`text-primary-ink\` for brand text and links, \`text-muted-foreground\` for hints. No raw palette class, no hex.
- Status as soft pairs: \`bg-success/10 text-success-foreground\`. Never a saturated fill with white text for a status.
- State greys from foreground alpha (\`bg-foreground/5\`, \`/[0.03]\`), so one hover works on the page and on a card.
- No hue-to-hue gradient, glow, coloured shadow, orb, blurred blob, dot grid or neon. The page is \`bg-background\`, never pure white.

## Type and controls (sections 5 and 6)
- Inherit the app font. Weight stops at \`font-semibold\`; no \`tracking-*\`; \`text-balance\` on headings; \`tabular-nums\` on aligned numbers.
- \`text-[13px]\` for chrome, menu rows, buttons and body inside components; card title \`text-sm font-medium\`; page title \`text-2xl font-semibold sm:text-3xl\`; hints \`text-xs text-muted-foreground\`.
- Buttons: \`default\` h-8, \`sm\` h-7, \`lg\` h-9, at most two sizes on one surface. A link that looks like a button is \`<Button render={<a href="..." />} nativeButton={false}>\`.

## Composing the primitives (Base UI)
- No \`asChild\`: compose with \`render\`, for example \`<TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Copy" />}>\`.
- Menu items take \`onClick\`. \`ToggleGroup\`, \`Accordion\` and multiple \`Select\` take arrays (\`defaultValue={['a']}\`). \`Select\` takes \`items\` so \`SelectValue\` shows the label.
- Icons come from the installed icons module, never from an icon package directly. Icon-only buttons carry an \`aria-label\`.

## Motion (section 7)
- Every change of state has its micro-interaction: press (\`active:scale-[0.97]\`, 160ms), swap of an icon or label (opacity, scale 0.6, blur 2px, 150ms), resize through \`AnimatedSize\`, an indicator that travels to the new choice, presence (height and opacity, 200ms in, faster out).
- \`--ease-out-strong\` for entering and responding, exits faster than entrances, never \`ease-in\`. Nothing appears from \`scale(0)\`: popups start at 95%, tooltips at 97%.
- Animate transform and opacity only. Read the reduced motion setting with \`usePrefersReducedMotion()\` (the \`use-prefers-reduced-motion\` hook of the registry) and keep only the fade.
- No motion on actions repeated from the keyboard, on hover of something that cannot be clicked, or on page load inside an application. Ambient motion (marquee, float) stays on marketing pages.

## Content and copy (sections 9, 10 and 13)
- Fictional data that looks fictional; every count has a singular branch; lists have an empty state, async views a loading and an error state.
- No em dashes, no exclamation marks, no emoji, no full stop on labels. A button label carries the action ("Create project", never "OK").
- No sparkle icons, no three feature cards by reflex, no bento grid, no fake testimonials or logos, no uppercase tracked labels.
`;

function sectionOf(chunk: string): DesignSection {
  const newlineIndex = chunk.indexOf('\n');
  const heading = chunk.slice(0, newlineIndex).trim();
  const numbered = NUMBERED_TITLE.exec(heading);
  let number = '';
  let title = heading;
  if (numbered) {
    number = numbered[1];
    title = numbered[2];
  }
  return {
    number,
    title,
    slug: slugOf(title),
    markdown: `## ${chunk.trimEnd()}`,
  };
}

export async function designSections() {
  const markdown = await loadDesignSystem();
  const chunks = markdown.split(SECTION_HEADING);
  const sectionChunks = chunks.slice(1);
  return sectionChunks.map(sectionOf);
}

export async function designDocument() {
  return loadDesignSystem();
}

export function keyRules() {
  return KEY_RULES;
}

/** Finds a section by its number ("7"), its title ("Motion") or the start of its title. */
export function findSection(sections: DesignSection[], query: string) {
  const wanted = slugOf(query);
  const byNumber = sections.find((section) => section.number === wanted);
  if (byNumber) {
    return byNumber;
  }
  const bySlug = sections.find((section) => section.slug === wanted);
  if (bySlug) {
    return bySlug;
  }
  return sections.find((section) => section.slug.startsWith(wanted));
}
