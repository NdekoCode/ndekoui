import fs from 'node:fs';
import path from 'node:path';

import {
  aboutTextOf,
  CATALOG_STATS,
  componentCountPhraseOf,
  type CatalogStats,
} from '../lib/catalog-stats';

/*
 * The counts outside the site, read from registry.json like the site's own.
 *
 *   pnpm stats:readme          rewrites every count of README.md between its markers
 *   pnpm stats:readme --check  fails when README.md is out of date, and writes nothing
 *   pnpm stats:about           prints the line for the GitHub "About" field
 *
 * A count in README.md sits between `<!-- count:<name> -->` and `<!-- /count -->`, so the
 * sentence around it stays free to edit.
 */

const README_PATH = path.join(process.cwd(), 'README.md');

const COUNT_MARKER = /<!-- count:([a-z-]+) -->([\s\S]*?)<!-- \/count -->/g;

const CHECK_FLAG = '--check';

function countTextsOf(stats: CatalogStats) {
  return new Map<string, string>([
    ['components', componentCountPhraseOf(stats)],
    ['motion', String(stats.motionEffects)],
    ['blocks', String(stats.blocks)],
    ['templates', String(stats.templates)],
    ['template-kinds', String(stats.templateKinds)],
    ['primitives', String(stats.primitives)],
    ['themes', String(stats.themes)],
  ]);
}

type Rewrite = {
  text: string;
  markerCount: number;
  unknownNames: string[];
};

function rewriteCounts(text: string, counts: Map<string, string>): Rewrite {
  const unknownNames: string[] = [];
  let markerCount = 0;
  const rewritten = text.replace(COUNT_MARKER, (marker, name: string) => {
    markerCount += 1;
    const count = counts.get(name);
    if (count === undefined) {
      unknownNames.push(name);
      return marker;
    }
    return `<!-- count:${name} -->${count}<!-- /count -->`;
  });
  return { text: rewritten, markerCount, unknownNames };
}

function fail(message: string) {
  console.error(message);
  process.exitCode = 1;
}

function runReadme(isCheck: boolean) {
  const current = fs.readFileSync(README_PATH, 'utf8');
  const counts = countTextsOf(CATALOG_STATS);
  const rewrite = rewriteCounts(current, counts);
  const hasUnknownNames = rewrite.unknownNames.length > 0;
  if (hasUnknownNames) {
    const names = rewrite.unknownNames.join(', ');
    fail(`README.md asks for counts this script does not know: ${names}.`);
    return;
  }
  if (rewrite.markerCount === 0) {
    fail('README.md has no count markers.');
    return;
  }
  const isUpToDate = rewrite.text === current;
  if (isUpToDate) {
    console.log(`README.md: ${rewrite.markerCount} counts, all up to date.`);
    return;
  }
  if (isCheck) {
    fail('README.md counts are out of date. Run pnpm stats:readme.');
    return;
  }
  fs.writeFileSync(README_PATH, rewrite.text);
  console.log(`README.md: ${rewrite.markerCount} counts rewritten.`);
}

function runAbout() {
  console.log(aboutTextOf(CATALOG_STATS));
}

function main() {
  const [command, ...flags] = process.argv.slice(2);
  const isCheck = flags.includes(CHECK_FLAG);
  if (command === 'readme') {
    runReadme(isCheck);
    return;
  }
  if (command === 'about') {
    runAbout();
    return;
  }
  fail('Usage: catalog-stats.ts readme [--check] | about');
}

main();
