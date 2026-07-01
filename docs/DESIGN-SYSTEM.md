# Ndeko UI design system

This is the law for everything published in the registry: primitives, components, blocks, templates and the site itself. The code is the reference. When this document and a component disagree, the component wins and this document gets fixed in the same change.

The grammar fits in one sentence: **surfaces are drawn with a hairline ring and a soft tinted shadow, never with a full opaque border; a real border is a separator.**

## 1. Tokens

All tokens live in `registry/ndeko/styles/ndeko.css` and ship as the `theme` registry item. Colours are full values (`hsl(...)`), mapped into Tailwind through `@theme inline`, so `bg-primary`, `text-primary-ink` and `color-mix(in oklab, var(--primary) ...)` all work.

| Token                                               | Light              | Dark                                 | Use                                                         |
| --------------------------------------------------- | ------------------ | ------------------------------------ | ----------------------------------------------------------- |
| `--background`                                      | `hsl(240 11% 98%)` | `hsl(240 5% 7%)`                     | the page, never pure white                                  |
| `--card`, `--popover`                               | white              | `hsl(240 5% 10%)`, `hsl(240 5% 11%)` | raised surfaces                                             |
| `--foreground`                                      | `hsl(240 6% 10%)`  | `hsl(240 5% 90%)`                    | text                                                        |
| `--muted-foreground`                                | `hsl(240 4% 42%)`  | `hsl(240 5% 62%)`                    | hints, meta, icons                                          |
| `--border`                                          | `hsl(240 3% 89%)`  | `hsl(240 4% 16%)`                    | hairlines                                                   |
| `--primary`                                         | `hsl(239 84% 67%)` | same                                 | fills: the one primary action, checked controls, indicators |
| `--primary-ink`                                     | `hsl(243 75% 59%)` | `hsl(234 89% 74%)`                   | brand text and links                                        |
| `--success`, `--warning`, `--info`, `--destructive` | measured pairs     | measured pairs                       | tints and fills                                             |
| `--*-foreground`, `--destructive-ink`               | measured pairs     | measured pairs                       | status text                                                 |

Rules:

- New code uses semantic tokens only. No raw palette class (`bg-indigo-500`), no hex value in a component.
- `--primary` is identical in both themes, so the call to action looks the same everywhere.
- A fill token is never used as text on the page. Indigo-500 measures 4.28:1 on the light page and fails AA; brand text uses `text-primary-ink` (6.02:1 light, 6.64:1 dark).
- Status colours appear as soft pairs (`bg-success/10 text-success-foreground`), chips, dots and orbs. A saturated fill with white text never carries a status.
- State greys come from foreground alpha, never from named greys, so one hover works on the page and on a card: `2.5 / 3 / 4 / 5 / 6 / 10 / 15 / 20` percent.

## 2. Radius

`--radius` is `0.625rem`. `rounded-sm` 6px for chips, `rounded-md` 8px for menu rows, ghost buttons and fields, `rounded-lg` 10px for tooltips and tiles, `rounded-xl` 14px for cards, popovers and menus, `rounded-2xl` 18px for dialogs and sheets. `rounded-3xl` is not part of the scale. Buttons are pills (`rounded-full`), except ghost and link buttons, which keep the row radius.

A surface nested in another keeps the corners concentric: its radius is the outer radius minus the gap between them. The catalogue tray is `rounded-2xl` with `p-1.5`, so its stage is `rounded-[calc(var(--radius-2xl)-0.375rem)]`, never `rounded-xl`, whose curve would not run parallel to the tray.

## 3. Lines and materials

- **Hairlines**: `hairline-ring`, `hairline-border`, `hairline-t/b/l/r/x/y`, `hairline-divide-x/y` draw one device pixel (0.5px on a 2x screen). `cn` knows them, so `hairline-ring ring-2` keeps the last one.
- **Solid hairline**: the outline of an object that holds content or a value (cards, fields, menus, chips).
- **Dashed hairline**: only an empty slot that invites an addition (an add row, a drop zone). Never a separator, never decoration.
- **No line** between header, body and footer of one card: type and spacing separate them. Tables with columns of figures are the one place for row lines.
- **Materials**, each with one meaning:
  - `chip-3d` (with `--chip`): an assigned value, a label.
  - `keycap-3d`: a key, an icon tile in a list row.
  - `gem-plate` (with `--gem`): a kind, such as an issue type or a workspace without a logo, holding a white glyph.
  - `surface-raised`: a floating layer (menu, popover, select, dialog).
  - `surface-brand`: the one lifted object of a block (a timer card, a featured plan).
- Relief stays on labels. The state of a control (pressed, selected, checked) stays flat.
- **Backgrounds before borders.** The outermost surface (a card, a dialog, a preview stage) keeps its one hairline. Everything inside it separates by a tint (`bg-foreground/[0.04]`, `bg-muted`, `bg-card` on a tinted parent) or by space, never by a second ring. A piece that reaches the edge of its container gets inner padding, so two rings never meet.
- **Diagram nodes** (beam ends, orbit icons) are flat `bg-muted` tiles: the line or path that reaches them stays clean.

## 4. Shadows

| Recipe                                                | Where                                     |
| ----------------------------------------------------- | ----------------------------------------- |
| `shadow-[0_1px_2px_rgb(0_0_0/0.04)]`                  | cards and list surfaces at rest           |
| `shadow-[0_1px_2px_rgb(0_0_0/0.05)]`                  | controls: outline button, field, checkbox |
| `surface-raised`                                      | floating layers                           |
| `shadow-[0_1px_2px_rgb(0_0_0/0.14)]` plus inner light | primary and destructive buttons           |
| `shadow-xl shadow-black/8`                            | dialogs and sheets                        |

An element without relief has no shadow at all. In dark mode the black shadows almost vanish on purpose: relief comes from the hairline.

Modal layers (dialog, alert dialog, sheet, command palette) sit on `bg-black/40 backdrop-blur-xs`: the page behind stays recognisable but out of focus, and the backdrop fades with the layer. Popovers, menus, selects and tooltips never blur what is behind them, because the page stays in use while they are open.

## 5. Typography

Components inherit the font of the app. The site and the previews use the system UI stack. Weight stops at `font-semibold`; no `tracking-*` in new code; `text-balance` on headings; `tabular-nums` on every aligned number.

| Role                       | Classes                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| Chrome, menu rows, buttons | `text-[13px]` (`text-xs` for small buttons)                           |
| Body                       | `text-[13px]` in components, `text-sm` or `text-base` in long reading |
| Card title                 | `text-sm font-medium`                                                 |
| Dialog title               | `text-lg font-semibold`                                               |
| Page title                 | `text-2xl font-semibold sm:text-3xl`                                  |
| Hint, meta                 | `text-xs text-muted-foreground`                                       |

## 6. Controls

- Buttons: `default` h-8, `sm` h-7, `lg` h-9, icon sizes 28, 32 and 36px. Two sizes on one surface at most. A link that looks like a button renders the `Button` with `render={<a />}`, never a copied class string.
- Fields share `CONTROL_RECIPE` (`registry/ndeko/lib/recipes.ts`): a hairline at rest, the border plus a 3px halo at 25% of `--ring` on focus, the destructive pair when invalid, `text-base md:text-[13px]` so iOS does not zoom.
- Focus has two registers that never mix: buttons draw a 2px ring with a 2px offset, fields and links draw the soft halo.
- Floating layers sit at `z-50`. Between two open layers, DOM order decides.

## 7. Motion: micro-interactions are the identity

Ndeko UI exists for its micro-interactions. Every component, block, template and page carries the small movements that tell people the interface heard them: a press that gives, a label that becomes its next state, a panel that grows to fit what it now holds, an indicator that travels to the new choice. A component without the micro-interactions natural to it is unfinished. The look comes from this document; the motion ideas come from the libraries the maintainer follows (Aceternity UI, Magic UI, Kokonut UI, React Bits, 21st.dev, Animate UI, UI Layouts, SmoothUI, Cult UI), always redrawn on our tokens and our recipes. Emil Kowalski's design engineering rules (the `emil-design-eng` skill) are the reference for timing and easing.

### What moves, and why

Movement answers the user, shows a state change, keeps space consistent, or explains. It never decorates a hover on something that cannot be clicked, never plays on page load inside an application, and never runs on actions repeated many times a day from the keyboard (a command palette opens instantly).

### The signature micro-interactions

| Pattern  | Where                                                                                                            | Recipe                                                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Press    | buttons, toggles, cards that are links                                                                           | `active:scale-[0.97]`, 160ms `--ease-out-strong`; never on triggers of menus and dialogs                                                                                                                                               |
| Swap     | an icon or a label that becomes another (copy to copied, play to pause, follow to following)                     | `AnimatePresence mode='popLayout'`, opacity plus scale 0.6 and blur 2px, 150ms                                                                                                                                                         |
| Morph    | a control whose label and width change (Save, Saving, Saved)                                                     | the label in `motion.span layout`, spring `{ bounce: 0, duration: 0.3 }`                                                                                                                                                               |
| Resize   | a dialog, popover, card or panel whose content changes (steps, tabs, expanded rows)                              | `AnimatedSize` (height, width or both), spring with no bounce; dialogs do it by default                                                                                                                                                |
| Travel   | one indicator moving between choices (tabs, segmented controls, nav, menus, pagination)                          | Base UI indicator variables or `layoutId`, 200 to 300ms, measured from the active item                                                                                                                                                 |
| Presence | items added to or removed from a list, toasts, chips, notices                                                    | height and opacity, 200ms in, faster out; items present on mount do not animate                                                                                                                                                        |
| Roll     | a short phrase that changes on an action (billing period, seat phrase, unsaved count)                            | `WordRoll`: only the changed words leave upwards with a 4px blur and the new ones rise in, in the direction of the change; neighbours slide; the widest label is reserved when it is known                                             |
| Glide    | a tooltip or popover that moves to another anchor while open (tour steps, chart readouts, a row of icon buttons) | one shared layer through a Base UI handle; the positioner's transform eases 200ms for tooltips and 250ms for popovers, `--ease-out-strong`; the arrow fades in on a new side; size through `AnimatedSize`; the first open is unchanged |
| Count    | a figure the user just changed (quantity, rating, volume)                                                        | digits roll in the direction of the change with `MotionNumber`, `tabular-nums`; loaded figures appear at their value; a counter that changes on every keystroke keeps a short 8px slide                                                |
| Drag     | cards, sheets, sliders, reorderable rows                                                                         | springs that keep velocity, momentum dismissal, damping at the bounds, pointer capture                                                                                                                                                 |
| Hold     | a destructive action that needs intent                                                                           | a clip-path fill over 2s linear while pressed, 200ms back on release                                                                                                                                                                   |
| Ambient  | marketing surfaces only                                                                                          | `animate-marquee` and `animate-float`, never inside the application                                                                                                                                                                    |

### Timing and easing

- Tokens: `--ease-out-strong` (`cubic-bezier(0.23, 1, 0.32, 1)`) for entering and responding, `--ease-in-out-strong` for something moving on screen, `--ease-drawer` for sheets and drawers, linear for constant motion. Never `ease-in` on interface motion.
- Durations: press 100 to 160ms, tooltips 125ms, menus and popovers 150ms, dialogs 200ms, sheets 300ms. Exits are faster than entrances (dialogs leave in 150ms, popups in 100ms).
- Nothing appears from `scale(0)`: popups start at 95%, tooltips at 97%. Popovers grow from their trigger (`--transform-origin`); dialogs stay centred.
- CSS transitions for anything that can be interrupted (they retarget), keyframes only for loops. Springs where the motion follows a gesture.
- Animate `transform`, `opacity`, `scale`, `translate`; size animations go through `AnimatedSize` only.
- Hover effects run only where the pointer can hover (Tailwind's `hover:` already checks it).

### Reduced motion

The theme keeps fades and colour changes and drops movement when the system asks for reduced motion. JavaScript motion reads `useReducedMotion()` and falls back to an opacity change or an instant one. A spinner keeps turning.

## 8. Icons

One module, `registry/ndeko/lib/icons.tsx`: Hugeicons behind semantic names that follow Lucide's (`CheckIcon`, `XIcon` for the cross, `ChevronDownIcon`), stroke 1.75, `size-4` by default inside buttons and menus. Components never import an icon library directly. A brand mark or a one-off illustration lives as its own SVG component.

## 9. Honesty in previews, blocks and templates

- Data in previews is fictional and looks like it. Names, companies and figures are illustrative; a figure that could be read as a real statistic carries the word "Illustrative".
- No fake testimonials, no invented user counts, no made-up logos of real companies.
- Every count has a singular branch. A list that can be empty has an empty state; an async block has loading and error states.
- "Show more" appears only when there is more.

## 10. Writing

No em dashes: a comma, a colon or a full stop. No "not X but Y". No emojis. Bold for key terms only. A button label carries the action ("Create project", "Delete project"), never "OK". Microcopy states the fact and the outcome; a refusal says what to do next.

## 11. References

References give mechanisms to recompose: how a layer opens, what a list shows, how a choice applies. The look comes from this document and the existing primitives. A page that reads as a copy of a reference is a failure, even when the reference was asked for.

## 12. The site, the catalogue and the kit

The maintainer's references are Tailwind Plus, Origin UI and Preline. What we take from them, and what we leave:

- **Taken**: a split hero (title on the left, a short paragraph and two actions on the right); the catalogue grouped by family (forms, overlays, navigation, data display, feedback, layout) behind one segmented switch for Components, Blocks and Templates; one tile per category with a drawn thumbnail, its name and its count; a docs layout with a left rail of families and categories with their counts; a templates gallery; an FAQ with the title on the left and grouped questions on the right; a footer made of category lists; "Suggest a component" at the end of a category.
- **Left out**: full-page guide lines, frames and rules running through sections, vertical section labels, bordered grid cells between previews, fake testimonials and pricing tiers. Sections and tiles are separated by space and surfaces only.
- **One unit per item**: a composition, block or template on a catalogue page is one unit in a soft tray (`bg-foreground/[0.025]`, `rounded-2xl`, no ring). Its header comes first (title, item name in mono, an outline Code button with its icon), the preview sits right under it on a card stage. A caption under a floating preview leaves people unsure which component it names, so it is not used.
- **Width follows the kind, nothing is cut**: small controls take a third of the row, accordions, alerts, notices and single calendars a half, navbars, tables, banners, horizontal steppers and multi-month calendars the full row (`app/components/_catalog/preview-widths.ts`). A tile never hides overflow.
- **Our own**: thumbnails are drawn with our materials (`chip-3d`, `keycap-3d`, `gem-plate`, `surface-raised`) and the brand hue, never grey wireframes; previews sit on cards with generous space between them; the hero illustration is made of live Ndeko components that move continuously (a marquee of chips, a menu that opens and closes, a segmented thumb that slides), never a static screenshot.

## 13. Nothing that looks machine-made

Every element is chosen, never left there by default. The maintainer's checklist of what makes a site read as generated applies to the site, the blocks and the templates. Its design and copy signs, and what we do instead:

- **Colour**: no gradient from one hue to another on a surface, a button, text or a logo; no glow, coloured shadow, orb, blurred blob, dot grid or neon. A colour means something (the primary action, a status, a series), so a row of chips in five hues that mean nothing becomes neutral chips. The page is the tinted `--background`, never pure white.
- **Layout**: no three feature cards with an icon on top, three pricing tiers, bento grid, fake terminal window or decorative band by reflex. When a section has three equal items, ask whether it has three things to say. A product with one offer shows one offer.
- **Icons**: no sparkle for anything, no emoji as an icon, no green check before every benefit. One icon set, the icon module.
- **Motion**: no bouncing arrow inviting a scroll, no animation on a hover over something that cannot be clicked. Ambient motion (marquee, float) stays on marketing surfaces, as section 7 says. The scroll-driven motion components (scroll text, stacking cards, sticky and horizontal scroll, scroll reveals, smooth scroll) are opt-in pieces for marketing pages: the site's own pages and the application blocks do not reveal content on scroll, and every scroll piece shows its final state under reduced motion.
- **Type**: the system UI stack, chosen because components inherit the font of the app they land in. No display face nobody chose, no uppercase tracked labels, no italic for emphasis.
- **Copy**: a headline says what this library does with its own nouns, so it would not fit another product; no exclamation marks; no full stop on labels, buttons and short captions; no hype words (supercharge, seamless, unlock, magic, effortless, powerful).
- **Proof**: no testimonial, user count, star rating or company logo that is not real. A demo shows a live component, never a static screenshot.
- **Logo**: the mark plus the name, never the name alone.

Before handing a page over, read it against this list and say what was corrected.
