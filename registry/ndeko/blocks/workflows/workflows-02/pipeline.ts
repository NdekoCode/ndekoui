import {
  ANSWER_TEXT,
  ARTICLE_COUNT,
  EMBED_MODELS,
  nodeOf,
  NODES,
  PASSAGES,
  TOTAL_TOKENS,
  TYPE_WORD,
  type Link,
  type NodeId,
  type Params,
} from './data';

/** An input takes one wire, so a node has at most one source. An output may feed several nodes. */
export function sourceOf(links: Link[], id: NodeId) {
  const link = links.find((candidate) => candidate.to === id);
  return link?.from ?? null;
}

/** A node and every node its output reaches, in no particular order. */
export function downstreamOf(links: Link[], id: NodeId) {
  const reached: NodeId[] = [];
  const pending = [id];
  let current = pending.pop();
  while (current !== undefined) {
    if (!reached.includes(current)) {
      reached.push(current);
      const visited = current;
      const fed = links.filter((link) => link.from === visited);
      fed.forEach((link) => pending.push(link.to));
    }
    current = pending.pop();
  }
  return reached;
}

/**
 * Why the output of one node cannot feed another, said in one sentence, or null when it can. The
 * types of the two ports have to match, and a node never ends up fed by its own output.
 */
export function refusalOf(links: Link[], from: NodeId, to: NodeId) {
  const source = nodeOf(from);
  const target = nodeOf(to);
  if (from === to) {
    return `${source.title} cannot feed itself`;
  }
  if (target.input === null) {
    return `${target.title} takes no input`;
  }
  if (source.output !== target.input) {
    const wanted = TYPE_WORD[target.input];
    const given = TYPE_WORD[source.output];
    return `${target.title} takes ${wanted}. ${source.title} gives ${given}`;
  }
  if (downstreamOf(links, to).includes(from)) {
    return `That would feed ${source.title} its own output`;
  }
  return null;
}

export function missingInputOf(links: Link[], id: NodeId) {
  const node = nodeOf(id);
  const isFed = sourceOf(links, id) !== null;
  if (node.input === null || isFed) {
    return null;
  }
  return `${TYPE_WORD[node.input]} is not connected`;
}

/** Every node after the one that feeds it: the order a run follows. */
export function orderOf(links: Link[]) {
  const placed: NodeId[] = [];
  let waiting = NODES.map((node) => node.id);
  while (waiting.length > 0) {
    const ready = waiting.filter((id) => {
      const source = sourceOf(links, id);
      return source === null || placed.includes(source);
    });
    if (ready.length === 0) {
      return [...placed, ...waiting];
    }
    placed.push(...ready);
    waiting = waiting.filter((id) => !ready.includes(id));
  }
  return placed;
}

function settingOf(id: NodeId, params: Params) {
  if (id === 'split') {
    return String(params.chunkSize);
  }
  if (id === 'embed') {
    return params.model;
  }
  if (id === 'search') {
    return String(params.topK);
  }
  if (id === 'answer') {
    return params.prompt;
  }
  return '';
}

/**
 * What a node would compute now: its own setting and everything upstream of it. A node whose
 * signature has not changed since it last ran is served from its cache.
 */
export function signatureOf(links: Link[], params: Params, id: NodeId): string {
  const source = sourceOf(links, id);
  let upstream = '-';
  if (source !== null) {
    upstream = signatureOf(links, params, source);
  }
  return `${id}:${settingOf(id, params)}(${upstream})`;
}

/** How many items a node hands on: articles, chunks, vectors, passages, then one answer. */
function countOf(links: Link[], params: Params, id: NodeId): number {
  if (id === 'load') {
    return ARTICLE_COUNT;
  }
  if (id === 'split') {
    return Math.round(TOTAL_TOKENS / params.chunkSize);
  }
  if (id === 'answer') {
    return 1;
  }
  const source = sourceOf(links, id);
  let incoming = 0;
  if (source !== null) {
    incoming = countOf(links, params, source);
  }
  if (id === 'search') {
    return Math.min(params.topK, incoming);
  }
  return incoming;
}

function counted(count: number, word: string) {
  if (count === 1) {
    return `1 ${word}`;
  }
  return `${count} ${word}s`;
}

export type Result = {
  headline: string;
  lines: string[];
};

const SHOWN_PASSAGES = 2;

function dimensionsOf(params: Params) {
  const model = EMBED_MODELS.find(
    (candidate) => candidate.value === params.model
  );
  return model?.dimensions ?? 0;
}

/** The preview a node shows once it has run. The figures follow the settings and are illustrative. */
export function resultOf(links: Link[], params: Params, id: NodeId): Result {
  const count = countOf(links, params, id);
  if (id === 'load') {
    return {
      headline: counted(count, 'article'),
      lines: ['From the help center'],
    };
  }
  if (id === 'split') {
    return {
      headline: counted(count, 'chunk'),
      lines: [`About ${params.chunkSize} tokens each`],
    };
  }
  if (id === 'embed') {
    return {
      headline: counted(count, 'vector'),
      lines: [`${dimensionsOf(params)} dimensions`],
    };
  }
  if (id === 'search') {
    const shown = PASSAGES.slice(0, Math.min(count, SHOWN_PASSAGES));
    return {
      headline: counted(count, 'passage'),
      lines: shown.map((passage) => `${passage.title} · ${passage.score}`),
    };
  }
  const words = ANSWER_TEXT.split(' ');
  return { headline: counted(words.length, 'word'), lines: [ANSWER_TEXT] };
}
