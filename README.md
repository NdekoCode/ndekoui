# ndekoui

Open-source React components that animate every change of state. 685 components in 36 categories, 66 blocks, 10 templates and 72 primitives, built on [Base UI](https://base-ui.com), [motion](https://motion.dev) and [Tailwind CSS 4](https://tailwindcss.com), installed with the [shadcn CLI](https://ui.shadcn.com/docs/cli) or through an MCP server.

**Site and catalogue:** [ui.ndekocode.dev](https://ui.ndekocode.dev)

## What is in it

- **Primitives**: 72 accessible building blocks on Base UI (button, field, select, menu, dialog, sheet, tabs, slider, chat input...). Try them at [/kit](https://ui.ndekocode.dev/kit).
- **Components**: 685 compositions in 36 categories, from inputs and date pickers to notifications, comments and team lists. Browse them at [/components](https://ui.ndekocode.dev/components).
- **Blocks**: 66 whole sections of a product (app shells, boards, task lists, dashboards, billing, settings, pricing, heroes...). See them at [/blocks](https://ui.ndekocode.dev/blocks).
- **Templates**: 10 complete pages for applications and marketing sites, at [/templates](https://ui.ndekocode.dev/templates).
- **Motion**: text effects, scroll animations, marquees, device frames and more, documented at [/docs](https://ui.ndekocode.dev/docs).
- **Theme**: light and dark tokens, ink colours that pass AA, one-pixel hairlines and a few 3D materials, installed with every item.

## Install a component

Every item is a shadcn registry item. In a project set up with the shadcn CLI, React 19 and Tailwind CSS 4:

```bash
npx shadcn@latest add https://ui.ndekocode.dev/r/notification-28.json
```

The theme, the `cn` helper and every primitive the item uses come with it, and imports are rewritten to your own aliases.

To use the short form, declare the registry in `components.json`:

```json
{
  "registries": {
    "@ndeko": "https://ui.ndekocode.dev/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @ndeko/notification-28
```

## Use it from your editor

The MCP server at `https://ui.ndekocode.dev/mcp` lets Claude, Claude Code, Codex, Cursor, VS Code, Windsurf, Zed and other MCP clients search the catalogue, read the source of an item, get its install command and follow the design rules. Setup for each client: [ui.ndekocode.dev/mcp/connect](https://ui.ndekocode.dev/mcp/connect).

For language models, the catalogue is also described in [llms.txt](https://ui.ndekocode.dev/llms.txt) and, item by item, in [llms-full.txt](https://ui.ndekocode.dev/llms-full.txt). The registry index is at [r/registry.json](https://ui.ndekocode.dev/r/registry.json).

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

Read the [contributing guide](CONTRIBUTING.md) and the port checklist in [docs/ROADMAP.md](docs/ROADMAP.md).

## Credits and licence

ndekoui is MIT licensed, see [LICENCE.md](LICENCE.md). It started from [Motion Primitives](https://github.com/ibelick/motion-primitives) by ibelick and redraws compositions from the MIT edition of [Origin UI](https://github.com/origin-space/originui); their notices and those of the brand marks are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
