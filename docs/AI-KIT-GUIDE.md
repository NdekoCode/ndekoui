# AI kit build guide

Repository: `/Users/ndekocode/Documents/Labs/Business/ndekoui` (the maintainer's own MIT library, Next 16, React 19, Tailwind 4, Base UI, motion 14). graphify does not index this repository: read files directly.

## Read first, completely

1. `docs/AI-KIT.md`: the plan, the reference rules, the rules for the AI kit (honest data, one run many views, live time, every state visible, a person decides, canvas and loops, colour, accessibility).
2. `docs/DESIGN-SYSTEM.md`: tokens, radius, hairlines, materials, shadows, type, controls, motion (section 7 is the law), icons, honesty, writing, section 13.
3. `docs/PORTING-GUIDE.md` sections "How to port", "Motion", "Verification", and `docs/BLOCKS-GUIDE.md` for blocks.
4. `registry/ndeko/lib/agent-run.ts` and `registry/ndeko/hooks/use-agent-run.ts`: the shared run shapes, store, formats, `useNow`, `useRunScript`.
5. Primitives you will use, read before writing: `registry/ndeko/ui/` (button, badge, chip, card, kbd, tooltip, popover, dropdown-menu, dialog, toggle-group, tabs, progress, collapsible, animated-size, chat-motion with `Fold` and `Swap`, chat-code-block, spinner, status-orb), `registry/ndeko/lib/icons.tsx` (the only icon import), `registry/ndeko/lib/recipes.ts`, `components/core/motion-number.tsx` and `components/core/word-roll.tsx` (imported as `@/components/core/motion-number`).
6. Quality references inside the repo: `registry/ndeko/ui/chat-tool.tsx`, `registry/ndeko/blocks/chat/chat-03/`, `registry/ndeko/blocks/billing/billing-01/`, `registry/ndeko/components/notification/notification-28.tsx`, `registry/ndeko/components/teams/`.

## Where the ideas come from

Each item of your batch brief starts from an idea: what a piece does, as described by the maintainer. That description is all you use. Do not look for an existing implementation, do not open other libraries' sites, repositories, registries or previews. The look comes only from our design system: hairline rings, soft surfaces, `chip-3d`, `keycap-3d`, `surface-raised`, pills, the icon module, our type scale. Where you can make the idea better (clearer state, better keyboard path, calmer motion), do it. Never name another library anywhere in the repository: not in code, comments, manifests, titles, descriptions or docs.

## Output for components

- `registry/ndeko/components/<category>/<category>-NN.tsx`, default export named after the file (`export default function Run01()`), `'use client';` when it uses state, effects, refs or handlers.
- Export the reusable view as a named export too (`export function ToolCallCard(props)`), typed with the `agent-run` shapes where they apply, so people can feed it real data. The default export is the demo that drives it with fictional data.
- A composition never imports another composition file. Helpers shared by several files of one category live in that category's `_parts/` folder (the registry ships them with each item that imports them). Anything shared across categories lives in `registry/ndeko/ui`, `lib` or `hooks`, never in another category's `_parts/`.
- Shared AI primitives already exist, reuse them instead of writing your own: `ui/copy-button` (`CopyButton`), `ui/morph-button` (`MorphButton`, idle to busy to done), `ui/live-region` (`LiveRegion`), `ui/live-duration` (`LiveDuration`, `ClockGate`, `useLiveNow`), `ui/segments` (`Segments`, a segmented switch with a travelling thumb), `ui/json-view` (`JsonView`), `ui/call-status` (`CallStatusMark`, `CALL_STATUS_WORD`), `ui/replay-button` (`ReplayButton`), `ui/level-bars` (`LevelBars`, bars that follow a simulated or real voice level), `ui/letter-tile` (`LetterTile`, the drawn initial of a model lab or a site; pass no series beside agents so the agents keep the series colours), `lib/speech-envelope` (`speechLevelAt`, `noiseAt`), `lib/media-clock` (`formatClock` for 0:07, `spokenClockOf` for screen readers), `lib/motion-presets` (easings, springs and presence presets with reduced-motion fallbacks), `lib/hatch` (`hatchOf`), `hooks/use-timeouts` (`useTimeouts`), `hooks/use-demo-run` (`useDemoRun`: `useRunScript` plus `useInView`, with `holdWhile` to pause a script while a person decides). Read them before writing a demo.
- One manifest per category, `registry/ndeko/components/<category>/_manifest.ts`, entries `{ name, source: 'ndeko', title, description }`. Titles are short nouns, descriptions one plain sentence that says what the piece does and how it moves. English, no em dashes.
- A demo fits the catalogue tile: compact pieces stand alone around 360px wide, wide pieces up to 720px, full pieces up to 1100px; all work at 340px without horizontal scroll (long content scrolls inside its own region).

## Code rules (strict, reviewed line by line)

- Imports only from `@/registry/ndeko/ui/*`, `@/registry/ndeko/lib/*`, `@/registry/ndeko/hooks/*`, `@/components/core/*`, `@base-ui/react/*`, `react`, `motion/react`, and packages already in `package.json`. No new package.
- One operation per line. No ternary operator anywhere: a named function at module level, an `if`, or two `{condition && <X />}` branches. A condition with more than one `&&` or `||` gets each part named. Dense expressions split into named variables. No `reduce` or chained method soup.
- No comments, except a business rule or a constraint the code cannot say.
- Strict TypeScript, no `any`.
- Semantic tokens only (no raw palette class, no hex in components). Series through `seriesColorOf(slot)` as an inline style (`style={{ '--chip': seriesColorOf(2) } as React.CSSProperties}` or `backgroundColor`).
- Icons only from `@/registry/ndeko/lib/icons`. Icon-only controls have `aria-label`. Labels carry the action.
- Motion per section 7: swaps with `Swap` or `AnimatePresence mode='popLayout' initial={false}`, size changes through `AnimatedSize`, figures through `MotionNumber`, labels through `WordRoll`, travel through `layoutId` or Base UI indicators, presence with height and opacity. `useReducedMotion()` keeps only opacity. Durations and easings from section 7. Nothing animates on mount for decoration.
- Live clocks: a small leaf component calls `useNow(100 or 1000, isRunning)` so only that text re-renders. Scripts: `useRunScript(script, { initial, isActive: isInView, loopAfter })` with `useInView(ref, { amount: 0.3 })` from `motion/react`. Define scripts and initial snapshots at module level (stable references).
- Accessibility: buttons are buttons, rows that open are buttons with `aria-expanded`, lists are lists, a polite live region (`aria-live='polite'`, visually hidden) announces state changes in one short line. Keyboard paths described in each item work. Focus is visible.
- Fictional data. The model lab is "Lumen" (Lumen Swift, Lumen, Lumen Max). Agents are named by role (Planner, Researcher, Writer, Reviewer, Coder). Companies and people are invented and plausible. Figures that could pass for real are marked "Illustrative" in the demo.

## Verification (from the repository root)

- `./node_modules/.bin/tsc --noEmit`: zero errors in your paths.
- `./node_modules/.bin/eslint --max-warnings=0 <your folders>` without `--fix`.
- `./node_modules/.bin/prettier --write <your folders>`.

Forbidden: installing packages, `next dev`, `next build`, `pnpm registry:build`, test runners, browsers, `eslint --fix`, prettier outside your folders, any git command that writes (commit, checkout, stash, reset), and editing anything outside your category folders: not `icons.tsx`, not `registry/ndeko/ui/*`, not `registry/items.ts`, not `app/`, not the docs. Start no long-lived process; stop anything you start. If an icon or a primitive is missing, use the closest one and list it in the report.

## Report

Per item: file, what it shows, its states, its keyboard path, deliberate choices. Then: missing icons or primitives, anything not finished, and the honest line that nothing was checked in a browser. Keep it under 60 lines.
