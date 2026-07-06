export function docsFullPagePathOf(slug: string, example: string) {
  return `/view/docs/${slug}/${example}`;
}

export function docsAnchorPathOf(slug: string, anchor: string) {
  if (!anchor) {
    return `/docs/${slug}`;
  }
  return `/docs/${slug}#${anchor}`;
}
