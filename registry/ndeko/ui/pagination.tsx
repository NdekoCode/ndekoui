import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label='Pagination'
      data-slot='pagination'
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot='pagination-content'
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  );
}

function PaginationItem(props: React.ComponentProps<'li'>) {
  return <li data-slot='pagination-item' {...props} />;
}

type PaginationLinkProps = Omit<React.ComponentProps<'a'>, 'ref'> &
  Pick<ButtonProps, 'size'> & {
    isActive?: boolean;
    isDisabled?: boolean;
  };

function variantOf(isActive: boolean | undefined) {
  if (isActive) {
    return 'outline' as const;
  }
  return 'ghost' as const;
}

function ariaCurrentOf(isActive: boolean | undefined) {
  if (isActive) {
    return 'page' as const;
  }
  return undefined;
}

function PaginationLink({
  className,
  isActive,
  isDisabled,
  size = 'icon',
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={variantOf(isActive)}
      size={size}
      nativeButton={false}
      disabled={isDisabled}
      data-slot='pagination-link'
      data-active={isActive}
      className={cn('tabular-nums', className)}
      render={
        <a
          aria-current={ariaCurrentOf(isActive)}
          aria-disabled={isDisabled}
          {...props}
        />
      }
    >
      {children}
    </Button>
  );
}

function PaginationPrevious({
  className,
  label = 'Previous',
  ...props
}: PaginationLinkProps & { label?: string }) {
  return (
    <PaginationLink
      aria-label='Go to previous page'
      size='default'
      className={cn('gap-1 ps-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span>{label}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  label = 'Next',
  ...props
}: PaginationLinkProps & { label?: string }) {
  return (
    <PaginationLink
      aria-label='Go to next page'
      size='default'
      className={cn('gap-1 pe-2.5', className)}
      {...props}
    >
      <span>{label}</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden='true'
      data-slot='pagination-ellipsis'
      className={cn(
        'text-muted-foreground flex size-8 items-center justify-center',
        className
      )}
      {...props}
    >
      <EllipsisIcon className='size-4' />
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
