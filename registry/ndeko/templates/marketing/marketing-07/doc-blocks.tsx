'use client';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

import { Callout } from './callout';
import { CodeBlock } from './code-block';
import { InlineText } from './inline-text';
import { Install } from './install';
import type { Block, PageId, PageLink } from './pages';

type InstallProps = React.ComponentProps<typeof Install>;

function TableBlock({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] overflow-clip rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <Table>
        <TableHeader>
          <TableRow>
            {head.map((title) => (
              <TableHead key={title}>{title}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([name, meaning]) => (
            <TableRow key={name}>
              <TableCell className='px-3 py-2.5 font-mono text-xs whitespace-nowrap'>
                {name}
              </TableCell>
              <TableCell className='text-muted-foreground px-3 py-2.5'>
                {meaning}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type LinksBlockProps = {
  links: PageLink[];
  onOpenPage: (pageId: PageId) => void;
};

function LinksBlock({ links, onOpenPage }: LinksBlockProps) {
  return (
    <ul className='flex flex-col'>
      {links.map((link) => {
        function open(event: React.MouseEvent<HTMLAnchorElement>) {
          event.preventDefault();
          onOpenPage(link.pageId);
        }

        return (
          <li key={link.pageId}>
            <a
              href={`#${link.pageId}`}
              onClick={open}
              className={cn(
                'group text-primary-ink inline-flex items-center gap-1.5 rounded-sm py-1 text-[15px] font-medium underline-offset-4 hover:underline',
                FOCUS_RING
              )}
            >
              {link.label}
              <ArrowRightIcon className='size-4 transition-transform duration-100 group-hover:translate-x-0.5' />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

type BlockViewProps = {
  block: Block;
  install: InstallProps;
  onOpenPage: (pageId: PageId) => void;
};

function BlockView({ block, install, onOpenPage }: BlockViewProps) {
  switch (block.kind) {
    case 'text':
      return (
        <p className='text-[15px] leading-7 text-pretty'>
          <InlineText text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className='flex flex-col gap-2 text-[15px] leading-6'>
          {block.items.map((item) => (
            <li key={item} className='flex items-baseline gap-3'>
              <span
                aria-hidden='true'
                className='bg-foreground/30 size-1.5 shrink-0 translate-y-[-0.15em] rounded-full'
              />
              <span className='min-w-0'>
                <InlineText text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    case 'code':
      return <CodeBlock code={block.code} />;
    case 'callout':
      return (
        <Callout tone={block.tone}>
          <InlineText text={block.text} />
        </Callout>
      );
    case 'install':
      return <Install {...install} />;
    case 'table':
      return <TableBlock head={block.head} rows={block.rows} />;
    case 'links':
      return <LinksBlock links={block.links} onOpenPage={onOpenPage} />;
  }
}

type DocBlocksProps = {
  blocks: Block[];
  install: InstallProps;
  onOpenPage: (pageId: PageId) => void;
};

export function DocBlocks({ blocks, install, onOpenPage }: DocBlocksProps) {
  return (
    <>
      {blocks.map((block, index) => (
        <BlockView
          key={index}
          block={block}
          install={install}
          onOpenPage={onOpenPage}
        />
      ))}
    </>
  );
}
