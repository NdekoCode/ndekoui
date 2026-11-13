import { installCommandOf, itemUrlOf, urlInstallCommandOf } from '@/lib/site';

/** The request an AI builder receives: the exact install command, then what the project needs so nothing breaks. */
export function promptOf(title: string, itemName: string) {
  const installCommand = installCommandOf(itemName);
  const urlInstallCommand = urlInstallCommandOf(itemName);
  const lines = [
    `Add "${title}" from ndekoui to this project.`,
    '',
    `Run: ${installCommand}`,
    `If the shadcn CLI does not know @ndeko, run: ${urlInstallCommand}`,
    '',
    'The project needs React 19 and Tailwind CSS 4. If it has no components.json yet, run npx shadcn@latest init first and keep the defaults.',
    'The command installs the files, the ndekoui theme, the sample images and every piece they depend on. Keep the installed files as they are.',
    'Then render it on a page so I can see it.',
  ];
  return lines.join('\n');
}

export function v0LinkOf(itemName: string) {
  const itemUrl = itemUrlOf(itemName);
  return `https://v0.dev/chat/api/open?url=${encodeURIComponent(itemUrl)}`;
}

export function lovableLinkOf(prompt: string) {
  return `https://lovable.dev/#prompt=${encodeURIComponent(prompt)}`;
}

export function cursorLinkOf(prompt: string) {
  return `https://cursor.com/link/prompt?text=${encodeURIComponent(prompt)}`;
}

export function claudeLinkOf(prompt: string) {
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
}

export function chatGptLinkOf(prompt: string) {
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}
