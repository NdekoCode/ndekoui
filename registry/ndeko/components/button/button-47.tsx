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

export default function Button47() {
  return (
    <div className='flex flex-col gap-2'>
      {PROVIDERS.map(({ name, Icon }) => (
        <Button key={name} variant='outline'>
          <Icon className='me-1' />
          Sign in with {name}
        </Button>
      ))}
    </div>
  );
}
