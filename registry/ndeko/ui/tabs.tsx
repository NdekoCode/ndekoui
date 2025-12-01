'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

type TabsListVariant = 'underline' | 'segmented';

function Tabs({
  className,
  ...props
}: WithClassName<TabsPrimitive.Root.Props>) {
  return (
    <TabsPrimitive.Root
      data-slot='tabs'
      className={cn(
        'flex flex-col gap-3 data-[orientation=vertical]:flex-row',
        className
      )}
      {...props}
    />
  );
}

const LIST_CLASS: Record<TabsListVariant, string> = {
  underline: 'relative flex items-center gap-5 hairline-b border-border',
  segmented:
    'relative inline-flex w-fit items-center gap-0.5 rounded-lg bg-foreground/[0.05] p-0.5',
};

const INDICATOR_CLASS: Record<TabsListVariant, string> = {
  underline:
    'pointer-events-none absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-primary transition-[translate,width] duration-300 ease-(--ease-out-strong)',
  segmented:
    'pointer-events-none absolute left-0 top-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-md bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 transition-[translate,width,height] duration-200 ease-(--ease-out-strong) dark:bg-foreground/[0.09] dark:ring-foreground/15',
};

type TabsListProps = WithClassName<TabsPrimitive.List.Props> & {
  variant?: TabsListVariant;
};

function TabsList({
  className,
  variant = 'underline',
  children,
  ...props
}: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      data-variant={variant}
      className={cn('group/tabs-list', LIST_CLASS[variant], className)}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        data-slot='tabs-indicator'
        className={INDICATOR_CLASS[variant]}
      />
    </TabsPrimitive.List>
  );
}

const TAB_CLASS = [
  'relative z-10 inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-muted-foreground outline-none',
  'transition-colors duration-150 hover:text-foreground data-active:text-foreground',
  'focus-visible:ring-[3px] focus-visible:ring-ring/25 data-disabled:pointer-events-none data-disabled:opacity-50',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  'group-data-[variant=underline]/tabs-list:h-9 group-data-[variant=underline]/tabs-list:rounded-sm group-data-[variant=underline]/tabs-list:px-0.5',
  'group-data-[variant=segmented]/tabs-list:h-7 group-data-[variant=segmented]/tabs-list:rounded-md group-data-[variant=segmented]/tabs-list:px-3',
].join(' ');

function TabsTab({
  className,
  ...props
}: WithClassName<TabsPrimitive.Tab.Props>) {
  return (
    <TabsPrimitive.Tab
      data-slot='tabs-tab'
      className={cn(TAB_CLASS, className)}
      {...props}
    />
  );
}

function TabsPanel({
  className,
  ...props
}: WithClassName<TabsPrimitive.Panel.Props>) {
  return (
    <TabsPrimitive.Panel
      data-slot='tabs-panel'
      className={cn(
        'focus-visible:ring-ring/25 flex-1 rounded-md outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    />
  );
}

export {
  Tabs,
  TabsPanel as TabsContent,
  TabsList,
  TabsPanel,
  TabsTab,
  TabsTab as TabsTrigger,
  type TabsListVariant,
};
