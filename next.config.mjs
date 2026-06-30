import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // The MCP route reads the built registry and the design system from disk, and `public/` is not part of a function by default.
  outputFileTracingIncludes: {
    '/mcp': ['./public/r/**/*.json', './docs/DESIGN-SYSTEM.md'],
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});

export default withMDX(nextConfig);
