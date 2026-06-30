import {
  DOCUMENTS,
  type ContentBlock,
  type LegalDocument,
  type LegalSection,
} from './data';

const WORDS_PER_MINUTE = 220;

/** A section becomes current once its heading passes this line, measured from the top of the window. */
const READING_LINE_PX = 120;

const BOTTOM_SLACK_PX = 4;

export function documentOf(id: string): LegalDocument {
  const match = DOCUMENTS.find((candidate) => candidate.id === id);
  if (match) {
    return match;
  }
  return DOCUMENTS[0];
}

export function isDocumentId(value: unknown): value is string {
  return DOCUMENTS.some((candidate) => candidate.id === value);
}

export function sectionDomIdOf(documentId: string, sectionId: string) {
  return `legal-01-${documentId}-${sectionId}`;
}

function wordsIn(text: string) {
  const words = text.split(/\s+/);
  const nonEmpty = words.filter(Boolean);
  return nonEmpty.length;
}

function blockWordsOf(block: ContentBlock) {
  if (block.kind === 'paragraph') {
    return wordsIn(block.text);
  }
  let count = 0;
  for (const item of block.items) {
    count += wordsIn(item.term);
    count += wordsIn(item.text);
  }
  return count;
}

export function readingTimeOf(legalDocument: LegalDocument) {
  let words = 0;
  for (const section of legalDocument.sections) {
    words += wordsIn(section.title);
    for (const block of section.blocks) {
      words += blockWordsOf(block);
    }
  }
  const minutes = Math.ceil(words / WORDS_PER_MINUTE);
  const shownMinutes = Math.max(minutes, 1);
  return `${shownMinutes} min read`;
}

function isScrolledToBottom() {
  const scrolled = window.innerHeight + window.scrollY;
  const pageHeight = document.documentElement.scrollHeight;
  return scrolled >= pageHeight - BOTTOM_SLACK_PX;
}

/** The last heading above the reading line, or the last section once the page cannot scroll further. */
export function currentSectionOf(documentId: string, sections: LegalSection[]) {
  const lastSection = sections[sections.length - 1];
  if (isScrolledToBottom()) {
    return lastSection.id;
  }
  let current = sections[0].id;
  for (const section of sections) {
    const domId = sectionDomIdOf(documentId, section.id);
    const heading = document.getElementById(domId);
    if (!heading) {
      continue;
    }
    const top = heading.getBoundingClientRect().top;
    if (top <= READING_LINE_PX) {
      current = section.id;
    }
  }
  return current;
}
