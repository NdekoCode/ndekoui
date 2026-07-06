'use client';

import {
  FileTextIcon,
  ImageIcon,
  WandIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import {
  skillOf,
  toolOf,
  type Attachment,
  type SkillId,
  type ToolId,
} from './data';

const KILOBYTE = 1024;

const MEGABYTE = KILOBYTE * KILOBYTE;

/** 48 KB, 1.2 MB. */
export function formatBytes(bytes: number) {
  if (bytes < MEGABYTE) {
    const rounded = Math.round(bytes / KILOBYTE);
    const kilobytes = Math.max(1, rounded);
    return `${kilobytes} KB`;
  }
  const megabytes = bytes / MEGABYTE;
  return `${megabytes.toFixed(1)} MB`;
}

const CHIP =
  'bg-foreground/[0.05] flex h-7 max-w-full items-center gap-1.5 rounded-lg ps-1.5 pe-1 text-xs transition-[opacity,scale] duration-200 ease-(--ease-out-strong) starting:scale-95 starting:opacity-0';

const REMOVE =
  'text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground focus-visible:ring-ring/25 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] active:scale-[0.97]';

type RemoveProps = {
  label: string;
  onRemove: () => void;
};

function RemoveButton({ label, onRemove }: RemoveProps) {
  return (
    <button
      type='button'
      aria-label={label}
      onClick={onRemove}
      className={REMOVE}
    >
      <XIcon className='size-3' />
    </button>
  );
}

type AttachmentChipProps = {
  attachment: Attachment;
  /** Left out on a message that was already sent: its files can no longer change. */
  onRemove?: (id: string) => void;
};

export function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  const isPhoto = attachment.kind === 'photo';

  function remove() {
    onRemove?.(attachment.id);
  }

  return (
    <li className={CHIP}>
      {isPhoto && (
        <ImageIcon className='text-muted-foreground size-3.5 shrink-0' />
      )}
      {!isPhoto && (
        <FileTextIcon className='text-muted-foreground size-3.5 shrink-0' />
      )}
      <span className='min-w-0 truncate'>{attachment.name}</span>
      <span className='text-muted-foreground shrink-0 tabular-nums'>
        {formatBytes(attachment.bytes)}
      </span>
      {onRemove && (
        <RemoveButton label={`Remove ${attachment.name}`} onRemove={remove} />
      )}
    </li>
  );
}

type ToolChipProps = {
  toolId: ToolId;
  onRemove: (id: ToolId) => void;
};

export function ToolChip({ toolId, onRemove }: ToolChipProps) {
  const tool = toolOf(toolId);

  function remove() {
    onRemove(toolId);
  }

  return (
    <li className={cn(CHIP, 'ps-1')}>
      <BrandTile brand={tool.brand} size='sm' />
      <span className='min-w-0 truncate'>{tool.name}</span>
      <RemoveButton label={`Turn off ${tool.name}`} onRemove={remove} />
    </li>
  );
}

type SkillChipProps = {
  skillId: SkillId;
  onRemove: (id: SkillId) => void;
};

export function SkillChip({ skillId, onRemove }: SkillChipProps) {
  const skill = skillOf(skillId);

  function remove() {
    onRemove(skillId);
  }

  return (
    <li className={cn(CHIP, 'ps-1')}>
      <span
        aria-hidden='true'
        className='keycap-3d text-muted-foreground inline-flex size-4 shrink-0 items-center justify-center rounded-[4px]'
      >
        <WandIcon className='size-2.5' />
      </span>
      <span className='min-w-0 truncate'>{skill.name}</span>
      <RemoveButton label={`Turn off ${skill.name}`} onRemove={remove} />
    </li>
  );
}
