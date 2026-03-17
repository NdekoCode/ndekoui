import { TEAM_NAME, type TaskDetail } from './data';
import { issueTypeOf, keyOf, shortDateOf, statusOf } from './detail-model';
import { Swap } from './motion-parts';
import { IssueTypeGem, StatusGlyph } from './task-glyphs';

export function TaskBand({ task }: { task: TaskDetail }) {
  const type = issueTypeOf(task.type);
  const status = statusOf(task.status);

  return (
    <div className='bg-foreground/[0.03] text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg px-3 py-2 text-xs'>
      <span className='text-foreground flex items-center gap-1.5 font-medium'>
        <IssueTypeGem type={task.type} />
        {type.name}
      </span>
      <span>{TEAM_NAME}</span>
      <span className='tabular-nums'>{keyOf(task.number)}</span>
      <span>Created {shortDateOf(task.createdAt)}</span>
      <span className='text-foreground ms-auto flex items-center gap-1.5'>
        <Swap swapKey={task.status}>
          <StatusGlyph status={task.status} />
        </Swap>
        {status.name}
      </span>
    </div>
  );
}
