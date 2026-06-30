import { ConfettiButton } from '@/components/core/confetti';
import { RocketIcon } from '@/registry/ndeko/lib/icons';

export function ConfettiButtonExample() {
  return (
    <ConfettiButton>
      <RocketIcon />
      Publish release
    </ConfettiButton>
  );
}
