import {
  BellIcon,
  LifeBuoyIcon,
  Link2Icon,
  ShieldCheckIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';

const SECTIONS = [
  {
    value: 'accounts',
    icon: Link2Icon,
    title: 'Connected accounts',
    description: 'Manage your linked social and work accounts',
    content:
      'Connect a Google, GitHub or Microsoft account to sign in with one click and bring your preferences along. You can revoke access to any connected account at any time.',
  },
  {
    value: 'notifications',
    icon: BellIcon,
    title: 'Notifications',
    description: 'Choose which updates reach you',
    content:
      'Pick the updates you want: security alerts, billing updates, product announcements, usage reports and scheduled maintenance. Each one can arrive by email, SMS or push notification.',
  },
  {
    value: 'two-step',
    icon: ShieldCheckIcon,
    title: '2-step verification',
    description: 'Add an extra layer of security to your account',
    content:
      'Ask for a second step at sign-in: an authenticator app, a code sent by SMS or a security key. An authenticator app is the most secure choice.',
  },
  {
    value: 'support',
    icon: LifeBuoyIcon,
    title: 'Contact support',
    description: 'Reach the team by chat or email',
    content:
      'For billing questions, technical issues or anything else, start a live chat, write to support@example.com or book a call with the technical team.',
  },
];

export default function Accordion09() {
  return (
    <Accordion defaultValue={['two-step']}>
      {SECTIONS.map((section) => (
        <AccordionItem key={section.value} value={section.value}>
          <AccordionTrigger>
            <span className='flex items-center gap-3'>
              <span className='keycap-3d flex size-9 shrink-0 items-center justify-center rounded-lg'>
                <section.icon className='text-muted-foreground size-4' />
              </span>
              <span className='flex flex-col gap-0.5'>
                <span>{section.title}</span>
                <span className='text-muted-foreground text-xs font-normal'>
                  {section.description}
                </span>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className='ps-12'>
            {section.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
