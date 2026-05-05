import type { MetadataRoute } from 'next';

const SITE_URL = 'https://ui.ndeko.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/view/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
