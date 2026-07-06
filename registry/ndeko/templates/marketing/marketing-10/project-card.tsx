import { MapPinIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';

import { type Project, WORK_ANCHOR } from './data';

function toneOf(isActive: boolean) {
  if (isActive) {
    return 'hairline-ring ring-primary/40 bg-card';
  }
  return 'hairline-ring ring-border bg-card';
}

function currentOf(isActive: boolean) {
  if (isActive) {
    return 'true' as const;
  }
  return undefined;
}

type ProjectCardProps = {
  project: Project;
  isActive: boolean;
  onPoint: () => void;
};

export function ProjectCard({ project, isActive, onPoint }: ProjectCardProps) {
  return (
    <a
      href={`#${WORK_ANCHOR}`}
      aria-current={currentOf(isActive)}
      onPointerEnter={onPoint}
      onFocus={onPoint}
      className={cn(
        'focus-visible:ring-ring/25 flex h-full flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[box-shadow,background-color] duration-200 outline-none focus-visible:ring-[3px]',
        toneOf(isActive)
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <h3 className='text-sm font-medium'>{project.title}</h3>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {project.year}
        </span>
      </div>
      <p className='text-muted-foreground text-[13px] text-pretty'>
        {project.description}
      </p>
      <div className='mt-auto flex flex-wrap items-center gap-1.5'>
        <span className='text-muted-foreground me-1 flex items-center gap-1 text-xs'>
          <MapPinIcon className='size-3.5' />
          {project.city}
        </span>
        {project.tags.map((tag) => (
          <Badge
            key={tag}
            variant='secondary'
            className='text-muted-foreground'
          >
            {tag}
          </Badge>
        ))}
      </div>
    </a>
  );
}
