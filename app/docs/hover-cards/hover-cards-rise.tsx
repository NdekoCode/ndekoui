import { HoverEffectCard } from '@/components/core/hover-cards';
import { CalendarIcon } from '@/registry/ndeko/lib/icons';

const PROJECTS = [
  {
    title: 'Harbour app redesign',
    description: 'Design team',
    openTasks: 14,
    due: 'Due 18 Nov',
    image: {
      src: '/images/scenes/scene-01.svg',
      alt: 'Flat illustration of indigo hills under a yellow sun',
    },
  },
  {
    title: 'Billing migration',
    description: 'Platform team',
    openTasks: 1,
    due: 'Due 2 Dec',
    image: {
      src: '/images/scenes/scene-07.svg',
      alt: 'Flat illustration of dark hills under the moon at night',
    },
  },
];

function openTasksLabel(count: number) {
  if (count === 1) {
    return '1 open task';
  }
  return `${count} open tasks`;
}

export function HoverCardsRise() {
  return (
    <div className='grid w-full max-w-xl gap-4 sm:grid-cols-2'>
      {PROJECTS.map((project) => (
        <HoverEffectCard
          key={project.title}
          effect='rise'
          href='#'
          title={project.title}
          description={project.description}
          image={project.image}
          meta={
            <>
              <span className='text-foreground font-medium tabular-nums'>
                {openTasksLabel(project.openTasks)}
              </span>
              <span className='text-muted-foreground ms-auto flex items-center gap-1'>
                <CalendarIcon className='size-3.5' />
                {project.due}
              </span>
            </>
          }
        />
      ))}
    </div>
  );
}
