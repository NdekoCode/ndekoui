'use client';

import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { type VariantProps } from 'class-variance-authority';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { createContext, useContext, useId } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  Toggle,
  type ToggleProps,
  toggleVariants,
} from '@/registry/ndeko/ui/toggle';

type ToggleGroupStyle = VariantProps<typeof toggleVariants>;

type ToggleVariant = ToggleGroupStyle['variant'];

const ToggleGroupStyleContext = createContext<ToggleGroupStyle>({
  variant: 'default',
  size: 'default',
});

type TravelSettings = {
  layoutId: string;
  indicatorClassName?: string;
};

const ToggleGroupTravelContext = createContext<TravelSettings | undefined>(
  undefined
);

const TRAVEL_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const NO_TRAVEL: Transition = { duration: 0 };

const INDICATOR =
  'pointer-events-none absolute inset-0 -z-10 rounded-[inherit]';

const DEFAULT_TINT = 'bg-foreground/[0.07]';

const OUTLINE_TINT = 'bg-foreground/[0.05] dark:bg-foreground/[0.09]';

const TRAVELLING_ITEM =
  'relative data-pressed:bg-transparent dark:data-pressed:bg-transparent';

function tintOf(variant: ToggleVariant) {
  if (variant === 'outline') {
    return OUTLINE_TINT;
  }
  return DEFAULT_TINT;
}

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return NO_TRAVEL;
  }
  return TRAVEL_SPRING;
}

function travelSettingsOf(
  shouldTravel: boolean,
  layoutId: string,
  indicatorClassName: string | undefined
): TravelSettings | undefined {
  if (shouldTravel) {
    return { layoutId, indicatorClassName };
  }
  return undefined;
}

type ToggleGroupProps = Omit<ToggleGroupPrimitive.Props, 'className'> &
  ToggleGroupStyle & {
    className?: string;
    /** Slides one shared indicator to the pressed item. For groups where one item is pressed at a time; ignored with `multiple`. */
    travel?: boolean;
    /** Classes of the travelling indicator, for a raised thumb instead of the flat tint. */
    indicatorClassName?: string;
  };

function ToggleGroup({
  className,
  variant = 'default',
  size = 'default',
  travel = false,
  indicatorClassName,
  multiple,
  children,
  ...props
}: ToggleGroupProps) {
  const indicatorId = useId();
  const isSinglePress = !multiple;
  const shouldTravel = travel && isSinglePress;
  const travelSettings = travelSettingsOf(
    shouldTravel,
    indicatorId,
    indicatorClassName
  );

  return (
    <ToggleGroupPrimitive
      data-slot='toggle-group'
      data-variant={variant}
      multiple={multiple}
      className={cn(
        'inline-flex w-fit items-center gap-0.5 data-[orientation=vertical]:flex-col',
        shouldTravel && 'isolate',
        className
      )}
      {...props}
    >
      <ToggleGroupStyleContext.Provider value={{ variant, size }}>
        <ToggleGroupTravelContext.Provider value={travelSettings}>
          {children}
        </ToggleGroupTravelContext.Provider>
      </ToggleGroupStyleContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function TravellingIndicator({
  settings,
  variant,
}: {
  settings: TravelSettings;
  variant: ToggleVariant;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      data-slot='toggle-group-indicator'
      layoutId={settings.layoutId}
      aria-hidden='true'
      transition={travelOf(shouldReduceMotion)}
      className={cn(INDICATOR, tintOf(variant), settings.indicatorClassName)}
    />
  );
}

function ToggleGroupItem({
  variant,
  size,
  className,
  render,
  ...props
}: ToggleProps) {
  const groupStyle = useContext(ToggleGroupStyleContext);
  const travelSettings = useContext(ToggleGroupTravelContext);
  const itemVariant = variant ?? groupStyle.variant;
  const itemSize = size ?? groupStyle.size;
  const hasOwnRender = render !== undefined;

  if (travelSettings === undefined || hasOwnRender) {
    return (
      <Toggle
        data-slot='toggle-group-item'
        variant={itemVariant}
        size={itemSize}
        className={className}
        render={render}
        {...props}
      />
    );
  }

  return (
    <Toggle
      data-slot='toggle-group-item'
      variant={itemVariant}
      size={itemSize}
      className={cn(TRAVELLING_ITEM, className)}
      render={(renderProps, state) => (
        <button {...renderProps}>
          {state.pressed && (
            <TravellingIndicator
              settings={travelSettings}
              variant={itemVariant}
            />
          )}
          {renderProps.children}
        </button>
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
