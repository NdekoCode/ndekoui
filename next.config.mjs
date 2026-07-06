import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import createMDX from '@next/mdx';

const TEMPLATES_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'registry/ndeko/templates'
);

// The templates used to sit in two groups, and these addresses are already published.
const FORMER_TEMPLATE_GROUPS = ['application', 'marketing'];

const VIEW_SUFFIXES = ['', '/present'];

function foldersIn(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const folders = entries.filter((entry) => entry.isDirectory());
  return folders.map((folder) => folder.name);
}

function formerGroupOf(templateName) {
  const prefix = templateName.split('-')[0];
  const isFormerGroup = FORMER_TEMPLATE_GROUPS.includes(prefix);
  if (isFormerGroup) {
    return prefix;
  }
  return null;
}

function redirectOf(source, destination) {
  return { source, destination, permanent: true };
}

function formerGroupRedirects() {
  return FORMER_TEMPLATE_GROUPS.map((group) =>
    redirectOf(`/templates/${group}`, '/templates')
  );
}

function movedViewRedirects(group, name) {
  const formerGroup = formerGroupOf(name);
  if (!formerGroup) {
    return [];
  }
  return VIEW_SUFFIXES.map((suffix) => {
    const source = `/view/templates/${formerGroup}/${name}${suffix}`;
    const destination = `/view/templates/${group}/${name}${suffix}`;
    return redirectOf(source, destination);
  });
}

function movedTemplateRedirects() {
  const redirects = formerGroupRedirects();
  for (const group of foldersIn(TEMPLATES_ROOT)) {
    const names = foldersIn(path.join(TEMPLATES_ROOT, group));
    for (const name of names) {
      redirects.push(...movedViewRedirects(group, name));
    }
  }
  return redirects;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // The MCP route reads the built registry and the design system from disk, and `public/` is not part of a function by default.
  outputFileTracingIncludes: {
    '/mcp': ['./public/r/**/*.json', './docs/DESIGN-SYSTEM.md'],
  },
  async redirects() {
    return movedTemplateRedirects();
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});

export default withMDX(nextConfig);
