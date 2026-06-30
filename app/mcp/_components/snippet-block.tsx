import { CopyButton } from '@/app/_site/copy-button';
import { codeToHtml } from '@/lib/shiki';

import type { SetupSnippet, SnippetLanguage } from './clients';

/** The site's highlighter loads the web bundle of Shiki, which has no TOML grammar. */
const HIGHLIGHT_LANGUAGES: Record<SnippetLanguage, string> = {
  bash: 'bash',
  json: 'json',
  toml: 'text',
};

/** The docs code surface, with the file or place the snippet belongs to above it. */
export async function SnippetBlock({ snippet }: { snippet: SetupSnippet }) {
  const lang = HIGHLIGHT_LANGUAGES[snippet.language];
  const html = await codeToHtml({ code: snippet.code, lang });
  return (
    <div className='dark bg-card text-card-foreground hairline-ring ring-border min-w-0 rounded-lg'>
      <div className='flex items-center gap-2 ps-3.5 pe-1 pt-1'>
        <p className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-[11px]'>
          {snippet.label}
        </p>
        <CopyButton value={snippet.code} label={`Copy ${snippet.label}`} />
      </div>
      <div className='overflow-x-auto px-3.5 pt-1 pb-3.5 font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent'>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
