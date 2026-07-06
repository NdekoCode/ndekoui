import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';

import { CUSTOMER_FIELDS, type Customer } from './data';

type CustomerCardProps = {
  customer: Customer;
  lookedUpFields: number;
};

/** A field the copilot has not looked up yet shows a bar where its value will be. */
export function CustomerCard({ customer, lookedUpFields }: CustomerCardProps) {
  return (
    <section
      aria-label='Customer'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-center gap-2.5'>
        <Avatar>
          <AvatarFallback>{customer.initials}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col leading-tight'>
          <h3 className='truncate text-[13px] font-medium'>{customer.name}</h3>
          <span className='text-muted-foreground truncate text-xs'>
            {customer.email}
          </span>
        </div>
      </div>
      <dl className='flex flex-col gap-1.5 text-xs'>
        {CUSTOMER_FIELDS.map((field, index) => {
          const isFilled = index < lookedUpFields;
          return (
            <div key={field.key} className='flex h-5 items-center gap-2'>
              <dt className='text-muted-foreground w-24 shrink-0'>
                {field.label}
              </dt>
              <dd className='min-w-0 flex-1 truncate'>
                {isFilled && (
                  <span className='transition-opacity duration-300 starting:opacity-0'>
                    {customer[field.key]}
                  </span>
                )}
                {!isFilled && (
                  <span className='bg-foreground/10 block h-2 w-20 rounded-full'>
                    <span className='sr-only'>Not looked up yet</span>
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
