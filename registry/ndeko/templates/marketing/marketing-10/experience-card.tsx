import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import { BentoCard } from './bento-card';
import { EXPERIENCE } from './data';

export function ExperienceCard({ className }: { className?: string }) {
  return (
    <BentoCard title='Experience' className={className}>
      <ol className='flex flex-col gap-5'>
        {EXPERIENCE.map((job) => (
          <li key={job.company} className='flex gap-3'>
            <CompanyMark seed={job.company} size='lg' className='mt-0.5' />
            <div className='flex min-w-0 flex-col gap-1'>
              <p className='text-[13px] font-medium'>
                {job.role}, {job.company}
              </p>
              <p className='text-muted-foreground text-xs tabular-nums'>
                {job.years}
              </p>
              <p className='text-muted-foreground text-[13px] text-pretty'>
                {job.summary}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </BentoCard>
  );
}
