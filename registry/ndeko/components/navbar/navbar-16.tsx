import { InfoMenu } from '@/registry/ndeko/components/navbar/_parts/info-menu';
import { NotificationMenu } from '@/registry/ndeko/components/navbar/_parts/notification-menu';
import { SearchField } from '@/registry/ndeko/components/navbar/_parts/search-field';
import { SettingsMenu } from '@/registry/ndeko/components/navbar/_parts/settings-menu';
import { LayoutGridIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

export default function Navbar16() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <SearchField containerClassName='flex-1' className='max-w-xs' />
        <div className='flex items-center gap-4'>
          <Label className='max-md:hidden'>
            Test mode
            <Switch defaultChecked />
          </Label>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Open apps'
              className='text-muted-foreground'
            >
              <LayoutGridIcon />
            </Button>
            <InfoMenu />
            <NotificationMenu />
            <SettingsMenu />
          </div>
          <Button size='icon' aria-label='Create item'>
            <PlusIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
