import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { WORKS_WITH, WORKS_WITH_LABEL } from './data';

export function WorksWith() {
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      <span className='text-muted-foreground text-xs'>{WORKS_WITH_LABEL}</span>
      <ul className='flex flex-wrap items-center gap-x-3 gap-y-2'>
        {WORKS_WITH.map((tool) => (
          <li key={tool.id} className='flex items-center gap-1.5 text-xs'>
            <BrandTile brand={tool.brand} />
            {tool.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
