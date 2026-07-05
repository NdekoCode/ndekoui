export type LineKind = 'same' | 'added' | 'removed';

export type DiffLine = {
  key: string;
  kind: LineKind;
  text: string;
  oldNumber: number | null;
  newNumber: number | null;
};

export type WordPiece = {
  text: string;
  isChanged: boolean;
};

export type DiffBlock =
  | { kind: 'hunk'; key: string; lines: DiffLine[] }
  | { kind: 'fold'; key: string; lines: DiffLine[] };

const SPACE_RUN = /(\s+)/;

function emptyTable(rows: number, columns: number) {
  const table: number[][] = [];
  for (let row = 0; row <= rows; row += 1) {
    const width = columns + 1;
    const cells = Array.from({ length: width }, () => 0);
    table.push(cells);
  }
  return table;
}

/** Lengths of the longest common runs from each pair of positions to the end. */
function commonLengths(before: readonly string[], after: readonly string[]) {
  const table = emptyTable(before.length, after.length);
  for (let row = before.length - 1; row >= 0; row -= 1) {
    for (let column = after.length - 1; column >= 0; column -= 1) {
      const isSame = before[row] === after[column];
      if (isSame) {
        const diagonal = table[row + 1][column + 1];
        table[row][column] = diagonal + 1;
        continue;
      }
      const below = table[row + 1][column];
      const right = table[row][column + 1];
      table[row][column] = Math.max(below, right);
    }
  }
  return table;
}

type Step = 'same' | 'remove' | 'add';

function stepsOf(before: readonly string[], after: readonly string[]) {
  const table = commonLengths(before, after);
  const steps: Step[] = [];
  let row = 0;
  let column = 0;
  while (row < before.length && column < after.length) {
    const isSame = before[row] === after[column];
    if (isSame) {
      steps.push('same');
      row += 1;
      column += 1;
      continue;
    }
    const keptByRemoving = table[row + 1][column];
    const keptByAdding = table[row][column + 1];
    const removesFirst = keptByRemoving >= keptByAdding;
    if (removesFirst) {
      steps.push('remove');
      row += 1;
      continue;
    }
    steps.push('add');
    column += 1;
  }
  while (row < before.length) {
    steps.push('remove');
    row += 1;
  }
  while (column < after.length) {
    steps.push('add');
    column += 1;
  }
  return steps;
}

export function lineDiffOf(before: string[], after: string[]): DiffLine[] {
  const steps = stepsOf(before, after);
  const lines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  for (const step of steps) {
    const oldNumber = oldIndex + 1;
    const newNumber = newIndex + 1;
    if (step === 'same') {
      lines.push({
        key: `s${oldNumber}-${newNumber}`,
        kind: 'same',
        text: after[newIndex],
        oldNumber,
        newNumber,
      });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }
    if (step === 'remove') {
      lines.push({
        key: `r${oldNumber}`,
        kind: 'removed',
        text: before[oldIndex],
        oldNumber,
        newNumber: null,
      });
      oldIndex += 1;
      continue;
    }
    lines.push({
      key: `a${newNumber}`,
      kind: 'added',
      text: after[newIndex],
      oldNumber: null,
      newNumber,
    });
    newIndex += 1;
  }
  return lines;
}

function tokensOf(text: string) {
  const parts = text.split(SPACE_RUN);
  return parts.filter((part) => part !== '');
}

function pushPiece(pieces: WordPiece[], text: string, isChanged: boolean) {
  const last = pieces[pieces.length - 1];
  const extendsLast = last !== undefined && last.isChanged === isChanged;
  if (extendsLast) {
    last.text += text;
    return;
  }
  pieces.push({ text, isChanged });
}

export function wordDiffOf(before: string, after: string) {
  const beforeTokens = tokensOf(before);
  const afterTokens = tokensOf(after);
  const steps = stepsOf(beforeTokens, afterTokens);
  const beforePieces: WordPiece[] = [];
  const afterPieces: WordPiece[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  for (const step of steps) {
    if (step === 'same') {
      pushPiece(beforePieces, beforeTokens[oldIndex], false);
      pushPiece(afterPieces, afterTokens[newIndex], false);
      oldIndex += 1;
      newIndex += 1;
      continue;
    }
    if (step === 'remove') {
      pushPiece(beforePieces, beforeTokens[oldIndex], true);
      oldIndex += 1;
      continue;
    }
    pushPiece(afterPieces, afterTokens[newIndex], true);
    newIndex += 1;
  }
  return { before: beforePieces, after: afterPieces };
}

/** Pairs each removed line with the added line in the same position of its change, both ways. */
export function partnersOf(lines: DiffLine[]) {
  const partners = new Map<string, DiffLine>();
  let removed: DiffLine[] = [];
  let added: DiffLine[] = [];

  function settle() {
    const count = Math.min(removed.length, added.length);
    for (let index = 0; index < count; index += 1) {
      partners.set(removed[index].key, added[index]);
      partners.set(added[index].key, removed[index]);
    }
    removed = [];
    added = [];
  }

  for (const line of lines) {
    if (line.kind === 'same') {
      settle();
      continue;
    }
    if (line.kind === 'removed') {
      const isNewChange = added.length > 0;
      if (isNewChange) {
        settle();
      }
      removed.push(line);
      continue;
    }
    added.push(line);
  }
  settle();
  return partners;
}

function nearChangeOf(lines: DiffLine[], context: number) {
  const isNear = lines.map(() => false);
  lines.forEach((line, index) => {
    if (line.kind === 'same') {
      return;
    }
    const first = Math.max(0, index - context);
    const last = Math.min(lines.length - 1, index + context);
    for (let near = first; near <= last; near += 1) {
      isNear[near] = true;
    }
  });
  return isNear;
}

/**
 * Changed lines with `context` lines around them become hunks; the unchanged runs between them fold,
 * unless they are shorter than `minFold`, which would hide less than the button that replaces them.
 */
export function blocksOf(
  lines: DiffLine[],
  context: number,
  minFold: number
): DiffBlock[] {
  const isNear = nearChangeOf(lines, context);
  const blocks: DiffBlock[] = [];
  let run: DiffLine[] = [];
  let runIsNear = true;

  function appendHunk(key: string) {
    const previous = blocks.at(-1);
    if (previous?.kind === 'hunk') {
      previous.lines.push(...run);
      return;
    }
    blocks.push({ kind: 'hunk', key, lines: run });
  }

  function closeRun() {
    if (run.length === 0) {
      return;
    }
    const key = run[0].key;
    const isShortRun = run.length < minFold;
    const isHunk = runIsNear || isShortRun;
    if (isHunk) {
      appendHunk(key);
    }
    if (!isHunk) {
      blocks.push({ kind: 'fold', key, lines: run });
    }
    run = [];
  }

  lines.forEach((line, index) => {
    const lineIsNear = isNear[index];
    if (lineIsNear !== runIsNear) {
      closeRun();
      runIsNear = lineIsNear;
    }
    run.push(line);
  });
  closeRun();
  return blocks;
}

function firstNumberOf(numbers: (number | null)[]) {
  const found = numbers.find((number) => number !== null);
  return found ?? 0;
}

function countOfKind(lines: DiffLine[], kinds: LineKind[]) {
  const matching = lines.filter((line) => kinds.includes(line.kind));
  return matching.length;
}

/** "@@ -12,4 +12,6 @@": where the hunk starts in each version and how many lines it covers there. */
export function hunkHeaderOf(lines: DiffLine[]) {
  const oldNumbers = lines.map((line) => line.oldNumber);
  const newNumbers = lines.map((line) => line.newNumber);
  const oldStart = firstNumberOf(oldNumbers);
  const newStart = firstNumberOf(newNumbers);
  const oldCount = countOfKind(lines, ['same', 'removed']);
  const newCount = countOfKind(lines, ['same', 'added']);
  return `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`;
}

export function changeCountsOf(lines: DiffLine[]) {
  const additions = countOfKind(lines, ['added']);
  const deletions = countOfKind(lines, ['removed']);
  return { additions, deletions };
}
