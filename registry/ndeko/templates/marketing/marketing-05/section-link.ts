const SECTION_HASH_PATTERN = /^#.+/;

export function sectionHashOf(href: string | null) {
  if (href === null) {
    return null;
  }
  const isSectionHash = SECTION_HASH_PATTERN.test(href);
  if (!isSectionHash) {
    return null;
  }
  return href;
}

export function scrollToSection(hash: string) {
  const id = hash.slice(1);
  const target = document.getElementById(id);
  target?.scrollIntoView();
}
