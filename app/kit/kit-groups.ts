import {
  ButtonDemo,
  DropdownMenuDemo,
  ToggleDemo,
  ToggleGroupDemo,
} from './_demos/actions-demos';
import {
  ChainOfThoughtDemo,
  CodeBlockDemo,
  FeedbackBarDemo,
  ImageDemo,
  LoaderDemo,
  MarkdownDemo,
  MessageDemo,
  PromptSuggestionDemo,
  ReasoningDemo,
  ScrollButtonDemo,
  SourceDemo,
  StepsDemo,
  SystemMessageDemo,
  ThinkingBarDemo,
  ToolDemo,
} from './_demos/chat-demos';
import {
  ChatContainerDemo,
  ChatMotionDemo,
  FileUploadDemo,
  PromptInputDemo,
  ResponseStreamDemo,
} from './_demos/chat-live';
import {
  AccordionDemo,
  AvatarDemo,
  BadgeDemo,
  ChipDemo,
  KbdDemo,
  TableDemo,
  TimelineDemo,
} from './_demos/data-display-demos';
import { SelectedMarkDemo, TreeDemo } from './_demos/data-display-live';
import {
  SkeletonDemo,
  SpinnerDemo,
  StatusOrbDemo,
} from './_demos/feedback-demos';
import { ProgressDemo, ToasterDemo } from './_demos/feedback-live';
import {
  CheckboxDemo,
  CropperDemo,
  FieldDemo,
  InputDemo,
  LabelDemo,
  OtpFieldDemo,
  RadioGroupDemo,
  SelectDemo,
  SelectNativeDemo,
  SliderDemo,
  SwitchDemo,
  TextareaDemo,
} from './_demos/forms-demos';
import {
  CalendarDemo,
  CalendarRacDemo,
  CheckboxTreeDemo,
  ComboboxDemo,
  DateFieldDemo,
} from './_demos/forms-live';
import {
  CardDemo,
  CollapsibleDemo,
  ScrollAreaDemo,
  SeparatorDemo,
} from './_demos/layout-demos';
import { AnimatedSizeDemo } from './_demos/layout-live';
import {
  BreadcrumbDemo,
  StepperDemo,
  TabsDemo,
} from './_demos/navigation-demos';
import { NavigationMenuDemo, PaginationDemo } from './_demos/navigation-live';
import {
  AlertDialogDemo,
  HoverCardDemo,
  PopoverDemo,
  SheetDemo,
  TooltipDemo,
} from './_demos/overlays-demos';
import { CommandDemo, DialogDemo } from './_demos/overlays-live';
import type { KitGroup } from './kit-types';

export const KIT_GROUPS: KitGroup[] = [
  {
    id: 'actions',
    title: 'Actions',
    description: 'Buttons, toggles and the menus they open.',
    units: [
      { name: 'button', width: 'full', Demo: ButtonDemo },
      { name: 'toggle', width: 'compact', Demo: ToggleDemo },
      { name: 'toggle-group', width: 'compact', Demo: ToggleGroupDemo },
      { name: 'dropdown-menu', width: 'compact', Demo: DropdownMenuDemo },
    ],
  },
  {
    id: 'forms',
    title: 'Forms',
    description: 'Every way to type, pick and toggle a value, down to a date.',
    units: [
      { name: 'label', width: 'compact', Demo: LabelDemo },
      { name: 'input', width: 'compact', Demo: InputDemo },
      { name: 'textarea', width: 'compact', Demo: TextareaDemo },
      { name: 'field', width: 'compact', Demo: FieldDemo },
      { name: 'select', width: 'compact', Demo: SelectDemo },
      { name: 'select-native', width: 'compact', Demo: SelectNativeDemo },
      { name: 'combobox', width: 'compact', Demo: ComboboxDemo },
      { name: 'checkbox', width: 'compact', Demo: CheckboxDemo },
      { name: 'checkbox-tree', width: 'compact', Demo: CheckboxTreeDemo },
      { name: 'radio-group', width: 'compact', Demo: RadioGroupDemo },
      { name: 'switch', width: 'compact', Demo: SwitchDemo },
      { name: 'slider', width: 'compact', Demo: SliderDemo },
      { name: 'otp-field', width: 'compact', Demo: OtpFieldDemo },
      { name: 'datefield-rac', width: 'compact', Demo: DateFieldDemo },
      { name: 'cropper', width: 'compact', Demo: CropperDemo },
      { name: 'calendar', width: 'full', Demo: CalendarDemo },
      { name: 'calendar-rac', width: 'full', Demo: CalendarRacDemo },
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    description: 'Layers that open above the page.',
    units: [
      { name: 'tooltip', width: 'compact', Demo: TooltipDemo },
      { name: 'popover', width: 'compact', Demo: PopoverDemo },
      { name: 'hover-card', width: 'compact', Demo: HoverCardDemo },
      { name: 'dialog', width: 'compact', Demo: DialogDemo },
      { name: 'alert-dialog', width: 'compact', Demo: AlertDialogDemo },
      { name: 'sheet', width: 'compact', Demo: SheetDemo },
      { name: 'command', width: 'wide', Demo: CommandDemo },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Moving between pages, sections and steps.',
    units: [
      { name: 'navigation-menu', width: 'full', Demo: NavigationMenuDemo },
      { name: 'stepper', width: 'full', Demo: StepperDemo },
      { name: 'tabs', width: 'wide', Demo: TabsDemo },
      { name: 'pagination', width: 'wide', Demo: PaginationDemo },
      { name: 'breadcrumb', width: 'wide', Demo: BreadcrumbDemo },
    ],
  },
  {
    id: 'data-display',
    title: 'Data display',
    description: 'Labels, people, lists, trees and tables.',
    units: [
      { name: 'avatar', width: 'compact', Demo: AvatarDemo },
      { name: 'badge', width: 'compact', Demo: BadgeDemo },
      { name: 'chip', width: 'compact', Demo: ChipDemo },
      { name: 'kbd', width: 'compact', Demo: KbdDemo },
      { name: 'selected-mark', width: 'compact', Demo: SelectedMarkDemo },
      { name: 'tree', width: 'compact', Demo: TreeDemo },
      { name: 'accordion', width: 'wide', Demo: AccordionDemo },
      { name: 'timeline', width: 'wide', Demo: TimelineDemo },
      { name: 'table', width: 'full', Demo: TableDemo },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    description: 'What is loading, and what just happened.',
    units: [
      { name: 'status-orb', width: 'compact', Demo: StatusOrbDemo },
      { name: 'spinner', width: 'compact', Demo: SpinnerDemo },
      { name: 'progress', width: 'compact', Demo: ProgressDemo },
      { name: 'skeleton', width: 'compact', Demo: SkeletonDemo },
      { name: 'sonner', width: 'compact', Demo: ToasterDemo },
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    description: 'Surfaces, lines and panels that hold the rest.',
    units: [
      { name: 'card', width: 'compact', Demo: CardDemo },
      { name: 'separator', width: 'compact', Demo: SeparatorDemo },
      { name: 'scroll-area', width: 'compact', Demo: ScrollAreaDemo },
      { name: 'collapsible', width: 'compact', Demo: CollapsibleDemo },
      { name: 'animated-size', width: 'compact', Demo: AnimatedSizeDemo },
    ],
  },
  {
    id: 'chat',
    title: 'Chat',
    description:
      'The pieces of an assistant conversation: messages, composer, reasoning and tools.',
    units: [
      { name: 'chat-message', width: 'wide', Demo: MessageDemo },
      { name: 'chat-container', width: 'wide', Demo: ChatContainerDemo },
      { name: 'chat-prompt-input', width: 'wide', Demo: PromptInputDemo },
      { name: 'chat-response-stream', width: 'wide', Demo: ResponseStreamDemo },
      { name: 'chat-markdown', width: 'wide', Demo: MarkdownDemo },
      { name: 'chat-code-block', width: 'wide', Demo: CodeBlockDemo },
      { name: 'chat-tool', width: 'wide', Demo: ToolDemo },
      { name: 'chat-system-message', width: 'wide', Demo: SystemMessageDemo },
      { name: 'chat-motion', width: 'compact', Demo: ChatMotionDemo },
      { name: 'chat-loader', width: 'compact', Demo: LoaderDemo },
      { name: 'chat-thinking-bar', width: 'compact', Demo: ThinkingBarDemo },
      { name: 'chat-reasoning', width: 'compact', Demo: ReasoningDemo },
      {
        name: 'chat-chain-of-thought',
        width: 'compact',
        Demo: ChainOfThoughtDemo,
      },
      { name: 'chat-steps', width: 'compact', Demo: StepsDemo },
      { name: 'chat-source', width: 'compact', Demo: SourceDemo },
      { name: 'chat-image', width: 'compact', Demo: ImageDemo },
      { name: 'chat-file-upload', width: 'compact', Demo: FileUploadDemo },
      {
        name: 'chat-prompt-suggestion',
        width: 'compact',
        Demo: PromptSuggestionDemo,
      },
      { name: 'chat-feedback-bar', width: 'compact', Demo: FeedbackBarDemo },
      { name: 'chat-scroll-button', width: 'compact', Demo: ScrollButtonDemo },
    ],
  },
];
