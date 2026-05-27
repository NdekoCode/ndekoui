import type { RegistryItemDefinition } from '@/registry/items';

import { KitItem } from './kit-item';
import type { KitGroup } from './kit-types';

type KitGroupSectionProps = {
  group: KitGroup;
  itemsByName: Map<string, RegistryItemDefinition>;
};

export function KitGroupSection({ group, itemsByName }: KitGroupSectionProps) {
  const headingId = `kit-${group.id}`;

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-5'>
      <div className='flex flex-col gap-1'>
        <h2 id={headingId} className='text-base font-semibold'>
          {group.title}
        </h2>
        <p className='text-muted-foreground text-[13px]'>{group.description}</p>
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-6'>
        {group.units.map((unit) => {
          const item = itemsByName.get(unit.name);
          if (!item) {
            return null;
          }
          return (
            <KitItem
              key={unit.name}
              item={item}
              width={unit.width}
              Demo={unit.Demo}
            />
          );
        })}
      </div>
    </section>
  );
}
