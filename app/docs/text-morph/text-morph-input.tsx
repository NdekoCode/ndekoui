'use client';
import { useState } from 'react';
import { TextMorph } from '@/components/core/text-morph';
import { Input } from '@/registry/ndeko/ui/input';

export function TextMorphInput() {
  const [text, setText] = useState('Craft');

  return (
    <div className='flex flex-col items-center justify-end space-y-12'>
      <TextMorph className='text-foreground text-5xl font-medium'>
        {text}
      </TextMorph>
      <Input
        type='text'
        size='lg'
        aria-label='Word to morph'
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Type a word'
      />
    </div>
  );
}
