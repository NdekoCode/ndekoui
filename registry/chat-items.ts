import { BASE_UI, primitive, type RegistryItemDefinition } from './item-kit';

const CHAT = ['primitives', 'chat'];

export const chatItems: RegistryItemDefinition[] = [
  primitive(
    'chat-motion',
    'Chat Motion',
    'The swap and the fold the chat pieces share: an icon that becomes another, a panel that folds into its trigger.',
    {
      dependencies: ['motion'],
      registryDependencies: ['animated-size'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-container',
    'Chat Container',
    'A message list that follows new content while you are at the bottom and lets go when you scroll up.',
    {
      dependencies: ['motion', 'use-stick-to-bottom'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-code-block',
    'Chat Code Block',
    'Code highlighted in the light and dark themes, with a copy button that turns into a check.',
    {
      dependencies: ['shiki'],
      registryDependencies: ['icons', 'button', 'chat-motion'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-markdown',
    'Chat Markdown',
    'Model output as safe markdown: no raw HTML, external links without referrer, code blocks highlighted.',
    {
      dependencies: ['marked', 'react-markdown', 'remark-breaks', 'remark-gfm'],
      registryDependencies: ['chat-code-block'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-message',
    'Chat Message',
    'A message with its avatar or glyph, a bubble or plain body, and actions explained by tooltips.',
    {
      registryDependencies: ['avatar', 'tooltip', 'chat-markdown'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-prompt-input',
    'Chat Prompt Input',
    'A composer whose textarea grows with the text, with actions and a Send button that becomes Stop.',
    {
      registryDependencies: [
        'icons',
        'recipes',
        'button',
        'textarea',
        'tooltip',
        'chat-motion',
      ],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-loader',
    'Chat Loader',
    'Waiting marks for a reply: a spinner, dots, a pulse, bars or a Thinking label that breathes.',
    {
      dependencies: ['motion'],
      registryDependencies: ['spinner'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-reasoning',
    'Chat Reasoning',
    'The reasoning behind a reply, open while it streams and folded once the answer starts.',
    {
      registryDependencies: ['icons', 'chat-markdown', 'chat-motion'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-tool',
    'Chat Tool',
    'A tool call with its state, opening onto its input and output and resizing as the output arrives.',
    {
      registryDependencies: ['icons', 'badge', 'chat-motion'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-steps',
    'Chat Steps',
    'Steps the assistant took, on a thin line, behind a trigger that opens and closes them.',
    {
      registryDependencies: ['icons', 'collapsible'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-source',
    'Chat Source',
    'A cited page as a small pill that previews its title and summary after a short pause.',
    {
      registryDependencies: ['hover-card'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-scroll-button',
    'Chat Scroll Button',
    'A button that appears once you scroll away from the latest message and brings you back.',
    {
      dependencies: ['motion'],
      registryDependencies: ['icons', 'button', 'chat-container'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-file-upload',
    'Chat File Upload',
    'Files from the picker or dropped on the window, with a layer that shows while they are dragged in.',
    {
      dependencies: [BASE_UI, 'motion'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-response-stream',
    'Chat Response Stream',
    'A reply revealed word by word or character by character, from a fixed text or an async stream.',
    {
      categories: CHAT,
    }
  ),
  primitive(
    'chat-thinking-bar',
    'Chat Thinking Bar',
    'A live Thinking line with a way to open the reasoning or to get the answer now.',
    {
      registryDependencies: ['icons', 'button', 'chat-loader'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-feedback-bar',
    'Chat Feedback Bar',
    'Asks whether a reply helped and becomes a thank you once you answer.',
    {
      registryDependencies: ['icons', 'animated-size', 'button', 'chat-motion'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-system-message',
    'Chat System Message',
    'A notice from the app inside the conversation, neutral, warning or error, with an optional action.',
    {
      registryDependencies: ['icons', 'button'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-prompt-suggestion',
    'Chat Prompt Suggestion',
    'A prompt to start from, as a pill or as a list row that marks the typed match.',
    {
      registryDependencies: ['button'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-chain-of-thought',
    'Chat Chain of Thought',
    'Steps of thought on one thread, each opening onto its details.',
    {
      registryDependencies: ['icons', 'collapsible'],
      categories: CHAT,
    }
  ),
  primitive(
    'chat-image',
    'Chat Image',
    'An image a model produced, from base64 or raw bytes, with a placeholder until it is there.',
    {
      registryDependencies: ['skeleton'],
      categories: CHAT,
    }
  ),
];
