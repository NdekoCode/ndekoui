'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { motion, Transition } from 'motion/react';

const INDICATOR_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 26.7,
  damping: 4.1,
  mass: 0.2,
};

const INSTANT: Transition = {
  duration: 0,
};

function indicatorTransitionOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return INSTANT;
  }
  return INDICATOR_TRANSITION;
}

const Tabs = TabsPrimitive.Root;

const TabsContext = React.createContext<string>('');

const TabsRoot = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(function TabsRoot({ ...props }, ref) {
  const uniqueId = React.useId();
  return (
    <TabsContext.Provider value={uniqueId}>
      <Tabs ref={ref} {...props} />
    </TabsContext.Provider>
  );
});

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'hairline-b border-border text-foreground inline-flex h-10 w-full items-center justify-start bg-transparent',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    classNameIndicator?: string;
  }
>(({ className, children, classNameIndicator, ...props }, ref) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = React.useState(false);
  const tabsId = React.useContext(TabsContext);
  const prefersReducedMotion = usePrefersReducedMotion();

  const setTriggerRef = React.useCallback(
    (element: HTMLButtonElement | null) => {
      triggerRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
        return;
      }
      if (ref) {
        ref.current = element;
      }
    },
    [ref]
  );

  React.useEffect(() => {
    const element = triggerRef.current;
    if (element) {
      setIsActive(element.dataset.state === 'active');

      const observer = new MutationObserver(() => {
        setIsActive(element.dataset.state === 'active');
      });

      observer.observe(element, { attributes: true });

      return () => observer.disconnect();
    }
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={setTriggerRef}
      className={cn(
        'ring-offset-background focus-visible:ring-ring group text-muted-foreground hover:text-foreground data-[state=active]:text-foreground relative inline-flex h-10 items-center justify-center rounded-none bg-transparent px-4 py-1 pt-2 pb-3 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layout
          className='absolute bottom-0 flex h-0.5 w-full justify-center'
          transition={indicatorTransitionOf(prefersReducedMotion)}
          layoutId={`underline-${tabsId}`}
        >
          <div
            className={cn(
              'bg-foreground h-0.5 w-4/5 rounded-full',
              classNameIndicator
            )}
          />
        </motion.div>
      )}
      {children}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:ring-ring ring-offset-background relative mt-3 rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent };
