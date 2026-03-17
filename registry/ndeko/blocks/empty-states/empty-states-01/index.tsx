'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { FolderPlusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import { fadePresence } from './motion-parts';
import { DraftProjectRow, ProjectRow, type Project } from './project-rows';

const WORKSPACE_NAME = 'Mossline';

function projectCountOf(count: number) {
  if (count === 0) {
    return 'No projects';
  }
  if (count === 1) {
    return '1 project';
  }
  return `${count} projects`;
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className='hairline-border border-foreground/20 flex flex-col items-center rounded-xl border-dashed px-6 py-12 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <FolderPlusIcon />
      </span>
      <p className='text-muted-foreground mt-4 max-w-sm text-[13px] text-balance'>
        {WORKSPACE_NAME} has no projects yet, create one to group the tasks
        behind a goal
      </p>
      <Button onClick={onCreate} className='mt-4'>
        <PlusIcon />
        Create project
      </Button>
    </div>
  );
}

export default function EmptyStates01() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [nextId, setNextId] = useState(1);
  const hasProjects = projects.length > 0;
  const showsList = hasProjects || isCreating;

  function startCreating() {
    setIsCreating(true);
  }

  function cancelCreating() {
    setIsCreating(false);
  }

  function create(name: string) {
    const project: Project = { id: `project-${nextId}`, name };
    setProjects((current) => [project, ...current]);
    setNextId((current) => current + 1);
    setIsCreating(false);
  }

  function remove(projectId: string) {
    setProjects((current) =>
      current.filter((project) => project.id !== projectId)
    );
  }

  return (
    <div className='bg-background text-foreground min-h-svh px-4 py-8 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-2xl'>
        <div className='flex h-8 items-center justify-between gap-3'>
          <div className='min-w-0'>
            <h1 className='text-sm font-semibold'>Projects</h1>
            <p className='text-muted-foreground text-xs'>
              {projectCountOf(projects.length)}
            </p>
          </div>
          {hasProjects && (
            <Button onClick={startCreating} disabled={isCreating}>
              <PlusIcon />
              New project
            </Button>
          )}
        </div>
        <AnimatedSize className='mt-5'>
          <div className='relative'>
            <AnimatePresence mode='popLayout' initial={false}>
              {!showsList && (
                <motion.div key='empty' {...fadePresence()}>
                  <EmptyProjects onCreate={startCreating} />
                </motion.div>
              )}
              {showsList && (
                <motion.ul
                  key='list'
                  aria-label='Projects'
                  {...fadePresence()}
                  className='bg-card hairline-ring ring-border hairline-divide-y divide-border overflow-clip rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
                >
                  <AnimatePresence initial={false}>
                    {isCreating && (
                      <DraftProjectRow
                        key='draft'
                        onCreate={create}
                        onCancel={cancelCreating}
                      />
                    )}
                    {projects.map((project) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        onDelete={remove}
                      />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </AnimatedSize>
      </div>
    </div>
  );
}
