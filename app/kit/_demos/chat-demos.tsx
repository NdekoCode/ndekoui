import {
  CopyIcon,
  FeatherIcon,
  FileTextIcon,
  PencilIcon,
  SearchIcon,
  ThumbsUpIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
} from '@/registry/ndeko/ui/chat-chain-of-thought';
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockCopyButton,
  CodeBlockGroup,
  CodeBlockLanguage,
} from '@/registry/ndeko/ui/chat-code-block';
import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/registry/ndeko/ui/chat-container';
import { FeedbackBar } from '@/registry/ndeko/ui/chat-feedback-bar';
import { Image } from '@/registry/ndeko/ui/chat-image';
import { Loader } from '@/registry/ndeko/ui/chat-loader';
import { Markdown } from '@/registry/ndeko/ui/chat-markdown';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
  MessageGlyph,
} from '@/registry/ndeko/ui/chat-message';
import { PromptSuggestion } from '@/registry/ndeko/ui/chat-prompt-suggestion';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/registry/ndeko/ui/chat-reasoning';
import { ScrollButton } from '@/registry/ndeko/ui/chat-scroll-button';
import {
  Source,
  SourceContent,
  SourceTrigger,
} from '@/registry/ndeko/ui/chat-source';
import {
  Steps,
  StepsContent,
  StepsItem,
  StepsTrigger,
} from '@/registry/ndeko/ui/chat-steps';
import { SystemMessage } from '@/registry/ndeko/ui/chat-system-message';
import { ThinkingBar } from '@/registry/ndeko/ui/chat-thinking-bar';
import { Tool, type ToolPart } from '@/registry/ndeko/ui/chat-tool';

const READER = {
  name: 'Lena Fischer',
  initials: 'LF',
  avatar: '/avatars/avatar-03.svg',
};

const ANSWER =
  'Three things changed: **cursor pagination** on `/documents`, a higher rate limit for workspace tokens, and a new endpoint to delete comments.';

const RELEASE_NOTES = [
  '### Release 2.4',
  '',
  'Three changes reach the public API:',
  '',
  '- **Pagination** on `/documents` uses a `cursor`',
  '- Workspace tokens get 120 requests a minute',
  '- `DELETE /comments/{id}` is new',
  '',
  '```ts',
  'const page = await atlas.documents.list({ cursor: next });',
  '```',
].join('\n');

const SDK_SNIPPET = [
  "import { Atlas } from '@atlas/sdk';",
  '',
  'const atlas = new Atlas({ token: process.env.ATLAS_TOKEN });',
  '',
  "const tasks = await atlas.tasks.list({ project: 'website-redesign' });",
].join('\n');

const REASONING =
  'The API reference was last edited before 2.4 shipped, so it is probably behind. I will read the 2.4 entry of the changelog first, then the parts of the reference it touches: **pagination**, rate limits and comments.';

const SEARCH_CALL: ToolPart = {
  type: 'search_docs',
  state: 'output-available',
  input: { query: 'pagination 2.4' },
  output: { matches: 3, top: 'API reference, Pagination' },
  toolCallId: 'call_7f2a',
};

const DRAFT_CALL: ToolPart = {
  type: 'draft_edit',
  state: 'input-available',
  input: { page: 'API reference', section: 'Pagination' },
};

const FETCH_CALL: ToolPart = {
  type: 'fetch_page',
  state: 'output-error',
  input: { url: 'https://docs.example.com/limits' },
  errorText: 'The page answered 404. Check the address and try again.',
};

const HISTORY = [
  'Kickoff notes are in Docs',
  'Pricing copy is ready for review',
  'Can someone check the hero on mobile?',
  'Looks fine on my phone',
  'The changelog layout is merged',
  'Docs search ships tomorrow',
  'Design review moved to Thursday',
  'I added the beta workspaces to the list',
  'Launch plan is attached to the project',
  'Last call for feedback on the pricing page',
];

const ILLUSTRATION_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'>",
  "<rect width='320' height='320' fill='rgb(99,102,241)' fill-opacity='0.1'/>",
  "<circle cx='224' cy='104' r='40' fill='rgb(99,102,241)' fill-opacity='0.35'/>",
  "<path d='M0 236 C70 170 140 170 210 226 L320 196 L320 320 L0 320 Z' fill='rgb(99,102,241)' fill-opacity='0.45'/>",
  "<path d='M0 276 C90 226 190 236 320 264 L320 320 L0 320 Z' fill='rgb(99,102,241)' fill-opacity='0.85'/>",
  '</svg>',
].join('');

const ILLUSTRATION_BASE64 = Buffer.from(ILLUSTRATION_SVG).toString('base64');

const SUGGESTIONS = [
  'Summarise this thread',
  'Draft a reply',
  'List open tasks',
];

const SEARCH_SUGGESTIONS = [
  'Draft the release notes for 2.4',
  'Compare this release with 2.3',
];

const SEARCH_TERM = 'release';

export function MessageDemo() {
  return (
    <div className='flex w-full max-w-md flex-col gap-5'>
      <Message className='justify-end'>
        <MessageContent className='max-w-[80%]'>
          Can you sum up what changed in the 2.4 release?
        </MessageContent>
        <MessageAvatar
          src={READER.avatar}
          alt={READER.name}
          fallback={READER.initials}
        />
      </Message>
      <Message>
        <MessageGlyph>
          <FeatherIcon />
        </MessageGlyph>
        <div className='min-w-0 flex-1 space-y-2 pt-1'>
          <MessageContent variant='plain' markdown>
            {ANSWER}
          </MessageContent>
          <MessageActions className='-ms-1.5'>
            <MessageAction tooltip='Copy'>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Copy'
                className='text-muted-foreground'
              >
                <CopyIcon className='size-3.5' />
              </Button>
            </MessageAction>
            <MessageAction tooltip='Helpful'>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Helpful'
                className='text-muted-foreground'
              >
                <ThumbsUpIcon className='size-3.5' />
              </Button>
            </MessageAction>
          </MessageActions>
        </div>
      </Message>
    </div>
  );
}

export function MarkdownDemo() {
  return <Markdown className='w-full max-w-md'>{RELEASE_NOTES}</Markdown>;
}

export function CodeBlockDemo() {
  return (
    <CodeBlock className='w-full max-w-md'>
      <CodeBlockGroup>
        <CodeBlockLanguage>typescript</CodeBlockLanguage>
        <CodeBlockCopyButton code={SDK_SNIPPET} />
      </CodeBlockGroup>
      <CodeBlockCode code={SDK_SNIPPET} language='typescript' />
    </CodeBlock>
  );
}

export function ToolDemo() {
  return (
    <div className='flex w-full max-w-md flex-col gap-2'>
      <Tool toolPart={SEARCH_CALL} defaultOpen />
      <Tool toolPart={DRAFT_CALL} />
      <Tool toolPart={FETCH_CALL} />
    </div>
  );
}

export function SystemMessageDemo() {
  return (
    <div className='flex w-full max-w-md flex-col gap-2'>
      <SystemMessage cta={{ label: 'Reconnect', variant: 'outline' }}>
        The assistant lost its access to Atlas Docs
      </SystemMessage>
      <SystemMessage variant='warning' fill>
        Two messages left on the free plan today
      </SystemMessage>
      <SystemMessage variant='error' fill cta={{ label: 'Try again' }}>
        The reply could not be written
      </SystemMessage>
    </div>
  );
}

export function LoaderDemo() {
  return (
    <div className='flex flex-col items-center gap-6'>
      <div className='flex items-center gap-6'>
        <Loader variant='spinner' text='Loading' />
        <Loader variant='dots' text='Waiting for a reply' />
        <Loader variant='pulse' text='Connecting' />
        <Loader variant='bars' text='Listening' />
      </div>
      <Loader variant='text' text='Thinking' />
    </div>
  );
}

export function ThinkingBarDemo() {
  return <ThinkingBar className='max-w-xs' text='Reading the changelog' />;
}

export function ReasoningDemo() {
  return (
    <Reasoning className='w-full max-w-xs' defaultOpen>
      <ReasoningTrigger>Thought for 6 seconds</ReasoningTrigger>
      <ReasoningContent markdown>{REASONING}</ReasoningContent>
    </Reasoning>
  );
}

export function ChainOfThoughtDemo() {
  return (
    <ChainOfThought className='w-full max-w-xs'>
      <ChainOfThoughtStep defaultOpen>
        <ChainOfThoughtTrigger leftIcon={<SearchIcon />}>
          Searched the changelog
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            Found the 2.4 entry, from March 18
          </ChainOfThoughtItem>
          <ChainOfThoughtItem>
            Three changes touch the public API
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger leftIcon={<FileTextIcon />}>
          Read the API reference
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            Pagination still documents the page parameter
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger leftIcon={<PencilIcon />}>
          Drafted the edits
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            Two suggestions are ready to review
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
    </ChainOfThought>
  );
}

export function StepsDemo() {
  return (
    <Steps className='w-full max-w-xs'>
      <StepsTrigger leftIcon={<SearchIcon />}>Searched 3 sources</StepsTrigger>
      <StepsContent>
        <StepsItem>The API reference, pagination section</StepsItem>
        <StepsItem>The 2.4 entry of the changelog</StepsItem>
        <StepsItem>An issue about cursor pagination</StepsItem>
      </StepsContent>
    </Steps>
  );
}

export function SourceDemo() {
  return (
    <p className='max-w-xs text-sm leading-relaxed'>
      Workspace tokens now get 120 requests a minute{' '}
      <Source href='https://docs.example.com/rate-limits'>
        <SourceTrigger label={1} />
        <SourceContent
          title='Rate limits'
          description='Requests per minute for each kind of token, and what happens past the limit.'
        />
      </Source>{' '}
      and pagination moved to cursors{' '}
      <Source href='https://changelog.example.com/2-4'>
        <SourceTrigger showMark />
        <SourceContent
          title='Changelog 2.4'
          description='Cursor pagination, a new comment endpoint and higher rate limits.'
        />
      </Source>
    </p>
  );
}

export function ImageDemo() {
  return (
    <div className='grid w-full max-w-xs grid-cols-2 gap-3'>
      <Image
        base64={ILLUSTRATION_BASE64}
        mediaType='image/svg+xml'
        alt='Generated illustration of two hills under a pale sun'
        className='aspect-square w-full'
      />
      <Image alt='A second illustration, still generating' className='w-full' />
    </div>
  );
}

export function PromptSuggestionDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-4'>
      <div className='flex flex-wrap gap-2'>
        {SUGGESTIONS.map((suggestion) => (
          <PromptSuggestion key={suggestion}>{suggestion}</PromptSuggestion>
        ))}
      </div>
      <div className='flex flex-col'>
        {SEARCH_SUGGESTIONS.map((suggestion) => (
          <PromptSuggestion key={suggestion} highlight={SEARCH_TERM}>
            {suggestion}
          </PromptSuggestion>
        ))}
      </div>
    </div>
  );
}

export function FeedbackBarDemo() {
  return <FeedbackBar />;
}

export function ScrollButtonDemo() {
  return (
    <ChatContainerRoot className='hairline-ring ring-border h-56 w-full max-w-xs rounded-lg'>
      <ChatContainerContent className='gap-2 p-3'>
        {HISTORY.map((line) => (
          <p
            key={line}
            className='bg-foreground/[0.05] dark:bg-foreground/[0.07] w-fit max-w-[85%] rounded-xl px-3 py-1.5 text-[13px]'
          >
            {line}
          </p>
        ))}
      </ChatContainerContent>
      <div className='pointer-events-none absolute inset-x-0 bottom-3 flex justify-center'>
        <ScrollButton wrapperClassName='pointer-events-auto' />
      </div>
    </ChatContainerRoot>
  );
}
