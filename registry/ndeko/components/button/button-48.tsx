import {
  FacebookBrandIcon,
  GithubIcon,
  GoogleBrandIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const PROVIDERS = [
  { name: 'Google', Icon: GoogleBrandIcon },
  { name: 'X', Icon: TwitterXIcon },
  { name: 'Facebook', Icon: FacebookBrandIcon },
  { name: 'GitHub', Icon: GithubIcon },
];

export default function Button48() {
  return (
    <div className='flex flex-col gap-2'>
      {PROVIDERS.map(({ name, Icon }) => (
        <Button key={name} variant='secondary' className='after:flex-1'>
          <span className='pointer-events-none me-2 flex flex-1'>
            <Icon className='opacity-60' />
          </span>
          Sign in with {name}
        </Button>
      ))}
    </div>
  );
}
