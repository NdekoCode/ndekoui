# Porting guide: Origin UI compositions into ndekoui

This guide is the brief for anyone, person or agent, who ports a category of the Origin UI catalogue. Read it completely before writing a file. Progress lives in `docs/PORT-PROGRESS.md`.

## Sources

- Origin UI, MIT snapshot of 2025-08-07, read only: `/Users/ndekocode/Documents/Labs/Business/origin-ui` (outside this repository on the maintainer's machine). Compositions: `registry/default/components/comp-NN.tsx`; the order of each category is in `config/components.ts`. Its primitives (`registry/default/ui/*`) and hooks are references only.
- Never read or copy anything from the coss repository or coss.com: that code is AGPL. Ignore any coss skill.

## Read first

1. `docs/DESIGN-SYSTEM.md`: tokens, hairlines, materials, motion (section 7), honesty, writing.
2. The primitives in `registry/ndeko/ui/`. They are built on Base UI, not Radix:
   - `asChild` does not exist. Compose with `render`: `<TooltipTrigger render={<Button variant='outline' size='icon' aria-label='Copy' />}><CopyIcon /></TooltipTrigger>`.
   - A link styled as a button: `<Button render={<a href='#' />} nativeButton={false}>Docs</Button>`.
   - Menu items take `onClick`, not `onSelect`.
   - `ToggleGroup`, `Accordion` and `Select` with several values take arrays (`defaultValue={['a']}`, `multiple`); no `type='single'`.
   - `Slider` takes a number for one thumb and an array for a range.
   - `Select` takes `items` so `SelectValue` can show the label.
   - `HoverCardTrigger` renders a link.
   - When a primitive cannot express a structure, import the Base UI part directly (`@base-ui/react/accordion`) and style it with the recipes of `registry/ndeko/lib/recipes.ts`.
3. `registry/ndeko/lib/icons.tsx`: the only icon import point. It already holds every icon the Origin catalogue uses, under Lucide names (`CheckIcon`, `XIcon` for the cross, `Trash2Icon`, `LoaderCircleIcon`...). Remix icons map to ours (`RiGithubFill` to `GithubIcon`, `RiDeleteBinLine` to `TrashIcon`, `RiGoogleFill` to `GoogleBrandIcon`). `LucideIcon` as a type becomes our `Icon` type. Brand marks Hugeicons does not have (Next.js, Gatsby) are small SVG components written inside the composition file.
4. `registry/ndeko/components/types.ts` and an existing category, `registry/ndeko/components/button/`, as the reference for the result.

## Replacements for Origin primitives

| Origin                                                                                                                       | Ndeko                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `multiselect` (MultipleSelector)                                                                                             | `combobox.tsx` with `multiple`, `ComboboxChips`, `ComboboxChip`, `ComboboxChipRemove`                                                                                        |
| `emblor` tag input                                                                                                           | `combobox.tsx` with chips, or an input followed by removable `Chip`s; no emblor                                                                                              |
| `input-otp`                                                                                                                  | `otp-field.tsx` (Base UI OTP field): `OTPField length`, one `OTPFieldInput` per character                                                                                    |
| radix `toast`, `toaster`, `use-toast`                                                                                        | `toast()` from `sonner` with the `Toaster` of `sonner.tsx` (the catalogue page already mounts it); a custom toast uses `toast.custom` on `surface-raised` with a `StatusOrb` |
| `hover-card`                                                                                                                 | `hover-card.tsx`                                                                                                                                                             |
| `calendar`, `calendar-rac`, `datefield-rac`                                                                                  | same names, already ported                                                                                                                                                   |
| `command`, `stepper`, `timeline`, `tree`, `table`, `pagination`, `breadcrumb`, `navigation-menu`, `select-native`, `cropper` | same names, already ported                                                                                                                                                   |

Hooks already ported: `use-file-upload`, `use-pagination`. Allowed packages besides the base ones: `cmdk`, `sonner`, `react-day-picker`, `react-aria-components`, `react-aria`, `@internationalized/date`, `date-fns`, `@tanstack/react-table` (v8), `@dnd-kit/*`, `@headless-tree/core`, `@headless-tree/react`, `@origin-space/image-cropper`, `react-payment-inputs`, `react-phone-number-input`, `use-mask-input`.

## Output

- Files: `registry/ndeko/components/<category>/<category>-NN.tsx`, numbered in the order of `config/components.ts` (`accordion-01` is the first composition of the accordion category).
- Each file has a default export named after it (`export default function Accordion01()`), and `'use client';` only when it uses state, effects, refs or handlers.
- One manifest per category, `registry/ndeko/components/<category>/_manifest.ts`:

```ts
import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'accordion-01',
    source: 'comp-334',
    title: 'Basic accordion',
    description: 'Questions that open one at a time.',
  },
];
```

Titles are short nouns; descriptions are one plain sentence. English, no em dashes.

- A hook the category needs goes to `registry/ndeko/hooks/<name>.ts`, ported from Origin's with its behaviour kept, only when the progress table says your batch owns it.

## How to port

- Imports only from `@/registry/ndeko/ui/*`, `@/registry/ndeko/lib/*`, `@/registry/ndeko/hooks/*`, `@base-ui/react/*`, `react`, `motion/react` and the npm packages listed for the category in the progress table. No lucide, remixicon or radix.
- Remove what fights the design system: `shadow-xs`, radius overrides on buttons (they are pills), `border` on outline buttons, raw palette colours (`bg-blue-500`), hex values, `rounded-md` cards (cards are `rounded-xl` on `hairline-ring ring-border`). Use tokens: `text-primary-ink`, `bg-success/10 text-success-foreground`, `chip-3d` with `--chip`, `keycap-3d` or `Kbd` for counts and shortcuts.
- Lines: `hairline-*` utilities, solid for an object's outline, dashed only for an empty slot inviting an addition, none between header and body of one card.
- Grouped controls on pills: `rounded-none first:rounded-s-full last:rounded-e-full`, a hairline between them, `focus-visible:z-10`.
- People in previews use our own abstract avatars: `/avatars/avatar-03.svg` to `/avatars/avatar-07.svg`, always inside the `Avatar` primitive with initials as the fallback. Never a photo copied from another project. Other images are drawn with our materials (a `gem-plate` glyph, a brand wash).
- Icon-only controls always have `aria-label`. Labels carry the action. Data is fictional and plausible; a count has a singular branch when it can be 1.
- One operation per line. No ternary operator at all: a small named function at module level, an `if`, or two `{condition && <X />}` branches. A condition with more than one `&&`/`||` gets each part named.
- No comments unless the code cannot say it.

## Motion

Micro-interactions are the identity of the library: a port is finished only when it carries the ones that belong to it. Use the signature table of section 7 of the design system (press, swap, morph, resize, travel, presence, count, drag, hold) with its timing and easing tokens. Never on hover of something that cannot be clicked, never on mount for decoration. `registry/ndeko/ui/animated-size.tsx` animates a container whose content changes; dialogs already do it.

- Icon or label swap: `AnimatePresence mode='popLayout' initial={false}` around a keyed `motion.span`, opacity plus scale 0.6 and blur 2px, 150ms, ease `[0.2, 0, 0, 1]`.
- Count change: `MotionNumber` from `@/components/core/motion-number`, digits rolling in the direction of the change, `tabular-nums`. Keystroke counters keep the short 8px slide, keyed on the value, 180ms.
- Item added or removed from a list: `AnimatePresence` with height and opacity, 200ms; items already there on mount do not animate (`initial={false}`).
- Label change in a button: `motion.span layout` with `{ type: 'spring', bounce: 0, duration: 0.3 }`.
- Panels: the primitives already animate their height; do not add motion on top.
- Always read `usePrefersReducedMotion()` (`hooks/use-prefers-reduced-motion`) and keep only the opacity change when it is true.

## Verification (from the repository root)

Several people work in the repository at the same time. Fix only what is reported in your own paths.

- `./node_modules/.bin/tsc --noEmit`: 0 errors in your paths.
- `./node_modules/.bin/eslint --max-warnings=0 <your paths>` without `--fix`.
- `./node_modules/.bin/prettier --write <your paths>`.

Forbidden: installing packages, `next build`, `next dev`, test runners, browsers, `eslint --fix`, prettier on other paths, any git command that writes, and editing anything outside your category folders and the hooks your batch owns: not `icons.tsx`, not `registry/ndeko/ui/*`, not `registry/items.ts`, not `registry.json`, not `app/`. If an icon or a primitive is missing, use the closest one and say so in the report.

## Report

Files written per category, compositions not ported faithfully and why, every deliberate change of look or behaviour, missing icons or primitives. Nothing is checked in a browser: say so.
