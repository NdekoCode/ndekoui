'use client';

import { MotionNumber } from '@/components/core/motion-number';

const THOUSANDS: Intl.NumberFormatOptions = { maximumFractionDigits: 1 };

type TokenCountProps = {
  tokens: number;
  className?: string;
};

export function TokenCount({ tokens, className }: TokenCountProps) {
  const thousands = tokens / 1000;
  return (
    <MotionNumber
      value={thousands}
      format={THOUSANDS}
      suffix='k'
      className={className}
    />
  );
}
