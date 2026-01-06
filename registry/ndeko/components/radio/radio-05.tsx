'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Collapsible, CollapsiblePanel } from '@/registry/ndeko/ui/collapsible';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

export default function Radio05() {
  const id = useId();
  const pickupId = `${id}-pickup`;
  const homeId = `${id}-home`;
  const panelId = `${id}-panel`;
  const [delivery, setDelivery] = useState('home');
  const isPickup = delivery === 'pickup';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPickup) {
      inputRef.current?.focus();
    }
  }, [isPickup]);

  return (
    <RadioGroup
      value={delivery}
      onValueChange={setDelivery}
      aria-label='Delivery'
      className='w-full gap-6'
    >
      <div className='flex items-start gap-2'>
        <RadioGroupItem
          value='pickup'
          id={pickupId}
          aria-describedby={`${pickupId}-description`}
          aria-controls={panelId}
        />
        <div className='grow'>
          <div className='grid gap-1.5'>
            <Label htmlFor={pickupId}>Deliver to a pickup point</Label>
            <p
              id={`${pickupId}-description`}
              className='text-muted-foreground text-xs'
            >
              Collect the parcel from a shop near you.
            </p>
          </div>
          <Collapsible open={isPickup}>
            <CollapsiblePanel id={panelId} keepMounted className='-mx-1 px-1'>
              <div className='pt-3 pb-1'>
                <Input
                  ref={inputRef}
                  placeholder='Postcode'
                  aria-label='Postcode of the pickup point'
                />
              </div>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      </div>
      <div className='flex items-start gap-2'>
        <RadioGroupItem
          value='home'
          id={homeId}
          aria-describedby={`${homeId}-description`}
        />
        <div className='grid grow gap-1.5'>
          <Label htmlFor={homeId}>Deliver to my address</Label>
          <p
            id={`${homeId}-description`}
            className='text-muted-foreground text-xs'
          >
            The courier brings it to your door.
          </p>
        </div>
      </div>
    </RadioGroup>
  );
}
