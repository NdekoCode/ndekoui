'use client';

import { usePathname } from 'next/navigation';

import { FullPageButton } from '@/app/_site/full-page-button';
import { sentenceOfSlug } from '@/lib/sentence-of-slug';

import { docsFullPagePathOf } from './docs-paths';

const DOCS_ROUTE = '/docs/';

/** The docs page an example sits on: the first segment after `/docs/`. */
function docsSlugOf(pathname: string | null) {
  if (!pathname) {
    return null;
  }
  const isDocsPage = pathname.startsWith(DOCS_ROUTE);
  if (!isDocsPage) {
    return null;
  }
  const [slug] = pathname.slice(DOCS_ROUTE.length).split('/');
  return slug;
}

function exampleOf(filePath: string) {
  const fileName = filePath.split('/').pop();
  if (!fileName) {
    return null;
  }
  return fileName.replace(/\.tsx$/, '');
}

type DocsFullPageButtonProps = {
  filePath: string;
};

/** Opens an example of a docs page alone in a new tab, from the end of its Preview and Code tabs. */
export function DocsFullPageButton({ filePath }: DocsFullPageButtonProps) {
  const pathname = usePathname();
  const slug = docsSlugOf(pathname);
  const example = exampleOf(filePath);
  if (!slug || !example) {
    return null;
  }
  const href = docsFullPagePathOf(slug, example);
  const title = sentenceOfSlug(example);

  return (
    <FullPageButton
      href={href}
      title={title}
      className='text-muted-foreground'
    />
  );
}
