import { ShineBorder } from '@/components/core/shine-border';
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CodeIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

type Guide = {
  title: string;
  description: string;
  icon: Icon;
};

const GUIDES: Guide[] = [
  {
    title: 'Getting started',
    description: 'Install the theme and add a first component',
    icon: BookOpenIcon,
  },
  {
    title: 'Registry reference',
    description: 'Every item, its files and what it depends on',
    icon: CodeIcon,
  },
];

export function ShineBorderHover() {
  return (
    <div className='grid w-full max-w-xl gap-3 p-4 sm:grid-cols-2'>
      {GUIDES.map((guide) => {
        const GuideIcon = guide.icon;

        return (
          <a
            key={guide.title}
            href='#'
            className='group bg-card hairline-ring ring-border focus-visible:outline-ring relative block rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]'
          >
            <div className='flex items-center justify-between'>
              <span className='keycap-3d text-muted-foreground flex size-8 items-center justify-center rounded-lg'>
                <GuideIcon className='size-4' />
              </span>
              <ArrowUpRightIcon className='text-muted-foreground group-hover:text-foreground size-4 transition-colors' />
            </div>
            <p className='mt-3 text-sm font-medium'>{guide.title}</p>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              {guide.description}
            </p>
            <ShineBorder trigger='hover' duration={0.9} />
          </a>
        );
      })}
    </div>
  );
}
