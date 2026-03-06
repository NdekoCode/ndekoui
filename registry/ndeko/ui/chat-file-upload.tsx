// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionProps,
  type Transition,
} from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/registry/ndeko/lib/utils';

type FileUploadContextValue = {
  isDragging: boolean;
  openPicker: () => void;
  multiple: boolean;
  disabled: boolean;
};

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

function useFileUpload() {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error('useFileUpload must be used within a FileUpload');
  }
  return context;
}

function hasDraggedFiles(event: DragEvent) {
  const types = event.dataTransfer?.types;
  if (!types) {
    return false;
  }
  return Array.from(types).includes('Files');
}

function filesOf(list: FileList, multiple: boolean) {
  const files = Array.from(list);
  if (multiple) {
    return files;
  }
  return files.slice(0, 1);
}

type FileUploadProps = {
  onFilesAdded: (files: File[]) => void;
  children: React.ReactNode;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
};

/** Listens for drops on the whole window, not only on its children. */
function FileUpload({
  onFilesAdded,
  children,
  multiple = true,
  accept,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useEffectEvent((list: FileList) => {
    const files = filesOf(list, multiple);
    onFilesAdded(files);
  });

  useEffect(() => {
    if (disabled) {
      return;
    }

    function holdDrag(event: DragEvent) {
      if (!hasDraggedFiles(event)) {
        return;
      }
      event.preventDefault();
    }

    function enterDrag(event: DragEvent) {
      if (!hasDraggedFiles(event)) {
        return;
      }
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    }

    function leaveDrag(event: DragEvent) {
      if (!hasDraggedFiles(event)) {
        return;
      }
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setIsDragging(false);
      }
    }

    function dropFiles(event: DragEvent) {
      if (!hasDraggedFiles(event)) {
        return;
      }
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      const list = event.dataTransfer?.files;
      if (list?.length) {
        addFiles(list);
      }
    }

    window.addEventListener('dragenter', enterDrag);
    window.addEventListener('dragleave', leaveDrag);
    window.addEventListener('dragover', holdDrag);
    window.addEventListener('drop', dropFiles);

    return () => {
      window.removeEventListener('dragenter', enterDrag);
      window.removeEventListener('dragleave', leaveDrag);
      window.removeEventListener('dragover', holdDrag);
      window.removeEventListener('drop', dropFiles);
      dragDepth.current = 0;
    };
  }, [disabled]);

  function pickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const list = event.target.files;
    if (!list?.length) {
      return;
    }
    const files = filesOf(list, multiple);
    onFilesAdded(files);
    event.target.value = '';
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const context: FileUploadContextValue = {
    isDragging,
    openPicker,
    multiple,
    disabled,
  };

  return (
    <FileUploadContext.Provider value={context}>
      <input
        ref={inputRef}
        type='file'
        tabIndex={-1}
        aria-hidden='true'
        className='hidden'
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={pickFiles}
      />
      {children}
    </FileUploadContext.Provider>
  );
}

type FileUploadTriggerProps = useRender.ComponentProps<'button'>;

/** Opens the file picker. Render it as one of your buttons with `render={<Button />}`. */
function FileUploadTrigger({ render, ...props }: FileUploadTriggerProps) {
  const { openPicker, disabled } = useFileUpload();

  function openFromClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (event.defaultPrevented) {
      return;
    }
    openPicker();
  }

  const defaultProps = {
    'data-slot': 'file-upload-trigger',
    type: 'button' as const,
    disabled,
    onClick: openFromClick,
  };

  return useRender({
    defaultTagName: 'button',
    render,
    props: mergeProps<'button'>(defaultProps, props),
  });
}

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const ENTER: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };

const EXIT: Transition = { duration: 0.1, ease: [0.23, 1, 0.32, 1] };

const SETTLE_PRESENCE: PresenceProps = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function presenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return SETTLE_PRESENCE;
}

function subscribeToNothing() {
  return () => undefined;
}

function isOnClient() {
  return true;
}

function isOnServer() {
  return false;
}

type FileUploadContentProps = React.ComponentProps<'div'>;

function FileUploadContent({ className, children }: FileUploadContentProps) {
  const { isDragging, disabled } = useFileUpload();
  const shouldReduceMotion = useReducedMotion();
  const presence = presenceOf(shouldReduceMotion);
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    isOnClient,
    isOnServer
  );
  const isShown = isDragging && !disabled;

  if (!isMounted) {
    return null;
  }

  const layer = (
    <AnimatePresence>
      {isShown && (
        <motion.div
          key='file-upload-content'
          data-slot='file-upload-content'
          className={cn(
            'bg-background/85 pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6',
            className
          )}
          {...presence}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(layer, document.body);
}

export {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
  useFileUpload,
  type FileUploadProps,
};
