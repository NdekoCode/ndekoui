# ndekoui

Open-source React components that animate every change of state. <!-- count:components -->842 component variants across 49 families<!-- /count -->, <!-- count:motion -->75<!-- /count --> motion effects, <!-- count:blocks -->150<!-- /count --> blocks, <!-- count:templates -->21<!-- /count --> templates and <!-- count:primitives -->90<!-- /count --> primitives, built on [Base UI](https://base-ui.com), [motion](https://motion.dev) and [Tailwind CSS 4](https://tailwindcss.com), installed with the [shadcn CLI](https://ui.shadcn.com/docs/cli) or through an MCP server.

**Site and catalogue:** [ui.ndekocode.dev](https://ui.ndekocode.dev)

## What is in it

- **Primitives**: <!-- count:primitives -->90<!-- /count --> accessible building blocks on Base UI (button, field, select, menu, dialog, sheet, tabs, slider, chat input...). Try them at [/kit](https://ui.ndekocode.dev/kit).
- **Components**: <!-- count:components -->842 component variants across 49 families<!-- /count -->, from inputs and date pickers to charts, text effects, notifications, comments and team lists. Browse them at [/components](https://ui.ndekocode.dev/components).
- **Blocks**: <!-- count:blocks -->150<!-- /count --> whole sections of a product (app shells, boards, task lists, dashboards, billing, settings, pricing, heroes, testimonials, team sections, blog, docs, help center, error pages, agent chats, agent reviews, agent operations, workflows, maps...). See them at [/blocks](https://ui.ndekocode.dev/blocks).
- **Templates**: <!-- count:templates -->21<!-- /count --> complete pages in <!-- count:template-kinds -->14<!-- /count --> kinds, from sign in and settings to dashboards, agent workspaces and docs, at [/templates](https://ui.ndekocode.dev/templates).
- **Motion**: <!-- count:motion -->75<!-- /count --> effects, from text effects and scroll animations to marquees, device frames and more, documented at [/docs](https://ui.ndekocode.dev/docs).
- **Theme**: light and dark tokens, ink colours that pass AA, one-pixel hairlines and a few 3D materials, installed with every item, plus <!-- count:themes -->9<!-- /count --> colour themes to pick from at [/themes](https://ui.ndekocode.dev/themes).

## Install a component

Every item is a shadcn registry item, listed in the shadcn registry directory as `@ndeko`. In a project set up with the shadcn CLI, React 19 and Tailwind CSS 4:

```bash
npx shadcn@latest add @ndeko/notification-28
```

The theme, the `cn` helper and every primitive the item uses come with it, and imports are rewritten to your own aliases. There is nothing to declare in `components.json`: the CLI adds the `@ndeko` entry itself the first time.

With an older shadcn CLI that does not read the registry directory, give it the full address of the item:

```bash
npx shadcn@latest add https://ui.ndekocode.dev/r/notification-28.json
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
pnpm stats:readme     # the counts in this README, from registry.json
```

Node.js 24 and pnpm are required.

## Design system

The rules every item follows (tokens, lines, materials, motion, writing) are in [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Contributing

Read the [contributing guide](CONTRIBUTING.md) and the port checklist in [docs/ROADMAP.md](docs/ROADMAP.md).

## Credits and licence

ndekoui is MIT licensed, see [LICENCE.md](LICENCE.md). Inspired by [Motion Primitives](https://github.com/ibelick/motion-primitives) by ibelick; the notices of the code and of the brand marks it carries are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
