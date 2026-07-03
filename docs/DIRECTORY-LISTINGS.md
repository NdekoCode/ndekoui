# Directory listings

Where ndekoui is listed, so search engines, developers and AI tools can find it. Each listing is sent from the maintainer's own accounts.

## Status

| Directory                                          | How                                                                                                                                          | Status                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| shadcn registry directory (`@ndeko`)               | [shadcn-ui/ui#12625](https://github.com/shadcn-ui/ui/pull/12625)                                                                             | Open, commit signed                                                |
| awesome-shadcn-ui                                  | [birobirobiro/awesome-shadcn-ui#742](https://github.com/birobirobiro/awesome-shadcn-ui/pull/742)                                             | Open                                                               |
| Official MCP Registry (`dev.ndekocode.ui/ndekoui`) | `mcp-publisher` with the HTTP key at `/.well-known/mcp-registry-auth`                                                                        | Published 2026-11-06, version 1.0.0                                |
| Glama                                              | Picked up from the official registry                                                                                                         | [Listed](https://glama.ai/mcp/connectors/dev.ndekocode.ui/ndekoui) |
| awesome-remote-mcp-servers                         | [punkpeye/awesome-remote-mcp-servers#4055](https://github.com/punkpeye/awesome-remote-mcp-servers/pull/4055)                                 | Open, submission check passed                                      |
| mcp.so                                             | Free: an issue on `chatmcp/mcpso` (`~/.cache/ndekoui-listings/mcpso-submit.sh`). The form at mcp.so/submit is a paid, featured listing ($39) | Ready to send                                                      |
| Smithery                                           | Closed to new servers since 31 October 2026, curated only                                                                                    | Not possible                                                       |

The scripts that sent them are in `~/.cache/ndekoui-listings` (`submit-listings.sh`, `next-listings.sh`, `mcpso-submit.sh`).

## shadcn registry directory

Entry added at the end of `apps/v4/registry/directory.json`. It follows the schema in `apps/v4/lib/registry-directory.ts`; run `pnpm validate:registries` in a full checkout to confirm before review.

```json
{
  "name": "@ndeko",
  "homepage": "https://ui.ndekocode.dev",
  "url": "https://ui.ndekocode.dev/r/{name}.json",
  "description": "React components, blocks and templates that animate every change of state, built on Base UI, motion and Tailwind CSS 4, with an MCP server.",
  "author": "ndekocode",
  "logo": "the folded N in one colour, see the prepared branch"
}
```

Once merged, `npx shadcn@latest add @ndeko/<item>` works without a `components.json` entry.

## Official MCP Registry

`server.json` at the root of this repository describes the remote server. The public key is served at `https://ui.ndekocode.dev/.well-known/mcp-registry-auth`; the private key stays on the maintainer's machine in `~/.config/ndekoui/mcp-registry-key.pem` and is never committed.

To publish a change, raise `version` in `server.json`, then:

```bash
PRIVATE_KEY="$(openssl pkey -in ~/.config/ndekoui/mcp-registry-key.pem -noout -text | grep -A3 'priv:' | tail -n +2 | tr -d ' :\n')"
mcp-publisher login http --domain ui.ndekocode.dev --private-key "$PRIVATE_KEY"
mcp-publisher publish
```

`openssl` must be OpenSSL 3 (`/opt/homebrew/opt/openssl@3/bin/openssl` on macOS).

## awesome-remote-mcp-servers

Under Developer Tools, in alphabetical order, once Glama lists the connector. Check the badge path against the connector page before sending.

```markdown
- [ndekoui](https://ui.ndekocode.dev) `https://ui.ndekocode.dev/mcp`
  [![ndekoui MCP connector](https://glama.ai/mcp/connectors/dev.ndekocode.ui/ndekoui/badges/score.svg)](https://glama.ai/mcp/connectors/dev.ndekocode.ui/ndekoui)
  🔓 - Search, read and install open-source React components, blocks and templates with the shadcn CLI.
```

## mcp.so

The free route is an issue on `chatmcp/mcpso` titled `Submit Remote MCP Server: ndekoui (dev.ndekocode.ui/ndekoui)`, with the body in `~/.cache/ndekoui-listings/mcpso-issue.md`. The form at mcp.so/submit only offers a paid listing ($39: no review, verified badge, featured placement, dofollow link).

## After each deployment

Run `pnpm indexnow` so Bing, Yandex, Naver, Seznam and Yep learn about new and changed pages.
