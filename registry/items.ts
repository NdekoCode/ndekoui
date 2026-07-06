import { aiFoundationItems, aiItems } from './ai-items';
import { chatItems } from './chat-items';

import {
  BASE_UI,
  CVA,
  primitive,
  type RegistryItemDefinition,
} from './item-kit';

export type {
  RegistryItemDefinition,
  RegistryItemFile,
  RegistryItemType,
} from './item-kit';

export const foundationItems: RegistryItemDefinition[] = [
  {
    name: 'utils',
    type: 'registry:lib',
    title: 'cn',
    description:
      'Class merging that knows the hairline utilities of the ndekoui theme.',
    files: [{ path: 'registry/ndeko/lib/utils.ts', type: 'registry:lib' }],
    dependencies: ['clsx', 'tailwind-merge'],
    categories: ['foundations'],
  },
  {
    name: 'icons',
    type: 'registry:lib',
    title: 'Icons',
    description:
      'One icon module: Hugeicons behind semantic names, stroke 1.75 by default.',
    files: [{ path: 'registry/ndeko/lib/icons.tsx', type: 'registry:lib' }],
    dependencies: ['@hugeicons/react', '@hugeicons/core-free-icons'],
    categories: ['foundations'],
  },
  {
    name: 'recipes',
    type: 'registry:lib',
    title: 'Recipes',
    description:
      'Shared class recipes: the field control, floating surfaces, menu rows.',
    files: [{ path: 'registry/ndeko/lib/recipes.ts', type: 'registry:lib' }],
    categories: ['foundations'],
  },
  {
    name: 'agent-run',
    type: 'registry:lib',
    title: 'Agent run',
    description:
      'The shape of an agent run every AI view reads (agents, plan, tool calls, approvals, usage), a tiny store to feed it events from any backend, and the formats for time, tokens and cost.',
    files: [{ path: 'registry/ndeko/lib/agent-run.ts', type: 'registry:lib' }],
    registryDependencies: ['theme'],
    categories: ['foundations'],
  },
  {
    name: 'seeded',
    type: 'registry:lib',
    title: 'Seeded',
    description:
      'A number drawn from a text, the same on the server and in the browser, and a pick from a list by its bits.',
    files: [{ path: 'registry/ndeko/lib/seeded.ts', type: 'registry:lib' }],
    categories: ['foundations'],
  },
  {
    name: 'mesh',
    type: 'registry:lib',
    title: 'Mesh',
    description:
      'The gradient that stands for a name with no picture: a hue and a light drawn from the name, or a colour that already means something.',
    files: [{ path: 'registry/ndeko/lib/mesh.ts', type: 'registry:lib' }],
    registryDependencies: ['theme'],
    categories: ['foundations'],
  },
  {
    name: 'brand-logos',
    type: 'registry:lib',
    title: 'Brand logos',
    description:
      'Marks of the tools the integration blocks show, from Simple Icons, drawn in their brand colour and readable in both themes.',
    files: [
      { path: 'registry/ndeko/lib/brand-logos.tsx', type: 'registry:lib' },
    ],
    registryDependencies: ['theme', 'utils'],
    categories: ['foundations'],
  },
];

export const primitiveItems: RegistryItemDefinition[] = [
  primitive('button', 'Button', 'Pill buttons in six variants and six sizes.', {
    dependencies: [BASE_UI, CVA],
  }),
  primitive('input', 'Input', 'A text field on the shared control recipe.', {
    dependencies: [BASE_UI],
    registryDependencies: ['recipes'],
  }),
  primitive('textarea', 'Textarea', 'A field that grows with its content.', {
    registryDependencies: ['recipes'],
  }),
  primitive('label', 'Label', 'The label of a control.'),
  primitive(
    'field',
    'Field',
    'Label, description and error wired to a control.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['label'],
    }
  ),
  primitive('badge', 'Badge', 'Soft status pairs, readable in both themes.', {
    dependencies: [BASE_UI, CVA],
  }),
  primitive('chip', 'Chip', 'A 3D label in any colour, for assigned values.'),
  primitive('card', 'Card', 'A surface on one hairline with a soft shadow.'),
  primitive('separator', 'Separator', 'A one device pixel line.', {
    dependencies: [BASE_UI],
  }),
  primitive('skeleton', 'Skeleton', 'A light placeholder while content loads.'),
  primitive('kbd', 'Kbd', 'A key cap for shortcuts.'),
  primitive(
    'avatar',
    'Avatar',
    'A picture, or a gradient drawn from a name for someone without one, opaque in stacks.',
    {
      dependencies: [BASE_UI],
    }
  ),
  primitive(
    'mesh-tile',
    'Mesh Tile',
    'The picture of an agent, a team or a project with no logo: a gradient drawn from its name, in its own colour when it has one.'
  ),
  primitive(
    'wash',
    'Wash',
    'Ink with grain behind the content of the one featured surface, or of what is live right now in the hue of its state.'
  ),
  primitive(
    'company-mark',
    'Company Mark',
    'The mark of a company with no logo to show: a shape and a colour drawn from its name, in the square a real logo would fill.'
  ),
  primitive('checkbox', 'Checkbox', 'A checkbox whose mark scales in.', {
    dependencies: [BASE_UI],
    registryDependencies: ['icons'],
  }),
  primitive(
    'switch',
    'Switch',
    'A switch whose thumb stretches while pressed.',
    {
      dependencies: [BASE_UI],
    }
  ),
  primitive(
    'radio-group',
    'Radio Group',
    'Native radio semantics, drawn on the theme.',
    {
      dependencies: [BASE_UI],
    }
  ),
  primitive('spinner', 'Spinner', 'A loader with an accessible name.', {
    registryDependencies: ['icons'],
  }),
  primitive(
    'selected-mark',
    'Selected Mark',
    'The mark of the picked row in a menu.',
    {
      registryDependencies: ['icons'],
    }
  ),
  primitive(
    'status-orb',
    'Status Orb',
    'The mark of a message kind: success, error, warning, info.',
    {
      registryDependencies: ['icons'],
      categories: ['primitives', 'feedback'],
    }
  ),
  primitive(
    'tooltip',
    'Tooltip',
    'A small bubble with an arrow, after a short pause.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['animated-size'],
    }
  ),
  primitive('popover', 'Popover', 'A raised panel anchored to its trigger.', {
    dependencies: [BASE_UI],
    registryDependencies: ['recipes'],
  }),
  primitive(
    'dropdown-menu',
    'Dropdown Menu',
    'Action menus with 32px rows, checkable items and submenus.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['icons', 'recipes', 'selected-mark'],
    }
  ),
  primitive(
    'animated-size',
    'Animated Size',
    'A container that animates its height or width to fit content that changes.',
    {
      dependencies: ['motion'],
    }
  ),
  primitive(
    'dialog',
    'Dialog',
    'A modal dialog that fades and scales in and resizes with its content.',
    {
      dependencies: [BASE_UI, 'motion'],
      registryDependencies: ['icons', 'recipes', 'button', 'animated-size'],
    }
  ),
  primitive(
    'alert-dialog',
    'Alert Dialog',
    'A dialog that asks to confirm a consequence.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['recipes', 'button'],
    }
  ),
  primitive(
    'sheet',
    'Sheet',
    'A dialog docked to an edge, floating 8px from it.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['icons', 'recipes', 'button'],
    }
  ),
  primitive(
    'select',
    'Select',
    'A select on the control recipe with a menu popup.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['icons', 'recipes', 'selected-mark'],
    }
  ),
  primitive(
    'tabs',
    'Tabs',
    'Underlined or segmented tabs with one sliding indicator.',
    {
      dependencies: [BASE_UI],
    }
  ),
  primitive(
    'accordion',
    'Accordion',
    'Panels that open by animating their height.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['icons'],
    }
  ),
  primitive('collapsible', 'Collapsible', 'One panel that opens and closes.', {
    dependencies: [BASE_UI],
  }),
  primitive('toggle', 'Toggle', 'A button that stays pressed.', {
    dependencies: [BASE_UI, CVA],
  }),
  primitive('toggle-group', 'Toggle Group', 'Toggles that share one value.', {
    dependencies: [BASE_UI, CVA],
    registryDependencies: ['toggle'],
  }),
  primitive('slider', 'Slider', 'One or several thumbs on a thin track.', {
    dependencies: [BASE_UI],
  }),
  primitive(
    'progress',
    'Progress',
    'A thin bar with an optional label and value.',
    {
      dependencies: [BASE_UI],
    }
  ),
  primitive(
    'scroll-area',
    'Scroll Area',
    'Thin scrollbars that show while you scroll.',
    {
      dependencies: [BASE_UI],
    }
  ),
  primitive(
    'hover-card',
    'Hover Card',
    'A raised card that previews a link after a short pause.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['recipes'],
    }
  ),
  primitive(
    'checkbox-tree',
    'Checkbox Tree',
    'Nested checkboxes where a parent reflects its children.'
  ),
  primitive('breadcrumb', 'Breadcrumb', 'Where the page sits, as links.', {
    dependencies: [BASE_UI],
    registryDependencies: ['icons'],
  }),
  primitive(
    'pagination',
    'Pagination',
    'Pages as pill links, the current one outlined.',
    {
      registryDependencies: ['icons', 'button'],
    }
  ),
  primitive(
    'select-native',
    'Native Select',
    'The browser select on the control recipe.',
    {
      registryDependencies: ['icons', 'recipes'],
    }
  ),
  primitive('table', 'Table', 'Rows on hairlines with tabular figures.'),
  primitive('cropper', 'Cropper', 'An image crop area you can drag and zoom.', {
    dependencies: ['@origin-space/image-cropper'],
  }),
  primitive(
    'command',
    'Command',
    'A searchable list of actions, inline or in a palette dialog.',
    {
      dependencies: ['cmdk'],
      registryDependencies: ['icons', 'recipes', 'dialog'],
    }
  ),
  primitive(
    'combobox',
    'Combobox',
    'A filterable select, single or multiple with chips.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['icons', 'recipes', 'selected-mark'],
    }
  ),
  primitive('otp-field', 'OTP Field', 'One box per character of a code.', {
    dependencies: [BASE_UI],
    registryDependencies: ['recipes'],
  }),
  primitive(
    'navigation-menu',
    'Navigation Menu',
    'Site navigation whose panel slides and resizes between items.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['icons'],
    }
  ),
  primitive('stepper', 'Stepper', 'Numbered steps that fill as you advance.', {
    dependencies: [BASE_UI],
    registryDependencies: ['icons'],
  }),
  primitive(
    'timeline',
    'Timeline',
    'Events on a line, past ones in the brand hue.',
    {
      dependencies: [BASE_UI],
    }
  ),
  primitive('tree', 'Tree', 'Nested items you can expand, select and drag.', {
    dependencies: [BASE_UI, '@headless-tree/core', '@headless-tree/react'],
    registryDependencies: ['icons'],
  }),
  primitive('calendar', 'Calendar', 'A month grid for days and ranges.', {
    dependencies: ['react-day-picker'],
    registryDependencies: ['icons', 'button'],
  }),
  primitive(
    'calendar-rac',
    'Calendar (React Aria)',
    'Accessible calendar and range calendar on React Aria.',
    {
      dependencies: ['react-aria-components', '@internationalized/date'],
      registryDependencies: ['icons'],
    }
  ),
  primitive(
    'datefield-rac',
    'Date Field (React Aria)',
    'Dates and times typed segment by segment.',
    {
      dependencies: ['react-aria-components'],
    }
  ),
  primitive(
    'sonner',
    'Toaster',
    'Toasts that carry a status orb, bottom right.',
    {
      dependencies: ['sonner', 'next-themes'],
      registryDependencies: ['status-orb'],
      categories: ['primitives', 'feedback'],
    }
  ),
];

export const registryItems: RegistryItemDefinition[] = [
  ...foundationItems,
  ...aiFoundationItems,
  ...primitiveItems,
  ...chatItems,
  ...aiItems,
];
