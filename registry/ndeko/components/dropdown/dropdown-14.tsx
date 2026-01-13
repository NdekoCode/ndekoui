import {
  Heading1Icon,
  Heading2Icon,
  MinusIcon,
  PlusIcon,
  TextQuoteIcon,
  TypeIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

type BlockKind = {
  title: string;
  description: string;
  icon: Icon;
};

const BLOCK_KINDS: BlockKind[] = [
  {
    title: 'Text',
    description: 'Start writing with plain text',
    icon: TypeIcon,
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: TextQuoteIcon,
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks',
    icon: MinusIcon,
  },
  {
    title: 'Heading 1',
    description: 'Big section heading',
    icon: Heading1Icon,
  },
  {
    title: 'Heading 2',
    description: 'Medium section subheading',
    icon: Heading2Icon,
  },
];

export default function Dropdown14() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' aria-label='Add block' />}
      >
        <PlusIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Add block</DropdownMenuGroupLabel>
          {BLOCK_KINDS.map((block) => (
            <DropdownMenuItem
              key={block.title}
              label={block.title}
              className='h-auto py-1.5'
            >
              <span
                className='keycap-3d flex size-8 shrink-0 items-center justify-center rounded-md'
                aria-hidden='true'
              >
                <block.icon />
              </span>
              <span className='flex min-w-0 flex-col gap-0.5'>
                <span className='font-medium'>{block.title}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  {block.description}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
