import { z } from 'zod';

import {
  promptSummaryOf,
  type PromptName,
} from '@/app/mcp/_shared/tool-catalogue';

import type { McpServer } from './server-types';

const buildPageInput = z.object({
  page: z
    .string()
    .min(1)
    .max(500)
    .describe(
      'What the page is for, such as "pricing page for a time tracker" or "settings for a team workspace"'
    ),
});

const rebuildScreenInput = z.object({
  screen: z
    .string()
    .min(1)
    .max(500)
    .describe('The screen to rebuild: a file path or a short description'),
});

function promptConfigOf(name: PromptName) {
  const summary = promptSummaryOf(name);
  return { title: summary.title, description: summary.description };
}

function userMessage(text: string) {
  return {
    messages: [
      {
        role: 'user' as const,
        content: { type: 'text' as const, text },
      },
    ],
  };
}

function buildPage({ page }: z.infer<typeof buildPageInput>) {
  const steps = [
    `Build this page with Ndeko UI: ${page}.`,
    '',
    '1. Call get_design_guidelines once and follow its rules for everything you write around the installed pieces.',
    '2. Call list_categories, then search_items for each section the page needs. Prefer a block or a template over assembling components by hand.',
    '3. Read each candidate with get_item and open its previewUrl or fullPageUrl if you can, to pick the one that fits.',
    '4. Install everything in one command from get_install_command, using the package manager of this project. If the project has no components.json, run the init command first.',
    "5. Compose the page from the installed files. Replace the sample data with this project's data, keep the installed files as they are, and keep loading, empty and error states.",
    '6. List what you installed and what you wrote yourself.',
  ];
  const text = steps.join('\n');
  return userMessage(text);
}

function rebuildScreen({ screen }: z.infer<typeof rebuildScreenInput>) {
  const steps = [
    `Rebuild this screen with Ndeko UI: ${screen}.`,
    '',
    '1. Read the screen and list its parts: layout, controls, lists, overlays, feedback.',
    '2. Call get_design_guidelines, then search_items for each part to find the matching primitive, component or block.',
    '3. Install the matches with the command from get_install_command.',
    '4. Swap each hand-made part for its Ndeko UI piece. Keep the data, the handlers and the behaviour of the screen; change only how it is drawn.',
    '5. Remove the styles the swap made unused, and list every part you replaced and every part you kept.',
  ];
  const text = steps.join('\n');
  return userMessage(text);
}

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    'build_page',
    { ...promptConfigOf('build_page'), argsSchema: buildPageInput },
    buildPage
  );
  server.registerPrompt(
    'rebuild_screen',
    { ...promptConfigOf('rebuild_screen'), argsSchema: rebuildScreenInput },
    rebuildScreen
  );
}
