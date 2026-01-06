'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Collapsible, CollapsiblePanel } from '@/registry/ndeko/ui/collapsible';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox12() {
  const id = useId();
  const descriptionId = `${id}-description`;
  const panelId = `${id}-panel`;
  const [isChecked, setIsChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChecked) {
      inputRef.current?.focus();
    }
  }, [isChecked]);

  return (
    <div className='flex w-full items-start gap-2'>
      <Checkbox
        id={id}
        checked={isChecked}
        onCheckedChange={setIsChecked}
        aria-describedby={descriptionId}
        aria-controls={panelId}
      />
      <div className='grow'>
        <div className='grid gap-1.5'>
          <Label htmlFor={id}>Use a custom domain</Label>
          <p id={descriptionId} className='text-muted-foreground text-xs'>
            Serve the workspace from a domain you own.
          </p>
        </div>
        <Collapsible open={isChecked}>
          <CollapsiblePanel id={panelId} keepMounted className='-mx-1 px-1'>
            <div className='pt-3 pb-1'>
              <Input
                ref={inputRef}
                placeholder='projects.example.com'
                aria-label='Custom domain'
              />
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </div>
    </div>
  );
}
