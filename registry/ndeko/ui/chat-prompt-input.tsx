// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { SendIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Textarea } from '@/registry/ndeko/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

type MaxHeight = number | string;

type PromptInputContextValue = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: MaxHeight;
  onSubmit?: () => void;
  disabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error('usePromptInput must be used within a PromptInput');
  }
  return context;
}

const INTERACTIVE_TARGET =
  'button, a, input, select, textarea, [role="button"], [role="option"]';

function isInteractiveTarget(target: EventTarget) {
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest(INTERACTIVE_TARGET) !== null;
}

type PromptInputProps = Omit<React.ComponentProps<'div'>, 'onSubmit'> & {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: MaxHeight;
  onSubmit?: () => void;
  disabled?: boolean;
};

function PromptInput({
  isLoading = false,
  value,
  onValueChange,
  maxHeight = 240,
  onSubmit,
  disabled = false,
  className,
  onClick,
  children,
  ...props
}: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value ?? '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isControlled = value !== undefined;
  const currentValue = value ?? internalValue;

  function setValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function focusTextarea(event: React.MouseEvent<HTMLDivElement>) {
    onClick?.(event);
    if (disabled) {
      return;
    }
    if (isInteractiveTarget(event.target)) {
      return;
    }
    textareaRef.current?.focus();
  }

  const context: PromptInputContextValue = {
    isLoading,
    value: currentValue,
    setValue,
    maxHeight,
    onSubmit,
    disabled,
    textareaRef,
  };

  return (
    <TooltipProvider>
      <PromptInputContext.Provider value={context}>
        <div
          data-slot='prompt-input'
          data-disabled={disabled || undefined}
          data-loading={isLoading || undefined}
          onClick={focusTextarea}
          className={cn(
            CONTROL_RECIPE,
            'cursor-text rounded-xl p-2',
            'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]',
            'data-disabled:cursor-not-allowed data-disabled:opacity-60',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  );
}

function maxHeightCssOf(maxHeight: MaxHeight, scrollHeight: number) {
  if (typeof maxHeight === 'number') {
    const height = Math.min(scrollHeight, maxHeight);
    return `${height}px`;
  }
  return `min(${scrollHeight}px, ${maxHeight})`;
}

type PromptInputTextareaProps = Omit<
  React.ComponentProps<typeof Textarea>,
  'ref' | 'value' | 'onChange'
> & {
  disableAutosize?: boolean;
};

function PromptInputTextarea({
  disableAutosize = false,
  className,
  onKeyDown,
  ...props
}: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled, textareaRef } =
    usePromptInput();

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    if (disableAutosize) {
      return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = maxHeightCssOf(maxHeight, textarea.scrollHeight);
  }, [value, maxHeight, disableAutosize, textareaRef]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    const isEnter = event.key === 'Enter';
    const isNewLine = event.shiftKey;
    const isComposing = event.nativeEvent.isComposing;
    const shouldSubmit = isEnter && !isNewLine && !isComposing;
    if (!shouldSubmit) {
      return;
    }
    event.preventDefault();
    onSubmit?.();
  }

  return (
    <Textarea
      rows={1}
      disabled={disabled}
      {...props}
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(
        'max-h-none min-h-10 border-0 bg-transparent px-2 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent',
        className
      )}
    />
  );
}

type PromptInputActionsProps = React.ComponentProps<'div'>;

function PromptInputActions({ className, ...props }: PromptInputActionsProps) {
  return (
    <div
      data-slot='prompt-input-actions'
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  );
}

type PromptInputActionProps = Omit<
  React.ComponentProps<typeof Tooltip>,
  'children'
> & {
  tooltip: React.ReactNode;
  /** The control the tooltip explains, usually an icon `Button` with an `aria-label`. */
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

function PromptInputAction({
  tooltip,
  children,
  side = 'top',
  className,
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput();

  return (
    <Tooltip {...props}>
      <TooltipTrigger render={children} disabled={disabled} />
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function StopGlyph() {
  return (
    <span aria-hidden='true' className='size-2.5 rounded-[2px] bg-current' />
  );
}

function submitLabelOf(
  isLoading: boolean,
  sendLabel: string,
  stopLabel: string
) {
  if (isLoading) {
    return stopLabel;
  }
  return sendLabel;
}

function submitModeOf(isLoading: boolean) {
  if (isLoading) {
    return 'stop';
  }
  return 'send';
}

type PromptInputSubmitProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onClick'
> & {
  /** Shown as Stop while `isLoading`; without it the button waits disabled. */
  onStop?: () => void;
  /** Overrides the text check, for a prompt that can be sent with attachments only. */
  canSubmit?: boolean;
  sendLabel?: string;
  stopLabel?: string;
};

function PromptInputSubmit({
  onStop,
  canSubmit,
  sendLabel = 'Send',
  stopLabel = 'Stop',
  disabled,
  variant = 'default',
  size = 'icon',
  ...props
}: PromptInputSubmitProps) {
  const {
    isLoading,
    value,
    onSubmit,
    disabled: isInputDisabled,
  } = usePromptInput();
  const hasText = value.trim().length > 0;
  const hasContent = canSubmit ?? hasText;
  const isStoppable = isLoading && onStop !== undefined;
  const isSendable = !isLoading && hasContent;
  const isActionable = isStoppable || isSendable;
  const isTurnedOff = Boolean(disabled);
  const isDisabled = isTurnedOff || isInputDisabled || !isActionable;
  const label = submitLabelOf(isLoading, sendLabel, stopLabel);
  const mode = submitModeOf(isLoading);

  function handleClick() {
    if (isLoading) {
      onStop?.();
      return;
    }
    onSubmit?.();
  }

  return (
    <Button
      type='button'
      variant={variant}
      size={size}
      aria-label={label}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      <Swap swapKey={mode}>
        {isLoading && <StopGlyph />}
        {!isLoading && <SendIcon />}
      </Swap>
    </Button>
  );
}

export {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInput,
  type PromptInputProps,
};
