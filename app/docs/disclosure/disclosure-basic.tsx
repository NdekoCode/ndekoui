import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from '@/components/core/disclosure';

const CHANGES = [
  'Recurring tasks on every board',
  'Calendar sync for shared boards',
  'Search inside attachments',
];

export function DisclosureBasic() {
  return (
    <Disclosure className='bg-card hairline-ring ring-border w-[330px] rounded-xl px-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <DisclosureTrigger>
        <button
          className='text-foreground w-full py-2.5 text-left text-sm font-medium'
          type='button'
        >
          Release notes, version 2.4
        </button>
      </DisclosureTrigger>
      <DisclosureContent>
        <div className='overflow-hidden pb-3'>
          <div className='text-muted-foreground pt-1 text-[13px]'>
            <p>
              Version 2.4 shipped on 14 March for every workspace.{' '}
              <strong className='text-foreground font-medium'>
                Nothing to install
              </strong>
              : the desktop app updates on its next launch.
            </p>
            <ul className='bg-foreground/[0.04] mt-2 list-inside list-disc space-y-1 rounded-lg p-2.5'>
              {CHANGES.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>
        </div>
      </DisclosureContent>
    </Disclosure>
  );
}
