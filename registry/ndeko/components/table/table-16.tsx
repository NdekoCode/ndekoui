'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS, type Transform } from '@dnd-kit/utilities';
import {
  type Cell,
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Header,
  type SortDirection,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

type Status = 'Active' | 'Inactive' | 'Pending';

type Account = {
  id: string;
  name: string;
  email: string;
  location: string;
  status: Status;
  balance: number;
};

const STATUS_VARIANTS = {
  Active: 'success',
  Inactive: 'secondary',
  Pending: 'warning',
} as const;

const ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Jordan Hayes',
    email: 'jordan.hayes@example.com',
    location: 'Toronto, Canada',
    status: 'Active',
    balance: 1250,
  },
  {
    id: '2',
    name: 'Anna Novak',
    email: 'anna.novak@example.com',
    location: 'Prague, Czechia',
    status: 'Active',
    balance: 600,
  },
  {
    id: '3',
    name: 'Kenji Watanabe',
    email: 'kenji.watanabe@example.com',
    location: 'Osaka, Japan',
    status: 'Inactive',
    balance: 650,
  },
  {
    id: '4',
    name: 'Lina Haddad',
    email: 'lina.haddad@example.com',
    location: 'Lyon, France',
    status: 'Active',
    balance: 0,
  },
  {
    id: '5',
    name: 'Ama Mensah',
    email: 'ama.mensah@example.com',
    location: 'Accra, Ghana',
    status: 'Pending',
    balance: -1000,
  },
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const FIGURE_COLUMNS = new Set(['balance']);

const COLUMNS: ColumnDef<Account>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    sortDescFirst: false,
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.email}</span>
    ),
  },
  {
    id: 'location',
    header: 'Location',
    accessorKey: 'location',
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: 'balance',
    header: 'Balance',
    accessorKey: 'balance',
    cell: ({ row }) => CURRENCY.format(row.original.balance),
  },
];

const INITIAL_ORDER = COLUMNS.map((column) => String(column.id));

const TRAVEL = { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' };

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const GLYPH_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function isFigureColumn(columnId: string) {
  return FIGURE_COLUMNS.has(columnId);
}

function alignClassOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'text-right tabular-nums';
  }
  return undefined;
}

function labelOf(column: Column<Account>) {
  const header = column.columnDef.header;
  if (typeof header === 'string') {
    return header;
  }
  return column.id;
}

function ariaSortOf(column: Column<Account>) {
  const direction = column.getIsSorted();
  if (direction === 'asc') {
    return 'ascending';
  }
  if (direction === 'desc') {
    return 'descending';
  }
  return 'none';
}

function headLayoutOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'justify-between';
  }
  return undefined;
}

function sortButtonOrderOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'flex-row-reverse';
  }
  return undefined;
}

function draggingAttributeOf(isDragging: boolean) {
  if (isDragging) {
    return '';
  }
  return undefined;
}

function layerOf(isDragging: boolean) {
  if (isDragging) {
    return 1;
  }
  return 0;
}

function sortableStyleOf(
  transform: Transform | null,
  transition: string | undefined,
  isDragging: boolean,
  width: number
): React.CSSProperties {
  return {
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition,
    width,
    zIndex: layerOf(isDragging),
  };
}

function glyphVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return GLYPH_VARIANTS;
}

function sortGlyphOf(direction: false | SortDirection) {
  if (direction === 'asc') {
    return {
      key: 'asc',
      icon: <ChevronUpIcon className='text-foreground size-3.5' />,
    };
  }
  if (direction === 'desc') {
    return {
      key: 'desc',
      icon: <ChevronDownIcon className='text-foreground size-3.5' />,
    };
  }
  return {
    key: 'none',
    icon: <ChevronsUpDownIcon className='size-3.5 opacity-40' />,
  };
}

function SortGlyph({ direction }: { direction: false | SortDirection }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = glyphVariantsOf(shouldReduceMotion);
  const glyph = sortGlyphOf(direction);

  return (
    <span aria-hidden='true' className='relative inline-flex size-3.5'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={glyph.key}
          className='inline-flex'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {glyph.icon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function DraggableHead({ header }: { header: Header<Account, unknown> }) {
  const { column } = header;
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id, transition: TRAVEL });
  const style = sortableStyleOf(
    transform,
    transition,
    isDragging,
    column.getSize()
  );
  const label = labelOf(column);

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      aria-sort={ariaSortOf(column)}
      data-dragging={draggingAttributeOf(isDragging)}
      className='before:bg-border data-dragging:bg-card relative whitespace-nowrap transition-[background-color] before:absolute before:inset-y-2 before:start-0 before:w-(--hairline) first:before:hidden data-dragging:shadow-[0_4px_12px_rgb(0_0_0/0.08)]'
    >
      <div className={cn('flex items-center gap-0.5', headLayoutOf(column.id))}>
        <Button
          variant='ghost'
          size='icon-sm'
          className='text-muted-foreground hover:text-foreground -ms-2 cursor-grab in-data-dragging:cursor-grabbing'
          {...attributes}
          {...listeners}
          aria-label={`Reorder the ${label} column`}
        >
          <GripVerticalIcon />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={column.getToggleSortingHandler()}
          className={cn(
            'text-muted-foreground hover:text-foreground gap-1.5 px-1.5',
            sortButtonOrderOf(column.id)
          )}
        >
          {flexRender(column.columnDef.header, header.getContext())}
          <SortGlyph direction={column.getIsSorted()} />
        </Button>
      </div>
    </TableHead>
  );
}

function DragAlongCell({ cell }: { cell: Cell<Account, unknown> }) {
  const { column } = cell;
  const { isDragging, setNodeRef, transform, transition } = useSortable({
    id: column.id,
    transition: TRAVEL,
  });
  const style = sortableStyleOf(
    transform,
    transition,
    isDragging,
    column.getSize()
  );

  return (
    <TableCell
      ref={setNodeRef}
      style={style}
      data-dragging={draggingAttributeOf(isDragging)}
      className={cn('data-dragging:bg-card truncate', alignClassOf(column.id))}
    >
      {flexRender(column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}

export default function Table16() {
  const dndId = useId();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(INITIAL_ORDER);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: ACCOUNTS,
    columns: COLUMNS,
    state: { sorting, columnOrder },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  });

  function moveColumn(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    setColumnOrder((current) => {
      const fromIndex = current.indexOf(activeId);
      const toIndex = current.indexOf(overId);
      return arrayMove(current, fromIndex, toIndex);
    });
  }

  return (
    <div className='w-full'>
      <DndContext
        id={dndId}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={moveColumn}
        sensors={sensors}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header) => (
                    <DraggableHead key={header.id} header={header} />
                  ))}
                </SortableContext>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {row.getVisibleCells().map((cell) => (
                    <DragAlongCell key={cell.id} cell={cell} />
                  ))}
                </SortableContext>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
