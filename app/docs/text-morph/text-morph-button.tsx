'use client';
import { useState } from 'react';
import { TextMorph } from '@/components/core/text-morph';
import { Button } from '@/registry/ndeko/ui/button';

function nextLabelOf(label: string) {
  if (label === 'Continue') {
    return 'Confirm';
  }
  return 'Continue';
}

export function TextMorphButton() {
  const [text, setText] = useState('Continue');

  return (
    <Button
      size='lg'
      className='w-[120px]'
      onClick={() => setText(nextLabelOf(text))}
    >
      <TextMorph>{text}</TextMorph>
    </Button>
  );
}
