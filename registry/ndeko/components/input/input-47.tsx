'use client';

import { Input as InputPrimitive } from '@base-ui/react/input';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState, type ChangeEvent, type ComponentProps } from 'react';
import PhoneInput, {
  getCountryCallingCode,
  type Country,
  type FlagProps,
} from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

import { ChevronDownIcon, PhoneIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

type CountryOption = { label: string; value: Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: Country;
  onChange: (value: Country) => void;
  options: CountryOption[];
};

const GROUP = cn(
  CONTROL_RECIPE,
  'flex h-8 items-stretch overflow-hidden',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]'
);

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function NumberInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <InputPrimitive
      className={cn(
        'placeholder:text-muted-foreground/75 h-full min-w-0 flex-1 bg-transparent px-2.5 outline-none',
        className
      )}
      {...props}
    />
  );
}

function CountryFlag({ country, countryName }: FlagProps) {
  const Flag = flags[country];

  return (
    <span className='flex w-5 overflow-hidden rounded-[3px]'>
      {Flag && <Flag title={countryName} />}
      {!Flag && <PhoneIcon className='size-4' />}
    </span>
  );
}

function hasCountry(
  option: CountryOption
): option is { label: string; value: Country } {
  return option.value !== undefined;
}

function optionLabelOf(option: { label: string; value: Country }) {
  const callingCode = getCountryCallingCode(option.value);
  return `${option.label} +${callingCode}`;
}

function CountrySelect({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) {
  const countries = options.filter(hasCountry);
  const shouldReduceMotion = useReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const flagKey = String(value);

  function selectCountry(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.currentTarget.value as Country);
  }

  return (
    <span className='text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground border-foreground/12 dark:border-foreground/15 relative flex shrink-0 items-center border-e-(length:--hairline) ps-2.5 pe-2 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50'>
      <span className='flex items-center gap-1' aria-hidden='true'>
        <span className='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={flagKey}
              className='flex'
              variants={swapVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <CountryFlag country={value} countryName={value} />
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronDownIcon className='size-4' />
      </span>
      <select
        disabled={disabled}
        value={value}
        onChange={selectCountry}
        className='absolute inset-0 cursor-pointer text-[13px] opacity-0'
        aria-label='Country'
      >
        <option value=''>Select a country</option>
        {countries.map((option) => (
          <option key={option.value} value={option.value}>
            {optionLabelOf(option)}
          </option>
        ))}
      </select>
    </span>
  );
}

export default function Input47() {
  const [phoneNumber, setPhoneNumber] = useState('');

  function changePhoneNumber(nextNumber: string | undefined) {
    setPhoneNumber(nextNumber ?? '');
  }

  return (
    <Field className='w-full max-w-xs' dir='ltr'>
      <FieldLabel>Phone number</FieldLabel>
      <PhoneInput
        className={GROUP}
        international
        flagComponent={CountryFlag}
        countrySelectComponent={CountrySelect}
        inputComponent={NumberInput}
        placeholder='Enter phone number'
        value={phoneNumber}
        onChange={changePhoneNumber}
      />
    </Field>
  );
}
