import {
  bundledLanguages,
  createHighlighter,
  type Highlighter,
  type ShikiTransformer,
} from 'shiki/bundle/web';
import { noir } from './custom-theme';

let highlighter: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter() {
  if (!highlighter && !highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [noir],
      langs: Object.keys(bundledLanguages),
    });
    highlighter = await highlighterPromise;
  } else if (highlighterPromise && !highlighter) {
    highlighter = await highlighterPromise;
  }
  return highlighter!;
}

export const codeToHtml = async ({
  code,
  lang,
  transformers,
}: {
  code: string;
  lang: string;
  transformers?: ShikiTransformer[];
}) => {
  const shiki = await getHighlighter();

  return shiki.codeToHtml(code, {
    lang: lang,
    theme: 'noir',
    transformers,
  });
};
