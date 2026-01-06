'use client';

import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Switch } from '@/registry/ndeko/ui/switch';

const SIDE_LABEL =
  'cursor-pointer text-[13px] font-medium transition-colors duration-150';

function sideToneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

export default function Switch09() {
  const [isOn, setIsOn] = useState(false);
  const offTone = sideToneOf(!isOn);
  const onTone = sideToneOf(isOn);

  function turnOff() {
    setIsOn(false);
  }

  function turnOn() {
    setIsOn(true);
  }

  return (
    <div className='inline-flex items-center gap-2'>
      <span
        aria-hidden='true'
        className={cn(SIDE_LABEL, offTone)}
        onClick={turnOff}
      >
        Off
      </span>
      <Switch
        checked={isOn}
        onCheckedChange={setIsOn}
        aria-label='Email notifications'
      />
      <span
        aria-hidden='true'
        className={cn(SIDE_LABEL, onTone)}
        onClick={turnOn}
      >
        On
      </span>
    </div>
  );
}
