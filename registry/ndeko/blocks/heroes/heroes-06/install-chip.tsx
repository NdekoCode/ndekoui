import { CopyButton } from '@/registry/ndeko/ui/copy-button';

type InstallChipProps = {
  command: string;
};

/** The command that installs the product, on one line, with a button that copies it. */
export function InstallChip({ command }: InstallChipProps) {
  return (
    <div className='bg-foreground/[0.04] inline-flex h-9 max-w-full items-center gap-2 rounded-full ps-3.5 pe-1.5 font-mono text-[13px]'>
      <span aria-hidden='true' className='text-muted-foreground select-none'>
        $
      </span>
      <code className='min-w-0 truncate'>{command}</code>
      <CopyButton
        text={command}
        label='Copy the install command'
        className='rounded-full'
      />
    </div>
  );
}
