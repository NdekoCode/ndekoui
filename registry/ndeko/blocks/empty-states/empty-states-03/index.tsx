import { ActivityCard } from './activity-card';
import { OpenTasksCard, TeamCard } from './working-cards';

export default function EmptyStates03() {
  return (
    <div className='bg-background text-foreground @container min-h-svh px-4 py-8 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='text-sm font-semibold'>This week</h1>
        <p className='text-muted-foreground text-xs'>
          Mossline Web · Nov 2 to Nov 8
        </p>
        <div className='mt-5 grid gap-4 @3xl:grid-cols-2'>
          <OpenTasksCard />
          <TeamCard />
          <ActivityCard className='@3xl:col-span-2' />
        </div>
      </div>
    </div>
  );
}
