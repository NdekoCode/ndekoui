import {
  Source,
  SourceContent,
  SourceTrigger,
} from '@/registry/ndeko/ui/chat-source';

import { sources } from './data';

export function ReplySources() {
  return (
    <div className='space-y-2'>
      <p className='text-muted-foreground text-xs font-medium'>Sources</p>
      <ul className='flex flex-wrap gap-1.5'>
        {sources.map((source) => (
          <li key={source.href}>
            <Source href={source.href}>
              <SourceTrigger label={source.title} showMark />
              <SourceContent
                title={source.title}
                description={source.description}
              />
            </Source>
          </li>
        ))}
      </ul>
    </div>
  );
}
