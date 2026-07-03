import './globals.css';

import Script from 'next/script';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/website/theme-provider';

import type { Metadata } from 'next';

import { searchVerificationOf, SITE_KEYWORDS } from '@/app/_site/seo';

export const metadata: Metadata = {
  metadataBase: new URL('https://ui.ndekocode.dev'),
  title: 'ndekoui',
  description:
    'Open-source primitives, components, blocks and templates for React and Tailwind CSS, installed with the shadcn CLI and animated around what people do.',
  applicationName: 'ndekoui',
  keywords: SITE_KEYWORDS,
  verification: searchVerificationOf(),
  authors: [{ name: 'ndekocode', url: 'https://ndekocode.dev' }],
  creator: 'ndekocode',
  openGraph: {
    siteName: 'ndekoui',
    type: 'website',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isProduction = process.env.NODE_ENV !== 'development';

  return (
    <html lang='en' suppressHydrationWarning>
      {isProduction && (
        <Script
          async
          src='https://analytics.umami.is/script.js'
          data-website-id='17e8fc96-321d-43a6-94e7-d571c4c66a04'
        />
      )}
      <body className='font-sans antialiased'>
        <ThemeProvider attribute='class' disableTransitionOnChange>
          <TooltipProvider>
            <div className='isolate min-h-screen'>{children}</div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
