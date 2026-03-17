import {
  CircleCheckIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import {
  activeFilterCountOf,
  countLabel,
  scopeOf,
  type Filters,
  type Scope,
} from './task-model';

type EmptyFrameProps = {
  icon: React.ReactNode;
  title: string;
  line: string;
  action: React.ReactNode;
};

function EmptyFrame({ icon, title, line, action }: EmptyFrameProps) {
  return (
    <div className='flex flex-col items-center px-6 py-16 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        {icon}
      </span>
      <p className='mt-4 text-sm font-medium'>{title}</p>
      <p className='text-muted-foreground mt-1 max-w-sm text-[13px] text-balance'>
        {line}
      </p>
      <div className='mt-4'>{action}</div>
    </div>
  );
}

function criteriaOf(query: string, filters: Filters) {
  const trimmed = query.trim();
  const filterCount = activeFilterCountOf(filters);
  const filterPhrase = countLabel(filterCount, 'filter', 'filters');
  const hasFilters = filterCount > 0;
  if (!trimmed) {
    return filterPhrase;
  }
  if (!hasFilters) {
    return `“${trimmed}”`;
  }
  return `“${trimmed}” with ${filterPhrase}`;
}

function reachOf(scope: Scope, scopeTotal: number) {
  const option = scopeOf(scope);
  if (scopeTotal === 0) {
    return `and there are no ${option.plural} yet`;
  }
  if (scopeTotal === 1) {
    return `clear them to see the one ${option.singular}`;
  }
  return `clear them to see all ${scopeTotal} ${option.plural}`;
}

function filteredLineOf(
  scope: Scope,
  query: string,
  filters: Filters,
  scopeTotal: number
) {
  const option = scopeOf(scope);
  const criteria = criteriaOf(query, filters);
  const reach = reachOf(scope, scopeTotal);
  return `No ${option.singular} matches ${criteria}, ${reach}`;
}

type FilteredEmptyProps = {
  scope: Scope;
  query: string;
  filters: Filters;
  scopeTotal: number;
  onClear: () => void;
};

export function FilteredEmpty({
  scope,
  query,
  filters,
  scopeTotal,
  onClear,
}: FilteredEmptyProps) {
  return (
    <EmptyFrame
      icon={<SearchIcon />}
      title='No tasks match'
      line={filteredLineOf(scope, query, filters, scopeTotal)}
      action={
        <Button variant='outline' onClick={onClear}>
          <XIcon />
          Clear filters
        </Button>
      }
    />
  );
}

type ScopeEmptyProps = {
  scope: Scope;
  onNewTask: () => void;
  onShowActive: () => void;
};

export function ScopeEmpty({
  scope,
  onNewTask,
  onShowActive,
}: ScopeEmptyProps) {
  if (scope === 'done') {
    return (
      <EmptyFrame
        icon={<CircleCheckIcon />}
        title='No finished tasks'
        line='Tasks moved to Done appear here'
        action={
          <Button variant='outline' onClick={onShowActive}>
            Show active tasks
          </Button>
        }
      />
    );
  }
  return (
    <EmptyFrame
      icon={<CircleCheckIcon />}
      title='No active tasks'
      line='All tasks are done, add one to plan what comes next'
      action={
        <Button onClick={onNewTask}>
          <PlusIcon />
          New task
        </Button>
      }
    />
  );
}
