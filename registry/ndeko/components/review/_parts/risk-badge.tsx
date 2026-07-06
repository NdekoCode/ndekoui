import type { RiskLevel } from '@/registry/ndeko/lib/agent-run';
import {
  CircleAlertIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';

type RiskLook = {
  label: string;
  variant: 'success' | 'warning' | 'destructive';
  icon: React.ReactNode;
};

const RISK_LOOK: Record<RiskLevel, RiskLook> = {
  low: { label: 'Low risk', variant: 'success', icon: <ShieldCheckIcon /> },
  medium: {
    label: 'Medium risk',
    variant: 'warning',
    icon: <TriangleAlertIcon />,
  },
  high: {
    label: 'High risk',
    variant: 'destructive',
    icon: <CircleAlertIcon />,
  },
};

type RiskBadgeProps = {
  risk: RiskLevel;
  className?: string;
};

/** The level of a risk as a word and a mark, so colour never carries it alone. */
export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const look = RISK_LOOK[risk];

  return (
    <Badge variant={look.variant} className={className}>
      {look.icon}
      {look.label}
    </Badge>
  );
}
