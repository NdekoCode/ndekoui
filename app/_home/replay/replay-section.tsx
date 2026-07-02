import type { ShikiTransformer } from 'shiki';

import { codeToHtml } from '@/lib/shiki';

import { ProjectReplay } from './project-replay';
import {
  INSTALLED_FILE_HEAD,
  PAGE_ADDED_LINES,
  PAGE_AFTER,
  PAGE_BEFORE,
} from './replay-script';

function markAddedLines(lineNumbers: number[]): ShikiTransformer {
  return {
    line(node, line) {
      if (lineNumbers.includes(line)) {
        this.addClassToHast(node, 'is-added');
      }
    },
  };
}

/** The replay with its code coloured on the server, as the rest of the site's code. */
export async function ReplaySection() {
  const [installedFile, pageBefore, pageAfter] = await Promise.all([
    codeToHtml({ code: INSTALLED_FILE_HEAD, lang: 'tsx' }),
    codeToHtml({ code: PAGE_BEFORE, lang: 'tsx' }),
    codeToHtml({
      code: PAGE_AFTER,
      lang: 'tsx',
      transformers: [markAddedLines(PAGE_ADDED_LINES)],
    }),
  ]);

  return <ProjectReplay code={{ installedFile, pageBefore, pageAfter }} />;
}
