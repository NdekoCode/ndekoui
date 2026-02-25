import { TextLoop } from '@/components/core/text-loop';

export function TextLoopBasic() {
  return (
    <TextLoop className='text-muted-foreground text-[13px]'>
      <span>Search projects</span>
      <span>Find a teammate</span>
      <span>Open a recent file</span>
      <span>Jump to settings</span>
    </TextLoop>
  );
}
