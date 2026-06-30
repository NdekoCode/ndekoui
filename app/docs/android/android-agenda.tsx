import { Android } from '@/components/core/android';

import { AgendaScreen } from './agenda-screen';

export function AndroidAgenda() {
  return (
    <div className='flex w-full justify-center px-4 py-10'>
      <Android className='w-[300px]' label='This week’s agenda on a phone'>
        <AgendaScreen />
      </Android>
    </div>
  );
}
