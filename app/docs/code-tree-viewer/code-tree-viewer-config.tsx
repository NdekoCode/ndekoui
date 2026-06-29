import {
  CodeTreeViewer,
  type CodeTreeFile,
} from '@/components/core/code-tree-viewer';

const FILES: CodeTreeFile[] = [
  {
    path: 'config/tokens.css',
    code: `:root {
  --radius: 0.625rem;
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}`,
  },
  {
    path: 'config/site.json',
    code: `{
  "name": "Fernhill Studio",
  "locale": "en-GB",
  "contact": "hello@fernhill.example"
}`,
  },
  {
    path: 'scripts/release.sh',
    code: `#!/usr/bin/env sh
set -e

pnpm build
pnpm test
echo "Ready to publish"`,
  },
];

export function CodeTreeViewerConfig() {
  return (
    <CodeTreeViewer
      aria-label='Configuration files'
      files={FILES}
      showLineNumbers={false}
      className='w-full max-w-2xl md:h-72'
    />
  );
}
