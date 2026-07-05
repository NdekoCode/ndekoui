import {
  BlocksIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  GlobeIcon,
  GitBranchIcon,
  ListChecksIcon,
  MailIcon,
  MemoryIcon,
  PencilIcon,
  SearchIcon,
  TerminalIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const TOOL_GLYPHS: Record<string, React.ReactNode> = {
  web_search: <SearchIcon />,
  fetch_page: <GlobeIcon />,
  read_sheet: <FileSpreadsheetIcon />,
  read_file: <FileTextIcon />,
  edit_file: <PencilIcon />,
  write_doc: <FileTextIcon />,
  send_email: <MailIcon />,
  draft_email: <MailIcon />,
  run_python: <TerminalIcon />,
  shell: <TerminalIcon />,
  run_tests: <ListChecksIcon />,
  recall: <MemoryIcon />,
  git: <GitBranchIcon />,
};

const ANY_TOOL_GLYPH = <BlocksIcon />;

export function toolGlyphOf(tool: string) {
  return TOOL_GLYPHS[tool] ?? ANY_TOOL_GLYPH;
}

const SIZE_CLASS = {
  sm: 'size-6 rounded-md [&_svg]:size-3.5',
  md: 'size-7 rounded-md [&_svg]:size-3.5',
  lg: 'size-8 rounded-lg [&_svg]:size-4',
} as const;

type ToolTileProps = {
  tool: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

/** The tool name sits beside the tile or in the label of its control, so screen readers skip the glyph. */
export function ToolTile({ tool, size = 'md', className }: ToolTileProps) {
  const glyph = toolGlyphOf(tool);

  return (
    <span
      aria-hidden='true'
      className={cn(
        'keycap-3d text-muted-foreground inline-flex shrink-0 items-center justify-center',
        SIZE_CLASS[size],
        className
      )}
    >
      {glyph}
    </span>
  );
}
