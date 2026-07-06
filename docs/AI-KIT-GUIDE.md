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
- Shared AI primitives already exist, reuse them instead of writing your own: `ui/copy-button` (`CopyButton`), `ui/morph-button` (`MorphButton`, idle to busy to done), `ui/live-region` (`LiveRegion`), `ui/live-duration` (`LiveDuration`, `ClockGate`, `useLiveNow`), `ui/segments` (`Segments`, a segmented switch with a travelling thumb), `ui/json-view` (`JsonView`), `ui/call-status` (`CallStatusMark`, `CALL_STATUS_WORD`), `ui/replay-button` (`ReplayButton`), `ui/level-bars` (`LevelBars`, bars that follow a simulated or real voice level), `ui/brand-tile` (`BrandTile`, the real mark of a known product on a key cap tile), `ui/letter-tile` (`LetterTile`, a drawn initial for what has no known mark, such as an invented customer or site; pass no series beside agents so the agents keep the series colours), `lib/speech-envelope` (`speechLevelAt`, `noiseAt`), `lib/media-clock` (`formatClock` for 0:07, `spokenClockOf` for screen readers), `lib/motion-presets` (easings, springs and presence presets with reduced-motion fallbacks), `lib/hatch` (`hatchOf`), `hooks/use-timeouts` (`useTimeouts`), `hooks/use-autoplay` (`useAutoplay` and `typingSteps`: the demonstration a piece plays until a person takes over), `hooks/use-session` (`useSession`: a scripted session played into a reducer for a block or a template, where the agent's steps always play, the demonstration's steps stop at the first click or key, and a person's steps are answered by the demonstration after their delay then wait for the person once they took over; it returns `ref`, `isInView`, `state`, `act`, `pressed`, `restart`), `ui/settle` (`Settle`, `SettleItem`: the entrance of a piece, once), `hooks/use-demo-run` (`useDemoRun`: `useRunScript` plus `useInView`, with `holdWhile` to pause a script while a person decides). Read them before writing a demo.
- One manifest per category, `registry/ndeko/components/<category>/_manifest.ts`, entries `{ name, source: 'ndeko', title, description }`. Titles are short nouns, descriptions one plain sentence that says what the piece does and how it moves. English, no em dashes.
- A demo fits the catalogue tile: compact pieces stand alone around 360px wide, wide pieces up to 720px, full pieces up to 1100px; all work at 340px without horizontal scroll (long content scrolls inside its own region).
- Layout follows the width of the piece, never the width of the screen: a wide screen still shows previews in narrow tiles. Put `@container` on the piece's root (or on the part that changes) and use container variants (`@sm:` 384px, `@md:` 448px, `@lg:` 512px, `@xl:` 576px, `@2xl:` 672px) for columns, side-by-side rows and hidden columns. Viewport variants (`sm:`, `md:`) stay only for what depends on the device: the 16px input text that stops phones from zooming (`text-base md:text-[13px]`) and a dialog instead of a popover on phones.
- Text a person selects but must not edit is a `textarea` without `readOnly` (a read-only field keeps no caret for Shift and the arrows), with `aria-readonly='true'`, `inputMode='none'` and a native `beforeinput` listener that calls `preventDefault()`.

## The bar: alive, worth installing, free at rest

A piece that waits for a click to show what it does reads as a picture. A piece that keeps the processor busy while nobody looks at it is a cost. Both are defects, reviewed like a bug.

### Alive at first sight

- **It plays itself.** While it is on screen, a piece demonstrates its own key interaction in a loop: it types, picks, drags, approves, the way a person would. Pieces driven by a run use `useDemoRun` with `loopAfter`; pieces driven by a person use `useAutoplay` from `hooks/use-autoplay` (steps that call the same handlers a person triggers, `typingSteps` for text); a block or a template that plays a whole session uses `useSession` from `hooks/use-session` (one reducer, a script of steps done by the agent, by the demonstration or by a person, a resting state), and never a private copy of it. What a demonstration needs besides (the look of a pressed control, a text typed key by key, a live region that stays silent while it plays) comes from `lib/demonstration`: no piece writes its own. The first click or key inside the piece ends the script for good and the piece behaves normally from there. Steps never move focus and never open a layer rendered outside the piece: a menu, a picker or a popover the demo wants to show is drawn inline in the demo. Under reduced motion nothing plays and the piece rests in its most telling state.
- **One signature moment.** Each piece has one movement a visitor remembers and its manifest description names it: a ring that fills, a stamp that lands, a thread that draws itself, digits that roll, a card that flies to its place, a key that becomes another key.
- **Every change of state moves, and only what changed.** Press gives (scale 0.97). A label becomes the next label (`Swap`, `WordRoll`). A count rolls (`MotionNumber`). A row arrives with height and opacity, and leaves faster than it came. A check draws itself. An error nudges 4px once. A result lands with a short settle from 1.04 to 1. Text that streams arrives word by word with a soft fade. Nothing else on the piece moves at that moment.
- **No entrance on scroll.** A piece is there when you reach it, in its resting state, and its demonstration starts. Revealing every piece as it scrolls into view is the reflex section 13 of the design system forbids. `Settle` and `SettleItem` (`ui/settle`) are for what appears because of an action or an event inside the piece: a result that lands, a panel that opens, the rows of a list that just loaded.
- **Hover and focus answer within 120ms** on everything a person can act on: a tint, an icon that moves 2px, a ring. Nothing moves on hover that cannot be clicked.

### Worth installing

- **One element carries the piece**: a ring, a large figure (20 to 28px, tabular), a drawn plate (`gem-plate`, `chip-3d`, `keycap-3d`), a small chart. Never a card of 13px lines with nothing to look at.
- **Our materials give the depth**: `surface-raised` for what floats, soft trays (`bg-foreground/[0.04]`) for what groups, hairline rings, series colours for who, status pairs for what happened. Dark mode is drawn, not inverted.
- **The resting state is the best picture of the piece**, since it is what a visitor sees first and what plays under reduced motion.

### Nothing that reads as generated

Section 13 of `docs/DESIGN-SYSTEM.md` applies to every piece, block and template. Read your work against it before you return it, and against these signs:

- A loop on something that is not live. A pulse or a ping belongs to what is really running, and to three things at most in a piece.
- `transition-all`, a spring that bounces, a card that scales on hover, a movement of more than a few pixels on hover, anything that moves on hover and cannot be clicked.
- Colour that means nothing: chips in several hues with no meaning, a gradient between two hues, a glow, a coloured shadow. Series colours say who, status pairs say what happened, the primary colour marks the one action. The one gradient of the system is the mesh, and it means an identity: the picture of a person, an agent or a team that has none (see "Who wears what" below). No card, button or background wears it. The grain wash (`Wash` from `ui/wash`, utility `grain-wash`) is the other one, and it means something too: the one featured surface of a view, or what is live right now in the hue of its state (running, waiting on a person, done), fading in and out with that state. One per view, never as decoration.
- Type that shouts: a weight above 600, an uppercase tracked label, italics for emphasis, negative tracking on small text. Hierarchy comes from size and from the three text roles (foreground, muted, faint).
- Copy that fills: an exclamation mark, a full stop on a label or a short caption, a greeting as a title, hype words, a badge that says New or Pro with nothing behind it, data such as 123,456 or Lorem. Figures share one format and tabular numerals.
- Spacing by eye: a value off the 4px step, two equal things at different sizes, icons or figures that do not sit in one column, radii that do not nest (an inner radius is the outer radius minus the padding between them).
- Three equal cards by reflex, an icon on top of every card, a sparkle for anything about AI, an emoji as an icon.

### Free at rest

Measured on the built site with the processor slowed four times, in a browser that draws 120 frames a second (a 60 Hz screen costs about half): a piece at rest costs nothing, a piece that plays stays under a third of one core over a whole round.

- **Loops move transform or opacity only**, as CSS keyframes when they can be. Never `left`, `top`, `width`, `height`, `background-position` or a stroke offset in a loop or in a transition that fires many times a second: a progress is `scaleX` on a full-width bar with `origin-left`, a position is `translateX`.
- **Nothing runs off screen.** Scripts hold (the hooks do it), clocks hold (wrap the root of the piece in `ClockGate isActive={isInView}`), a `requestAnimationFrame` loop or a canvas stops when `isInView` is false.
- **A clock re-renders its own text and nothing else**: a leaf component calls `useNow`. A list, a chart or a card never does. A ticking text sits in a fixed-width `tabular-nums` box, outside any `AnimatedSize`.
- **`MotionNumber` is for figures that change a few times a second at most.** A figure that ticks without stopping is plain tabular text.
- **`layout` animations carry a `layoutDependency`** and never sit on a list of more than a dozen rows.
- **A value that changes every frame is written to the element** (a ref and `style.transform`, or a canvas), never through React state.
- **A round does not move the page.** The outer box of a piece that loops reserves a `min-h` near its tallest state and calls `useKeptHeight(ref)` (`hooks/use-kept-height`), so it keeps the tallest height it reached and what sits under it stays still.
- **What still costs is script-driven**: `layout` animations, rows that open to `height: auto`, `AnimatedSize`, a path that morphs. Entrances and exits on transform, opacity and filter run without script. Keep the first kind short and rare.

### Fits a phone

Every piece is checked at 375px. The page never scrolls sideways.

- Layout follows the width of the piece (`@container`, `@sm:` to `@4xl:`), never the window.
- A wide table scrolls inside its own frame, and that frame is positioned (`relative`): anything `sr-only` or absolutely positioned inside an area that scrolls sideways widens the whole page otherwise.
- A bubble placed with `left` and centred with a translate hangs from a zero-width anchor (`w-0`), or its box sticks out of the piece at the right end.
- Text beside a figure truncates, actions wrap under their text, columns fold to one.

## Code rules (strict, reviewed line by line)

- Imports only from `@/registry/ndeko/ui/*`, `@/registry/ndeko/lib/*`, `@/registry/ndeko/hooks/*`, `@/components/core/*`, `@base-ui/react/*`, `react`, `motion/react`, and packages already in `package.json`. No new package.
- One operation per line. No ternary operator anywhere: a named function at module level, an `if`, or two `{condition && <X />}` branches. A condition with more than one `&&` or `||` gets each part named. Dense expressions split into named variables. No `reduce` or chained method soup.
- No comments, except a business rule or a constraint the code cannot say.
- Import order: packages, then `@/...` paths in alphabetical order, a blank line, then relative imports. Never an alias import after a relative one.
- Strict TypeScript, no `any`.
- Semantic tokens only (no raw palette class, no hex in components). Series through `seriesColorOf(slot)` as an inline style (`style={{ '--chip': seriesColorOf(2) } as React.CSSProperties}` or `backgroundColor`).
- Icons only from `@/registry/ndeko/lib/icons`. Icon-only controls have `aria-label`. Labels carry the action.
- Motion per section 7: swaps with `Swap` or `AnimatePresence mode='popLayout' initial={false}`, size changes through `AnimatedSize`, figures through `MotionNumber`, labels through `WordRoll`, travel through `layoutId` or Base UI indicators, presence with height and opacity. Durations and easings from section 7. The reduced motion setting is read with `usePrefersReducedMotion` from `hooks/use-prefers-reduced-motion`, and only opacity is kept when it is true. Never the hook of the animation library: it answers during the first render, so the server and the browser disagree and the page fails to hydrate for the people who set the preference.
- Live clocks: a small leaf component calls `useNow(100 or 1000, isRunning)` so only that text re-renders. Scripts: `useRunScript(script, { initial, isActive: isInView, loopAfter })` with `useInView(ref, { amount: 0.3 })` from `motion/react`. Define scripts and initial snapshots at module level (stable references).
- Accessibility: buttons are buttons, rows that open are buttons with `aria-expanded`, lists are lists, a polite live region (`aria-live='polite'`, visually hidden) announces state changes in one short line. A hint shown after a failed entry has an id, the field points to it with `aria-describedby` while it shows, and the sentence is spoken through that live region. Keyboard paths described in each item work. Focus is visible.
- Known products appear under their real name with their real mark: the makers of models (ChatGPT, Claude, Gemini, DeepSeek, Mistral, Llama, Grok), the tools an agent connects to (GitHub, Notion, Linear, Google Drive, Stripe and the others) and the payment networks. Draw them with `BrandTile` (`ui/brand-tile`) or `BrandLogo` (`lib/brand-logos`, read its `BRANDS` to see which marks exist; when one is missing use `LetterTile` and say so in the report). A model name carries no version number. Nothing is invented about a real product: a price, a speed or a context size shown beside a real name is a coarse tier and the demo says "Illustrative". Customers, companies and people stay invented and plausible; agents are named by role (Planner, Researcher, Writer, Reviewer, Coder). Figures that could pass for real are marked "Illustrative".
- Who wears what. A person wears a gradient drawn from their name: `<Avatar seed={person.name} />`, never initials and never a silhouette picture; a photo, when the data has one, goes inside as `AvatarImage`. An agent, a team or a project wears `MeshTile` (`ui/mesh-tile`), in its own colour when it has one (`color={seriesColorOf(agent.series)}`). An invented company, workspace or site wears `CompanyMark` (`ui/company-mark`); a known product wears its real mark through `BrandTile`. Seed with what stays the same: the name in sample data, the id where the name can be edited. A letter on a tile (`LetterTile`) is only for what a letter names: a lettered choice, or a real product whose mark is missing from `BRANDS`. Someone invited who has not joined is a dashed slot with an envelope, since nobody is there yet.

## Verification (from the repository root)

- `./node_modules/.bin/tsc --noEmit`: zero errors in your paths.
- `./node_modules/.bin/eslint --max-warnings=0 <your folders>` without `--fix`.
- `./node_modules/.bin/prettier --write <your folders>`.

Forbidden: installing packages, `next dev`, `next build`, `pnpm registry:build`, test runners, browsers, `eslint --fix`, prettier outside your folders, any git command that writes (commit, checkout, stash, reset), and editing anything outside your category folders: not `icons.tsx`, not `registry/ndeko/ui/*`, not `registry/items.ts`, not `app/`, not the docs. Start no long-lived process; stop anything you start. If an icon or a primitive is missing, use the closest one and list it in the report.

## Report

Per item: file, what it shows, its states, its keyboard path, deliberate choices. Then: missing icons or primitives, anything not finished, and the honest line that nothing was checked in a browser. Keep it under 60 lines.
