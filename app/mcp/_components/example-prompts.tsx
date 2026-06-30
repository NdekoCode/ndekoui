import { CopyButton } from '@/app/_site/copy-button';

const EXAMPLE_PROMPTS = [
  'Use Ndeko UI to build the pricing page of a time tracking app, with a switch between monthly and yearly billing',
  'Find the Ndeko UI range calendar and put it in the booking step of our checkout',
  'Rebuild our team settings screen with Ndeko UI blocks and keep the current form logic',
  'Which Ndeko UI pieces animate a number that changes? Install the one that fits the cart quantity',
  'Read the Ndeko UI design guidelines, then review this card against them and fix what differs',
];

export function ExamplePrompts() {
  return (
    <ul className='flex flex-col gap-2'>
      {EXAMPLE_PROMPTS.map((prompt) => (
        <li
          key={prompt}
          className='bg-foreground/[0.04] flex items-start gap-2 rounded-lg py-1 ps-3.5 pe-1'
        >
          <p className='min-w-0 flex-1 py-1.5 text-[13px] text-pretty'>
            {prompt}
          </p>
          <CopyButton value={prompt} label='Copy this prompt' />
        </li>
      ))}
    </ul>
  );
}
