'use client';

import { useState } from 'react';

import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

type FrameWidth = 'desktop' | 'tablet' | 'phone';

const WIDTH_CLASS: Record<FrameWidth, string> = {
  desktop: 'w-full',
  tablet: 'w-[48rem] max-w-full',
  phone: 'w-[23.4375rem] max-w-full',
};

const DEFAULT_HEIGHT = 560;

type BundleFrameProps = {
  src: string;
  title: string;
  height?: number;
  heading?: React.ReactNode;
  actions?: React.ReactNode;
};

function isFrameWidth(value: unknown): value is FrameWidth {
  const isDesktop = value === 'desktop';
  const isTablet = value === 'tablet';
  const isPhone = value === 'phone';
  return isDesktop || isTablet || isPhone;
}

export function BundleFrame({
  src,
  title,
  height = DEFAULT_HEIGHT,
  heading,
  actions,
}: BundleFrameProps) {
  const [width, setWidth] = useState<FrameWidth>('desktop');
  const frameStyle = { height } as React.CSSProperties;

  function changeWidth(value: unknown) {
    if (isFrameWidth(value)) {
      setWidth(value);
    }
  }

  return (
    <div className='bg-foreground/[0.025] flex flex-col gap-1.5 rounded-2xl p-1.5'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 py-1.5 ps-3 pe-0.5'>
        <div className='min-w-0 flex-1 basis-60'>{heading}</div>
        <Tabs value={width} onValueChange={changeWidth}>
          <TabsList
            variant='segmented'
            aria-label={`Preview width of ${title}`}
          >
            <TabsTab value='desktop'>Desktop</TabsTab>
            <TabsTab value='tablet'>Tablet</TabsTab>
            <TabsTab value='phone'>Phone</TabsTab>
          </TabsList>
        </Tabs>
        <div className='flex items-center gap-1'>{actions}</div>
      </div>
      <div className='flex justify-center'>
        <div
          className={`${WIDTH_CLASS[width]} bg-background hairline-ring ring-border overflow-hidden rounded-[calc(var(--radius-2xl)-0.375rem)] shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[width] duration-300 ease-(--ease-out-quint)`}
        >
          <iframe
            src={src}
            title={title}
            loading='lazy'
            style={frameStyle}
            className='bg-background block w-full'
          />
        </div>
      </div>
    </div>
  );
}
