import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { GitBranchIcon, PlugIcon, ZapIcon } from '@/registry/ndeko/lib/icons';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { choiceOf, FIELDS_OF, type Step } from './data';

const KIND_PLATE =
  'gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-md [--gem:var(--primary)] [&_svg]:size-4';

const EMPTY_TILE =
  'keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-4';

function appBrandOf(step: Step) {
  const appField = FIELDS_OF.tool.find((spec) => spec.id === 'app');
  if (!appField) {
    return undefined;
  }
  return choiceOf(appField, step.values.app)?.brand;
}

/**
 * What a step wears: a trigger and a condition the plate of their kind, an agent its own picture,
 * a tool the mark of the app it acts in.
 */
export function StepTile({ step }: { step: Step }) {
  if (step.kind === 'trigger') {
    return (
      <span aria-hidden='true' className={KIND_PLATE}>
        <ZapIcon />
      </span>
    );
  }
  if (step.kind === 'condition') {
    return (
      <span aria-hidden='true' className={KIND_PLATE}>
        <GitBranchIcon />
      </span>
    );
  }
  if (step.kind === 'agent') {
    const color = seriesColorOf(step.series ?? 1);
    return <MeshTile seed={step.id} color={color} size='lg' />;
  }
  const brand = appBrandOf(step);
  if (brand) {
    return <BrandTile brand={brand} size='lg' />;
  }
  return (
    <span aria-hidden='true' className={EMPTY_TILE}>
      <PlugIcon />
    </span>
  );
}
