# ndekoui roadmap

ndekoui becomes an open-source library of primitives, components, blocks and templates, installable with the shadcn CLI, drawn on one design language (`docs/DESIGN-SYSTEM.md`) and animated around what the user does. Micro-interactions are its identity: every piece carries the small movements of its state changes (section 7 of the design system). The goal is simple: start the next project from these pieces instead of rebuilding them.

## Sources and licences

| Source                                                | Licence                                    | What we take                                                     | Obligation                                               |
| ----------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Motion Primitives (ibelick)                           | MIT, © 2024 ibelick                        | the 33 motion components in `components/core`, the original site | keep the copyright notice (see `THIRD_PARTY_NOTICES.md`) |
| Origin UI, snapshot of 2025-08-07 (commit `921a9b2e`) | MIT, © 2025 Origin UI                      | the catalogue of 604 compositions in 30 categories               | keep the notice; every port is redrawn on our primitives |
| coss (where Origin UI continued)                      | AGPL-3.0 at the repository root since then | nothing: no code, no particle is copied                          | none, as long as nothing is copied                       |
| Base UI                                               | MIT                                        | behaviour and accessibility of every primitive                   | dependency                                               |
| Hugeicons free set                                    | MIT                                        | icons, behind `registry/ndeko/lib/icons.tsx`                     | dependency                                               |

### Chat pieces

| Library              | Licence | Use                                                                                                                          |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| prompt-kit (ibelick) | MIT     | chat and AI pieces of blocks and templates (prompt input, messages, reasoning, loaders), redrawn on our primitives, credited |

Code is never copied from a project that is not MIT or compatible. Components first written for another product are rebuilt here from the design language, with fictional data, unless their owner gave written permission to publish them under MIT.

## Architecture

```text
registry/
  items.ts                 typed list of registry items (source of truth)
  ndeko/
    styles/ndeko.css       tokens, hairlines, materials, reduced motion
    lib/                   utils (cn), icons, recipes
    ui/                    primitives on Base UI
    components/<category>/ compositions (the Origin UI catalogue, redrawn)
    blocks/                sections and app pieces with fictional data
    templates/             full pages
scripts/build-registry.ts  writes registry.json, theme included
public/r/*.json            built by `shadcn build`, served at https://ui.ndekocode.dev/r
app/kit                    every primitive on one page, light and dark
```

`pnpm registry:build` regenerates `registry.json` from `registry/items.ts` and `ndeko.css`, then `shadcn build` writes `public/r`. A user installs an item with `npx shadcn@latest add https://ui.ndekocode.dev/r/<name>.json`; its theme, utilities and inner dependencies come with it. Imports written as `@/registry/ndeko/ui/...` are rewritten to the user's aliases by the CLI.

## Phases

### 1. Foundation (this branch)

- Stack: Next 16.4, React 19.3, Tailwind 4.3, Base UI 1.9, motion 14, TypeScript 5.9, ESLint 9 flat config.
- Theme, utilities, icon module, recipes.
- 33 primitives: button, input, textarea, label, field, badge, chip, card, separator, skeleton, kbd, avatar, checkbox, switch, radio group, spinner, selected mark, status orb, tooltip, popover, dropdown menu, dialog, alert dialog, sheet, select, tabs, accordion, collapsible, toggle, toggle group, slider, progress, scroll area.
- Registry pipeline and the `/kit` page.

### 2. Remaining primitives

Needed by the Origin UI catalogue: calendar (react-day-picker), date field and range (Base UI or react-aria), command palette, combobox and multiselect, number field, OTP field, input group, button group, stepper, timeline, tree (headless-tree), table (TanStack Table), pagination, breadcrumb, navigation menu, preview card, resizable panels, toast (sonner on the status orb), image cropper, file upload hook, checkbox tree, native select.

### 3. The catalogue: 604 compositions in 30 categories

Ported category by category, each batch reviewed in `/kit` and its own docs page before the next one.

| Batch | Categories (count)                                                                      |
| ----- | --------------------------------------------------------------------------------------- |
| A     | input (59), textarea (19), button (54)                                                  |
| B     | checkbox (20), radio (20), switch (17), select (51)                                     |
| C     | slider (27), badge (13), avatar (23), tooltip (12), popover (9)                         |
| D     | dialog (21), dropdown (15), alert (12), banner (12), notification (22)                  |
| E     | tabs (20), accordion (20), breadcrumb (8), pagination (12), navbar (20)                 |
| F     | stepper (17), timeline (12), table (20), tree (15)                                      |
| G     | calendar and date picker (28), event calendar (1), file upload (14), image cropper (11) |

Port checklist for every composition:

1. Rebuild it on Ndeko primitives and recipes; no class string copied from the source when a primitive exists.
2. Icons from the icon module only.
3. Motion only where the user acts or the content changes (see the design system, section 7), with `useReducedMotion` for JavaScript motion.
4. Fictional, plausible data; labels that carry the action.
5. Keyboard and screen reader behaviour checked: names on icon buttons, focus visible, Escape closes.
6. Light and dark, 375px wide without horizontal scroll.
7. Registry item with title, description, category and dependencies.

### 4. Motion components

The 33 components of `components/core` are restyled on the tokens, with the React 19 lint findings fixed (components created during render, state set in effects) and reduced-motion fallbacks. They ship in the registry as `motion-<name>` items (`scripts/registry-motion.ts`), installed into `components/core/`, with their hooks and the `theme`, `utils` and `icons` items they need. The legacy `/c`, `/e` and `/h` endpoints keep serving their last published files for the old `ndekoui` CLI; `scripts/registry-build.ts` is not rerun until that CLI reads the new registry.

### 4b. Micro-interaction pass

Once a category is ported, it is reviewed against the signature micro-interactions of section 7: every press, swap, morph, resize, travel, presence, count, drag and hold that belongs to it is there, with the timing tokens and reduced motion. The `improve-animations`, `review-animations` and `emil-design-eng` skills drive the review; fixes land category by category.

### 5. Blocks and templates

Application pieces with fictional data: app shell with sidebar and inset panel, member list on a shared grid, Kanban board, task list with groups, task drawer, metric strip and day bars chart, settings pages, notification inbox, toasts and notices, sign-in and focus pages. Marketing sections: hero, feature grids, pricing, FAQ, changelog, footer, logo cloud with placeholder marks. Chat and assistant blocks built on prompt-kit's mechanisms: conversation with streaming messages, prompt input with attachments, model picker, reasoning and tool steps. Templates assemble them into full pages.

### 6. Product site

A landing page and a catalogue drawn in our own language: live previews, copy and install from the page, a filterable catalogue, a theme switch and Open in v0. Plus: per-item docs generated from the registry, search, `llms.txt`, and the shadcn MCP server pointed at our registry.

### 7. Open-source launch

README with installation and contribution paths, CONTRIBUTING with the port checklist, CODE_OF_CONDUCT, issue and pull request templates, CI (typecheck, lint, registry build), a changelog, the `ndekoui` CLI moved onto the new registry, and the old `/c` and `/e` endpoints kept until the CLI has moved.

## Decisions

| Id     | Decision                                                                           | Reason                                                                                                          |
| ------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| DEC-01 | Primitives on Base UI, not Radix, written from the Base UI documentation           | Origin UI itself moved to Base UI; one behaviour layer, maintained, accessible; coss code is AGPL and stays out |
| DEC-02 | shadcn export names, Base UI composition (`render`, not `asChild`)                 | familiar names for users of shadcn and Origin UI, native Base UI underneath                                     |
| DEC-03 | Hugeicons behind one module with Lucide-style names                                | one icon language; ports from Lucide-based code stay mechanical                                                 |
| DEC-04 | Pill buttons, two focus registers (2px ring on buttons, halo on fields)            | the design language, with a visible focus that meets WCAG on buttons                                            |
| DEC-05 | CSS motion in primitives, `motion` in compositions                                 | primitives stay light; springs and presence where the change follows the user                                   |
| DEC-06 | Registry served from `https://ui.ndekocode.dev/r`, inner dependencies as full URLs | installs work without configuring a namespace                                                                   |

## Open points for the owner

- Ever Teams components: the Ever Teams code is AGPL-3.0, copyright Ever Co. LTD. Publishing those components under MIT needs Ever Co.'s written agreement; without it, blocks are rebuilt here from the design language only.
- `app/layout.tsx` loads Umami with website id `17e8fc96-321d-43a6-94e7-d571c4c66a04`: confirm it belongs to the ndekoui account. Umami sets no cookie, so no consent banner is needed while it is the only measure.
- Before launch the site still needs a privacy page, a legal notice and a contact address. Their content is the owner's to give.
- The logo mark is an orange to magenta gradient tile, while the brand colour of the library is indigo. Keep it as the brand, or draw a flat version in one colour.
