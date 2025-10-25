import './globals.css';

import { GeistMono } from 'geist/font/mono';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/website/theme-provider';

import type { Metadata } from 'next';
const inter = Inter({ subsets: ['latin'] });
const geistMono = GeistMono;

export const metadata: Metadata = {
  metadataBase: new URL('https://ui.ndeko.dev'),
  title: 'Ndeko UI - UI kit to make beautiful, animated interfaces, faster.',
  description:
    'Ndeko UI is an open-source UI kit to make beautiful, animated interfaces, faster. Built for React, Next.js, and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang='en' suppressHydrationWarning>
      {!isDev ? (
        <Script
          async
          src='https://analytics.umami.is/script.js'
          data-website-id='17e8fc96-321d-43a6-94e7-d571c4c66a04'
        />
      ) : null}
      <body
        className={`${inter.className} ${geistMono.variable} bg-white font-sans antialiased dark:bg-zinc-950`}
      >
        <ThemeProvider attribute='class'>
          <TooltipProvider>
            <div className='isolate min-h-screen'>{children}</div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
