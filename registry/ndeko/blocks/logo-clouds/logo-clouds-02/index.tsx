import { MARKS, SECTION } from './data';
import { MarkShape } from './mark-shape';

export default function LogoClouds02() {
  return (
    <section className='px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6'>
        <div className='grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-center lg:gap-12'>
          <h2 className='text-sm font-medium text-balance'>{SECTION.title}</h2>
          <ul className='grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:flex lg:items-center lg:justify-between'>
            {MARKS.map((mark) => (
              <li
                key={mark.name}
                className='text-foreground/55 flex items-center gap-2'
              >
                <MarkShape shape={mark.shape} />
                <span className='text-sm font-semibold whitespace-nowrap'>
                  {mark.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className='text-muted-foreground text-xs'>{SECTION.note}</p>
      </div>
    </section>
  );
}
