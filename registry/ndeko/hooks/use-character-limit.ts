'use client';

import { useState, type ChangeEvent } from 'react';

export type CharacterLimitOptions = {
  maxLength: number;
  initialValue?: string;
};

export function useCharacterLimit({
  maxLength,
  initialValue = '',
}: CharacterLimitOptions) {
  const [value, setValue] = useState(initialValue);
  const characterCount = value.length;

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const nextValue = event.currentTarget.value;
    const fitsLimit = nextValue.length <= maxLength;
    if (fitsLimit) {
      setValue(nextValue);
    }
  }

  return {
    value,
    characterCount,
    handleChange,
    maxLength,
  };
}
