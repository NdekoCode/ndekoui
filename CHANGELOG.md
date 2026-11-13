# Changelog

Every release of ndekoui. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The counts of a release are the ones it shipped with; the current counts are in the [README](README.md).

## [1.0.0] - 2026-11-17

The first public release.

### What the library contains

- **842 component variants across 49 families**, numbered inside each family (`button-01` to `button-66`): inputs, selects, date pickers, tables, charts, notifications, comments, agents, prompts and more.
- **75 motion effects**: text effects, scroll animations, marquees, device frames and more.
- **150 blocks**: whole sections of a product, from app shells, boards and dashboards to settings, pricing, heroes and agent operations.
- **21 templates**: complete pages in 14 kinds, from sign in and settings to dashboards, agent workspaces and docs.
- **90 primitives** on Base UI, each with its code and its install command at [/kit](https://ui.ndekocode.dev/kit).
- **9 colour themes** on top of the base theme, measured for contrast in light and dark, and a generator that writes a theme from a hue.
- 13 hooks and 14 helper libraries, installed with the items that use them.

Everything is MIT licensed, built on Base UI, motion and Tailwind CSS 4, and animates its changes of state.

### Install

- `npx shadcn@latest add @ndeko/<name>` installs any item: shadcn lists `@ndeko` in its registry directory, so `components.json` needs no entry.
- `npx shadcn@latest add https://ui.ndekocode.dev/r/<name>.json` does the same with an older shadcn CLI.
- The MCP server at `https://ui.ndekocode.dev/mcp` lets Claude, Codex, Cursor and other editors search the catalogue, read an item and install it.

### Added

- Every count on the site, in llms.txt and in the README comes from the registry index, so they always agree. `pnpm stats:readme` rewrites the README counts and `pnpm stats:about` prints the GitHub About line.
- The site wraps every page in `MotionConfig reducedMotion='user'`, and the installation page shows how to do the same in an app.
- Every catalogue page and every full-page preview has its own share card for LinkedIn and X.
- The footer names the author, Arick Bulakali, with links to his profiles.
