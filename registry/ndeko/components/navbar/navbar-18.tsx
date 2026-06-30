import { AppToggle } from '@/registry/ndeko/components/navbar/_parts/app-toggle';
import { TeamSwitcher } from '@/registry/ndeko/components/navbar/_parts/team-switcher';
import { SparklesIcon, UploadIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const TEAMS = ['Acme Inc.', 'Lumen Labs', 'Junon'];

export default function Navbar18() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          <TeamSwitcher teams={TEAMS} defaultTeam={TEAMS[0]} />
        </div>
        <div className='max-sm:hidden'>
          <AppToggle />
        </div>
        <div className='flex flex-1 items-center justify-end gap-2'>
          <Button variant='ghost' className='max-sm:aspect-square max-sm:px-0'>
            <UploadIcon className='opacity-60' />
            <span className='max-sm:sr-only'>Export</span>
          </Button>
          <Button className='max-sm:aspect-square max-sm:px-0'>
            <SparklesIcon className='opacity-60' />
            <span className='max-sm:sr-only'>Upgrade</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
