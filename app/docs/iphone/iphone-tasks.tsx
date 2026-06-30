import { Iphone } from '@/components/core/iphone';

import { TaskScreen } from './task-screen';

export function IphoneTasks() {
  return (
    <div className='flex w-full justify-center px-4 py-10'>
      <Iphone className='w-[300px]' label='Today’s tasks on a phone'>
        <TaskScreen />
      </Iphone>
    </div>
  );
}
