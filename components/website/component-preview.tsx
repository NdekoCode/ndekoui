'use client';
import { Fragment, useState } from 'react';

import { cn } from '@/lib/utils';

import { OpenInMenu } from '@/app/_site/open-in/open-in-menu';
import { ReplayButton } from '@/app/_site/replay-button';
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
        'group @container/tile-header flex min-h-[350px] w-full items-center justify-center rounded-xl p-4 sm:p-6',
        className
      )}
    >
      <div className='absolute top-3 right-3 z-10'>
        <div className='flex items-center gap-1'>
          {motionItem && (
            <OpenInMenu title={motionItem.title} itemName={motionItem.name} />
          )}
          {hasReTrigger && <ReplayButton onReplay={replay} />}
        </div>
      </div>
      <Fragment key={replayCount}>{component}</Fragment>
    </div>
  );
}
