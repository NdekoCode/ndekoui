import {
  FacebookBrandIcon,
  GithubIcon,
  GoogleBrandIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const PROVIDERS = [
  { name: 'Google', Icon: GoogleBrandIcon },
  { name: 'Facebook', Icon: FacebookBrandIcon },
  { name: 'X', Icon: TwitterXIcon },
  { name: 'GitHub', Icon: GithubIcon },
];

export default function Button45() {
  return (
    <div className='inline-flex flex-wrap gap-2'>
      {PROVIDERS.map(({ name, Icon }) => (
        <Button
          key={name}
          variant='outline'
          size='icon'
          aria-label={`Sign in with ${name}`}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
