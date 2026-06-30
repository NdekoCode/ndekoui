import { Android } from '@/components/core/android';

import { AgendaScreen } from './agenda-screen';

export function AndroidDark() {
  return (
    <div className='flex w-full justify-center px-4 py-10'>
      <div className='dark'>
        <Android
          className='w-[300px]'
          finish='white'
          label='This week’s agenda on a phone in dark mode'
        >
          <AgendaScreen />
        </Android>
      </div>
    </div>
  );
}
