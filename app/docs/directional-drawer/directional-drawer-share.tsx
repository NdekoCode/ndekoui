import {
  DirectionalDrawer,
  DirectionalDrawerClose,
  DirectionalDrawerContent,
  DirectionalDrawerDescription,
  DirectionalDrawerHeader,
  DirectionalDrawerTitle,
  DirectionalDrawerTrigger,
} from '@/components/core/directional-drawer';
import {
  LinkIcon,
  MailIcon,
  MessageCircleIcon,
  Share2Icon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

type ShareTarget = {
  id: string;
  name: string;
  icon: Icon;
};

const TARGETS: ShareTarget[] = [
  { id: 'link', name: 'Copy link', icon: LinkIcon },
  { id: 'mail', name: 'Send by email', icon: MailIcon },
  { id: 'message', name: 'Send in a message', icon: MessageCircleIcon },
];

const ROW = [
  'flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left text-[13px] outline-none',
  'hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring',
].join(' ');

function ShareRow({ target }: { target: ShareTarget }) {
  const TargetIcon = target.icon;

  return (
    <DirectionalDrawerClose render={<button type='button' className={ROW} />}>
      <span className='keycap-3d text-muted-foreground grid size-8 place-items-center rounded-lg'>
        <TargetIcon className='size-4' />
      </span>
      <span className='text-foreground flex-1 font-medium'>{target.name}</span>
    </DirectionalDrawerClose>
  );
}

export function DirectionalDrawerShare() {
  return (
    <DirectionalDrawer>
      <DirectionalDrawerTrigger render={<Button type='button' />}>
        <Share2Icon />
        Share
      </DirectionalDrawerTrigger>
      <DirectionalDrawerContent
        side='bottom'
        className='mx-auto max-w-md gap-3 pt-8'
      >
        <DirectionalDrawerHeader>
          <DirectionalDrawerTitle>Share Q4 planning</DirectionalDrawerTitle>
          <DirectionalDrawerDescription>
            People with the link can view the page and leave comments
          </DirectionalDrawerDescription>
        </DirectionalDrawerHeader>
        <div className='flex flex-col'>
          {TARGETS.map((target) => (
            <ShareRow key={target.id} target={target} />
          ))}
        </div>
      </DirectionalDrawerContent>
    </DirectionalDrawer>
  );
}
