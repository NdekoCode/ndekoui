# The AI kit

ndekoui adds what a product with AI in it needs: agent views, prompts and answers, review of what an agent wants to do, runs and their cost, charts that explain themselves, illustrations and backgrounds for the site around them. This document is the plan, the shared foundations, the rules and the progress. Read `docs/DESIGN-SYSTEM.md`, `docs/PORTING-GUIDE.md` and `docs/BLOCKS-GUIDE.md` first: their rules apply unchanged.

## Shared foundations (done)

- `--series-1` to `--series-5` in the theme: the identity of agents and chart series, fixed order (indigo, orange, violet, lime, pink), validated with the dataviz checks in both themes (adjacent colour-blind separation, normal vision, 3:1 against the surface). They avoid the status hues. Text never wears them.
- `registry/ndeko/lib/agent-run.ts` (`agent-run` item): the shape of a run (agents, plan, tool calls, approvals, usage), `reduceRun`, `createRunStore`, `seriesColorOf`, `elapsedOf`, `formatDuration`, `formatTokens`, `formatCost`.
- `registry/ndeko/hooks/use-agent-run.ts`: `useRunSnapshot(store)`, `useNow(intervalMs, isActive)` for live clocks, `useDocumentVisible()`, and `useRunScript(script, { initial, isActive, loopAfter })`, which plays a scripted run into a store the way a backend would stream it, pauses off screen and in hidden tabs, and loops.

Every AI view takes plain props typed with these shapes, so one store can feed many views. Previews drive them with `useRunScript` and motion's `useInView`.

## Taxonomy

Components, in a new catalogue family **AI** (first in the catalogue), then **Data** and **Motion and effects**:

| Family             | Category       | Job                                                                                          |
| ------------------ | -------------- | -------------------------------------------------------------------------------------------- |
| AI                 | `prompt`       | asking: composers, model and effort, completion, rewrite, templates, plain-word filters      |
| AI                 | `answer`       | answering: citations, grounding, message actions, thinking, arena, artifacts                 |
| AI                 | `agent`        | agents at work: plan, lanes, graph, handoff, tree, fleet, monitor, memory, knowledge, status |
| AI                 | `run`          | one run in detail: tool calls, waterfalls, terminal, context, usage, health                  |
| AI                 | `review`       | what needs a person: approvals, permissions, autonomy, diffs, branches, extraction           |
| AI                 | `voice`        | voice agents: orb, voice note, dictation                                                     |
| Data               | `chart`        | charts that read themselves: lines, bars, baselines, outlooks, goals, explainers             |
| Motion and effects | `background`   | quiet fields behind a hero or a band                                                         |
| Motion and effects | `illustration` | living scenes for heroes, features and empty states                                          |
| Motion and effects | `text-effect`  | text that types, slices or forms out of characters                                           |
| Motion and effects | `effect`       | fan stacks, parallax, named cursors, a light round a pill                                    |
| Feedback           | `loading`      | skeletons that share one sweep and hand over to the content                                  |

Block groups added: `agent-chat`, `agent-ops`, `agent-review`, `workflows`, `ai-data`, `onboarding`, `maps`, `error-pages`, `page-headers`, `blog`, `help-center`, `search`, `docs`, `testimonials`, `stats`, `team-sections`. Existing groups get new entries (settings, auth, legal, pricing, heroes, faqs, features, ctas, integrations, changelog, empty-states).

## Rules for the AI kit

- **Honest data.** People, companies and models in previews are fictional (the lab "Lumen" and its models Lumen Swift, Lumen and Lumen Max; agents named by their role). A time, a price or a speed that could pass for a real figure is marked "Illustrative" or "Estimate for this demo". Real provider marks appear only to name a provider, never beside invented figures.
- **One run, many views.** Views take props typed by `agent-run`. A preview that simulates work uses `useRunScript`, plays only while in view (`useInView` from `motion/react`) and pauses in hidden tabs.
- **Live time.** Clocks read `useNow(100 or 1000, isRunning)`, so a finished step stops ticking and nothing re-renders off screen.
- **Every state is visible.** Each view shows how it looks queued, running, waiting on a person, done and failed. The change between them is the micro-interaction: a label that rolls, a mark that swaps, a bar that grows, a panel that resizes with `AnimatedSize`. Nothing jumps.
- **A person decides.** Approve, Deny, Retry, Undo work from the keyboard, with names that carry the action, and leave a trace in the view after they are pressed.
- **Canvas and loops.** Backgrounds and illustrations draw only while on screen, stop under reduced motion on a still frame that still reads, and never block the main thread (no per-frame React state; refs and `requestAnimationFrame`, or CSS).
- **Colour.** Agents and series take `--series-N` in fixed order through `seriesColorOf`. Status keeps the status pairs. No gradient between hues, no glow, no neon (section 13).
- **Accessibility.** Live regions announce state changes politely (one line, never every token). Charts carry a hidden table. Canvas pieces are `aria-hidden` with a text alternative beside them when they carry meaning.

## Progress

| Batch | Content                                                                                                                             | Status      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| F     | series tokens, `agent-run`, `use-agent-run`                                                                                         | done        |
| B1    | `run-01..10`, `review-01..03`                                                                                                       | written     |
| B2    | `agent-01..10`                                                                                                                      | written     |
| B3    | `prompt-01..10`, `voice-01..03`                                                                                                     | written     |
| B4    | `answer-01..06`, `review-04..11`                                                                                                    | written     |
| B5    | `chart-01..16`                                                                                                                      | todo        |
| B6    | blocks `agent-chat-01..04`, `agent-review-01..05`                                                                                   | done        |
| B7    | blocks `agent-ops-01..09` (done), `workflows-01..02`, `ai-data-01..03`, `onboarding-01..03`, `maps-01..02`                          | in progress |
| B8    | `illustration-01..12`, `effect-01..04`, `text-effect-01..04`                                                                        | todo        |
| B9    | `background-01..12`, `loading-01..03`, additions to existing categories                                                             | todo        |
| B10   | blocks settings, auth, legal, error pages, page headers, blog, help center, search, docs                                            | todo        |
| B11   | blocks testimonials, stats, team sections, pricing, heroes, faqs, features, ctas, integrations, changelog, empty states             | todo        |
| B12   | templates `application-06..09`, `marketing-06..07`                                                                                  | todo        |
| B13   | `prompt-11..13`, `review-12..17`, `run-11..14`, `agent-11..13`, `answer-07..08`, `voice-04..05`, `loading-01..04`                   | todo        |
| U     | every written piece brought to the bar of `AI-KIT-GUIDE.md`: it plays itself, it has one signature moment, it costs nothing at rest | in progress |
| S     | site: AI family in the catalogue, thumbnails, home sections for AI and for states                                                   | todo        |
