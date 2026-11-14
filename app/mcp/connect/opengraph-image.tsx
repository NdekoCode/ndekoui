import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { TOOLS } from '@/app/mcp/_shared/tool-catalogue';
import { countLabel } from '@/lib/site';

export const alt =
  'The ndekoui MCP server: what it gives a coding agent and how many tools it has.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export default function McpShareImage() {
  const toolCount = countLabel(TOOLS.length, 'tool', 'tools');
  return shareCardOf({
    eyebrow: `MCP server · ${toolCount}`,
    title: 'Connect Claude, Cursor and Codex to ndekoui with MCP',
    description:
      'Your coding agent searches the catalogue, reads the source, installs pieces with the shadcn CLI and follows the design rules.',
  });
}
