'use client';

import { MaximizeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

type FullPageButtonProps = {
  href: string;
  title: string;
  className?: string;
};

/** Opens an item alone on a page of its own, in a new tab, where it can be shown or filmed. */
export function FullPageButton({
  href,
  title,
  className,
}: FullPageButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            nativeButton={false}
            className={className}
            aria-label={`Open ${title} full page in a new tab`}
            render={<a href={href} target='_blank' rel='noreferrer' />}
          />
        }
      >
        <MaximizeIcon />
      </TooltipTrigger>
      <TooltipContent>Open full page</TooltipContent>
    </Tooltip>
  );
}
