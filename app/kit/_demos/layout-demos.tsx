import { countLabel } from '@/lib/site';
import { ChevronsUpDownIcon, FileTextIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/registry/ndeko/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';
import { ScrollArea } from '@/registry/ndeko/ui/scroll-area';
import { Separator } from '@/registry/ndeko/ui/separator';

const MEMBERS = [
  { name: 'Lena Fischer', role: 'Admin' },
  { name: 'Omar Haddad', role: 'Member' },
  { name: 'Priya Nair', role: 'Member' },
  { name: 'Tomás Ortega', role: 'Member' },
  { name: 'Mei Chen', role: 'Admin' },
  { name: 'Jonas Weber', role: 'Guest' },
  { name: 'Amara Okafor', role: 'Member' },
  { name: 'Lucas Moreau', role: 'Member' },
  { name: 'Sofia Rossi', role: 'Guest' },
  { name: 'Daniel Kim', role: 'Member' },
  { name: 'Hana Sato', role: 'Member' },
  { name: 'Yusuf Demir', role: 'Guest' },
];

const ATTACHMENTS = ['pricing-copy.docx', 'hero-sketch.png', 'launch-plan.pdf'];

const ATTACHMENT_COUNT = countLabel(
  ATTACHMENTS.length,
  'file attached',
  'files attached'
);

const SETTINGS_SECTIONS = ['Members', 'Billing', 'Security'];

export function CardDemo() {
  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle>Website redesign</CardTitle>
        <CardDescription>Updated this morning by Lena</CardDescription>
        <CardAction>
          <Badge variant='info'>In review</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='text-muted-foreground text-[13px]'>
        New pages for pricing, docs and the changelog.
      </CardContent>
      <CardFooter>
        <Button variant='outline' size='sm'>
          Open project
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SeparatorDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3 text-[13px]'>
      <div className='flex flex-col gap-0.5'>
        <p className='font-medium'>Atlas Studio</p>
        <p className='text-muted-foreground text-xs'>
          Workspace on the Team plan
        </p>
      </div>
      <Separator />
      <div className='text-muted-foreground flex h-4 items-center gap-3'>
        {SETTINGS_SECTIONS.map((section, index) => {
          const hasSeparatorBefore = index > 0;
          return (
            <div key={section} className='flex h-full items-center gap-3'>
              {hasSeparatorBefore && <Separator orientation='vertical' />}
              <span>{section}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScrollAreaDemo() {
  return (
    <ScrollArea className='hairline-ring ring-border h-48 w-full max-w-xs rounded-lg'>
      <ul className='flex flex-col p-2 text-[13px]'>
        {MEMBERS.map((member) => (
          <li
            key={member.name}
            className='flex items-center justify-between gap-3 px-1 py-1.5'
          >
            {member.name}
            <span className='text-muted-foreground text-xs'>{member.role}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

export function CollapsibleDemo() {
  return (
    <Collapsible className='flex w-full max-w-xs flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-[13px] font-medium'>{ATTACHMENT_COUNT}</p>
        <CollapsibleTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Show or hide the files'
            />
          }
        >
          <ChevronsUpDownIcon />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <ul className='flex flex-col gap-1.5 p-px text-[13px]'>
          {ATTACHMENTS.map((file) => (
            <li
              key={file}
              className='hairline-ring ring-border flex items-center gap-2 rounded-lg px-3 py-2'
            >
              <FileTextIcon className='text-muted-foreground size-4' />
              {file}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
