'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { isScope, SCOPES, type Scope } from './task-model';

type ScopeSwitchProps = {
  scope: Scope;
  counts: Record<Scope, number>;
  onChange: (scope: Scope) => void;
};

export function ScopeSwitch({ scope, counts, onChange }: ScopeSwitchProps) {
  function change(value: unknown) {
    if (isScope(value)) {
      onChange(value);
    }
  }

  return (
    <Tabs value={scope} onValueChange={change}>
      <TabsList variant='segmented' aria-label='Which tasks to show'>
        {SCOPES.map((option) => (
          <TabsTab key={option.id} value={option.id}>
            {option.label}
            <MotionNumber
              value={counts[option.id]}
              className='text-muted-foreground text-xs'
            />
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
