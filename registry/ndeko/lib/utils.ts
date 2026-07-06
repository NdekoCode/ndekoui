import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The hairline utilities of the theme set the same properties as the border, divide and ring
 * widths of Tailwind, so a later one replaces an earlier one when classes are merged.
 */
const mergeClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      'border-w': ['hairline-border'],
      'border-w-b': ['hairline-b'],
      'border-w-t': ['hairline-t'],
      'border-w-l': ['hairline-l'],
      'border-w-r': ['hairline-r'],
      'border-w-x': ['hairline-x'],
      'border-w-y': ['hairline-y'],
      'divide-y': ['hairline-divide-y'],
      'divide-x': ['hairline-divide-x'],
      'ring-w': ['hairline-ring'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  const classes = clsx(inputs);
  return mergeClasses(classes);
}
