import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

type Plan = {
  id: string;
  name: string;
  price: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'team',
    name: 'Team',
    price: '$12',
    features: ['Up to 25 seats', 'Shared dashboards', 'Email support'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '$29',
    features: ['Unlimited seats', 'Single sign-on', 'Priority support'],
  },
];

const NAV_LINKS = ['Product', 'Pricing', 'Docs'];

function teamButtonOf(editCount: number) {
  if (editCount >= 2) {
    return 'Start free trial';
  }
  return 'Start trial';
}

function buttonLabelOf(plan: Plan, editCount: number) {
  if (plan.id === 'team') {
    return teamButtonOf(editCount);
  }
  return 'Talk to us';
}

function isMostChosen(plan: Plan, editCount: number) {
  const isTeam = plan.id === 'team';
  const hasEdit = editCount >= 1;
  return isTeam && hasEdit;
}

function buttonVariantOf(isFeatured: boolean) {
  if (isFeatured) {
    return 'default';
  }
  return 'outline';
}

function PlanCard({ plan, editCount }: { plan: Plan; editCount: number }) {
  const label = buttonLabelOf(plan, editCount);
  const showsBadge = isMostChosen(plan, editCount);
  const variant = buttonVariantOf(showsBadge);

  return (
    <li className='bg-card hairline-ring ring-border flex flex-col gap-2 rounded-lg p-3'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-[13px] font-medium'>{plan.name}</span>
        {showsBadge && (
          <Chip className='transition-[opacity,scale] duration-200 ease-(--ease-out-strong) starting:scale-95 starting:opacity-0'>
            Most chosen
          </Chip>
        )}
      </div>
      <p className='flex items-baseline gap-1'>
        <span className='text-xl font-semibold tabular-nums'>{plan.price}</span>
        <span className='text-muted-foreground text-xs'>
          per seat, per month
        </span>
      </p>
      <ul className='text-muted-foreground flex flex-col gap-1 text-xs'>
        {plan.features.map((feature) => (
          <li key={feature} className='flex items-center gap-1.5'>
            <CheckIcon className='text-success-foreground size-3 shrink-0' />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        type='button'
        size='sm'
        variant={variant}
        className='mt-1 self-start'
      >
        <Swap swapKey={label}>{label}</Swap>
      </Button>
    </li>
  );
}

type PricingPageProps = {
  /** How many edits the agent has made to the page so far. */
  editCount: number;
};

/** A small pricing page drawn in HTML, so the preview is something an agent could be building. */
export function PricingPage({ editCount }: PricingPageProps) {
  return (
    <div className='bg-background text-foreground flex h-full flex-col gap-4 p-3'>
      <nav className='flex items-center gap-3'>
        <CompanyMark seed='Larkfield' size='sm' />
        <span className='text-[13px] font-medium'>Larkfield</span>
        <span className='text-muted-foreground ms-2 hidden items-center gap-3 text-xs @md:flex'>
          {NAV_LINKS.map((link) => (
            <span key={link}>{link}</span>
          ))}
        </span>
        <span className='text-muted-foreground ms-auto text-xs'>Sign in</span>
      </nav>
      <header className='flex flex-col gap-1'>
        <h4 className='text-[15px] font-semibold text-balance @lg:text-lg'>
          Simple pricing for small teams
        </h4>
        <p className='text-muted-foreground text-xs'>
          Change plans any time. Illustrative prices.
        </p>
      </header>
      <ul className='grid grid-cols-1 gap-2 @lg:grid-cols-2'>
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} editCount={editCount} />
        ))}
      </ul>
    </div>
  );
}
