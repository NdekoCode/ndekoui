'use client';
import { Fragment, useState } from 'react';

import { cn } from '@/lib/utils';
import { RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { OpenInMenu } from '@/app/_site/open-in/open-in-menu';
import { motionItemNameOf } from '@/lib/site';

type ComponentPreviewProps = {
  component: React.ReactElement;
  hasReTrigger?: boolean;
  className?: string;
  filePath?: string;
};

const DOCS_FOLDER = 'app/docs/';

/** The motion component a docs example belongs to: the folder of `app/docs/<slug>/<example>.tsx`. */
function motionSlugOf(filePath: string | undefined) {
  if (!filePath) {
    return null;
  }
  const isDocsExample = filePath.startsWith(DOCS_FOLDER);
  if (!isDocsExample) {
    return null;
  }
  const insideDocs = filePath.slice(DOCS_FOLDER.length);
  const [slug] = insideDocs.split('/');
  return slug;
}

function titleOfSlug(slug: string) {
  const sentence = slug.split('-').join(' ');
  const first = sentence.charAt(0).toUpperCase();
  return `${first}${sentence.slice(1)}`;
}

function motionItemOf(slug: string | null) {
  if (!slug) {
    return null;
  }
  return { name: motionItemNameOf(slug), title: titleOfSlug(slug) };
}

export default function ComponentPreview({
  component,
  hasReTrigger = false,
  className,
  filePath,
}: ComponentPreviewProps) {
  const [replayCount, setReplayCount] = useState(0);

  const motionSlug = motionSlugOf(filePath);
  const motionItem = motionItemOf(motionSlug);

  const replay = () => {
    setReplayCount((count) => count + 1);
  };

  return (
    <div
      className={cn(
        'group flex min-h-[350px] w-full items-center justify-center rounded-xl',
        className
      )}
    >
      <div className='absolute top-3 right-3 z-10'>
        <div className='flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'>
          {motionItem && (
            <OpenInMenu title={motionItem.title} itemName={motionItem.name} />
          )}
          {hasReTrigger && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='text-muted-foreground'
                    aria-label='Replay the animation'
                    onClick={replay}
                  />
                }
              >
                <RefreshCwIcon />
              </TooltipTrigger>
              <TooltipContent>Replay</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <Fragment key={replayCount}>{component}</Fragment>
    </div>
  );
}
