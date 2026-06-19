# Ndeko UI

Open-source primitives, components, blocks and templates for React, drawn on one design language and animated around what the user does. Built on [Base UI](https://base-ui.com), [motion](https://motion.dev) and [Tailwind CSS](https://tailwindcss.com), installable with the [shadcn CLI](https://ui.shadcn.com/docs/cli).

The library is being rebuilt. What exists today is listed below; what comes next is in [docs/ROADMAP.md](docs/ROADMAP.md).

## What is in it

- **Primitives**: 33 accessible building blocks (button, field, select, menu, dialog, sheet, tabs, slider...) on Base UI. Preview them at `/kit`.
- **Components**: compositions grouped by category, redrawn from the Origin UI catalogue on these primitives. Browse them at `/components`.
- **Motion**: the motion components inherited from Motion Primitives, documented at `/docs`.
- **Theme**: light and dark tokens, ink colours that pass AA, one-pixel hairlines and a few 3D materials, shipped as one registry item.

## Install a component

Every item is served at `https://ui.ndeko.dev/r/<name>.json`. In a project already set up for shadcn with Tailwind CSS 4:

```bash
npx shadcn@latest add https://ui.ndeko.dev/r/button.json
```

The theme, the `cn` helper and every inner dependency come with it. Imports are rewritten to your own aliases.

## Develop

```bash
pnpm install
pnpm dev              # the site on http://localhost:3000
pnpm typecheck
pnpm lint
pnpm registry:build   # registry.json, preview indexes and public/r
```

Node.js 24 and pnpm are required.

## Design system

The rules every item follows (tokens, lines, materials, motion, writing) are in [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Contributing

Read the [contributing guide](CONTRIBUTING.md) and the port checklist in the roadmap.

## Credits and licence

Ndeko UI is MIT licensed, see [LICENCE.md](LICENCE.md). It started from [Motion Primitives](https://github.com/ibelick/motion-primitives) by ibelick and redraws compositions from the MIT edition of [Origin UI](https://github.com/origin-space/originui); their notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
