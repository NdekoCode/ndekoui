import fs from 'node:fs';
import path from 'node:path';

/*
 * Tells the IndexNow search engines (Bing, Yandex, Naver, Seznam, Yep) which pages the site has,
 * right after a deployment, instead of waiting for their crawlers. Run it once the deployment is
 * live: the engines check the key file on the live site before they accept the list.
 */

const SITE_URL = 'https://ui.ndekocode.dev';

const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const KEY_FILE_PATTERN = /^[0-9a-f]{32}\.txt$/;

const LOC_PATTERN = /<loc>([^<]+)<\/loc>/g;

function keyOf() {
  const publicDir = path.join(process.cwd(), 'public');
  const keyFile = fs
    .readdirSync(publicDir)
    .find((name) => KEY_FILE_PATTERN.test(name));
  if (!keyFile) {
    throw new Error('No IndexNow key file in public/');
  }
  return path.basename(keyFile, '.txt');
}

async function sitemapUrls() {
  const response = await fetch(SITEMAP_URL);
  if (!response.ok) {
    throw new Error(`The sitemap answered ${response.status}`);
  }
  const xml = await response.text();
  const matches = [...xml.matchAll(LOC_PATTERN)];
  return matches.map((match) => match[1]);
}

async function submit() {
  const key = keyOf();
  const urlList = await sitemapUrls();
  const host = new URL(SITE_URL).host;
  const body = {
    host,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList,
  };
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(
    `IndexNow answered ${response.status} for ${urlList.length} pages`
  );
  if (!response.ok) {
    const details = await response.text();
    console.log(details);
    process.exitCode = 1;
  }
}

submit().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
