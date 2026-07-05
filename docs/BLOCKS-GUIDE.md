# Blocks guide

The brief for building blocks: whole sections of a product (an app shell, a member list, a board, a settings page, a hero, a pricing section) made from ndekoui primitives with fictional data. Read `docs/DESIGN-SYSTEM.md` and `docs/PORTING-GUIDE.md` first: their rules on tokens, lines, motion, icons, honesty and code style apply here unchanged.

## Where the design comes from

- **Application blocks** are rebuilt from the maintainer's Ever Teams design language, described in prose in `/Users/ndekocode/Documents/Labs/ever-co/ever-projects/ever-teams/apps/web/docs/DESIGN-SYSTEM.md` (sections 16 to 26: shell, Linear finish, notifications, dashboards and reports, focused pages, settings, team tasks, task details, fills and borders, profile). Read that text for the decisions. Never open, read or copy Ever Teams source files: that code is AGPL and belongs to Ever Co. Nothing named Ever, Gauzy or Ever Teams appears in a block.
- **Marketing blocks** follow section 12 of our design system: no guide lines, no bordered grid cells, no fake testimonials, no invented figures, space and surfaces as the only separators.

## Output

```text
registry/ndeko/blocks/<group>/_manifest.ts
registry/ndeko/blocks/<group>/<block-name>/index.tsx   default export, the whole block
registry/ndeko/blocks/<group>/<block-name>/<part>.tsx  parts, imported with relative paths
registry/ndeko/blocks/<group>/<block-name>/data.ts     the fictional data
```

```ts
import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'app-shell-01',
    title: 'Sidebar and inset panel',
    description:
      'A workspace sidebar on the window colour and every page in one rounded panel beside it.',
    files: ['index.tsx', 'app-sidebar.tsx', 'data.ts'],
    previewHeight: 720,
  },
];
```

- Block names are `<group>-NN`, unique across the registry. `files` lists every file of the folder, the entry first.
- Parts import each other with relative paths (`./app-sidebar`), so the block still works once installed in `components/blocks/<name>/`.
- Imports otherwise come only from `@/registry/ndeko/ui/*`, `@/registry/ndeko/lib/*`, `@/registry/ndeko/hooks/*`, `@base-ui/react/*`, `react`, `motion/react` and the packages already installed (`@dnd-kit/*`, `@tanstack/react-table`, `date-fns`, `sonner`, `cmdk`, `react-day-picker`).
- A block fills the width it is given and works from 375px to a wide desktop: the catalogue shows it in a frame that switches between desktop, tablet and phone. Phone layouts are designed, not squeezed.
- Charts are hand-written SVG on the tokens (no chart library): round hour lines, rounded bars in the brand fill, tabular figures, a hidden table for screen readers.

## Data and states

- Fictional people and companies, plausible numbers, every count with a singular branch. A figure that could pass for a real statistic is labelled "Illustrative".
- Avatars: `/avatars/avatar-03.svg` to `/avatars/avatar-07.svg` in the `Avatar` primitive, initials as fallback.
- A block that shows a list also shows what the list looks like empty when the user can reach that state (a filter that matches nothing, a search without results), with the way back.
- Interactions work locally with React state: picking a value applies it, a menu action changes the row, drag and drop moves the card. Nothing calls a network.

## Motion

Micro-interactions are the identity of the library and blocks are where they show the most. Use the signature table of section 7 of the design system: a card dragged across lanes keeps its velocity, a dialog or panel resizes to its new step with `AnimatedSize`, a selection indicator travels, a saved state morphs the button, rows enter and leave with height and opacity. Chat blocks follow prompt-kit's mechanisms (streaming text, a prompt that grows, reasoning that folds), redrawn on our primitives. A card dragged across lanes, a row added or removed, a panel resizing between two contents, a thumb sliding between views. Nothing animates on load or on scroll. `usePrefersReducedMotion()` (`hooks/use-prefers-reduced-motion`) everywhere JavaScript drives motion.

## Verification and limits

Same as the porting guide: `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/eslint --max-warnings=0 <your paths>`, `./node_modules/.bin/prettier --write <your paths>`. Touch only your group folders. Do not edit `icons.tsx` or the primitives: if an icon or a primitive is missing, use the closest one and list it in the report.

## Report

Blocks written per group, what each one shows, deliberate choices, missing icons or primitives, and the honest line: nothing was checked in a browser.
