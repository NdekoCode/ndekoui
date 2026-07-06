import { Fragment } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/registry/ndeko/ui/cropper';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from '@/registry/ndeko/ui/otp-field';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { SelectNative } from '@/registry/ndeko/ui/select-native';
import { Slider } from '@/registry/ndeko/ui/slider';
import { Switch } from '@/registry/ndeko/ui/switch';
import { Textarea } from '@/registry/ndeko/ui/textarea';

const PRIORITIES = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const TIME_ZONES = [
  { label: 'Berlin', value: 'europe-berlin' },
  { label: 'Lagos', value: 'africa-lagos' },
  { label: 'New York', value: 'america-new-york' },
  { label: 'São Paulo', value: 'america-sao-paulo' },
  { label: 'Tokyo', value: 'asia-tokyo' },
];

const PROJECT_DESCRIPTION = [
  'New pages for pricing, docs and the changelog.',
  'The hero shows a live demo instead of a screenshot.',
].join('\n');

const CODE_LENGTH = 4;
const HALF_CODE_LENGTH = CODE_LENGTH / 2;
const CODE_SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

const CROP_IMAGE = '/images/scenes/scene-03.svg';

function codeSlotLabelOf(index: number) {
  if (index === 0) {
    return undefined;
  }
  const position = index + 1;
  return `Character ${position} of ${CODE_LENGTH}`;
}

export function LabelDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-5'>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='kit-label-project'>Project name</Label>
        <Input id='kit-label-project' placeholder='Website redesign' />
      </div>
      <Label>
        <Checkbox defaultChecked />
        Notify the team
      </Label>
    </div>
  );
}

export function InputDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Input type='email' placeholder='you@example.com' aria-label='Email' />
      <Input
        type='search'
        size='sm'
        placeholder='Search tasks'
        aria-label='Search tasks'
      />
      <Input
        size='lg'
        defaultValue='Atlas Studio'
        aria-label='Workspace name'
      />
      <Input
        disabled
        defaultValue='atlas.example.com'
        aria-label='Workspace address'
      />
    </div>
  );
}

export function TextareaDemo() {
  return (
    <Textarea
      className='max-w-xs'
      aria-label='Project description'
      defaultValue={PROJECT_DESCRIPTION}
    />
  );
}

export function FieldDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-5'>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input type='email' placeholder='you@example.com' />
        <FieldDescription>
          We send the sign-in code to this address.
        </FieldDescription>
      </Field>
      <Field invalid>
        <FieldLabel>Workspace URL</FieldLabel>
        <Input defaultValue='my workspace' />
        <FieldError match>Use letters, numbers and dashes only.</FieldError>
      </Field>
    </div>
  );
}

export function SelectDemo() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Priority</FieldLabel>
      <Select items={PRIORITIES} defaultValue='medium'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a priority' />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((priority) => (
            <SelectItem key={priority.value} value={priority.value}>
              {priority.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function SelectNativeDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label htmlFor='kit-native-time-zone'>Time zone</Label>
      <SelectNative id='kit-native-time-zone' defaultValue='europe-berlin'>
        {TIME_ZONES.map((zone) => (
          <option key={zone.value} value={zone.value}>
            {zone.label}
          </option>
        ))}
      </SelectNative>
    </div>
  );
}

export function CheckboxDemo() {
  return (
    <div className='flex flex-col gap-3'>
      <Label>
        <Checkbox defaultChecked />
        Email me when a task is assigned
      </Label>
      <Label>
        <Checkbox />
        Include weekends in estimates
      </Label>
      <Label>
        <Checkbox disabled defaultChecked />
        Sync with my calendar
      </Label>
    </div>
  );
}

export function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue='weekly' aria-label='Digest frequency'>
      <Label>
        <RadioGroupItem value='daily' />
        Daily digest
      </Label>
      <Label>
        <RadioGroupItem value='weekly' />
        Weekly digest
      </Label>
      <Label>
        <RadioGroupItem value='never' />
        No digest
      </Label>
    </RadioGroup>
  );
}

export function SwitchDemo() {
  return (
    <div className='flex flex-col gap-3'>
      <Label>
        <Switch defaultChecked />
        Show weekends
      </Label>
      <Label>
        <Switch />
        Send a daily digest
      </Label>
      <Label>
        <Switch disabled />
        Share with guests
      </Label>
    </div>
  );
}

export function SliderDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-6'>
      <div className='flex flex-col gap-3'>
        <p className='text-[13px] font-medium'>Volume</p>
        <Slider defaultValue={40} thumbLabels={['Volume']} />
      </div>
      <div className='flex flex-col gap-3'>
        <p className='text-[13px] font-medium'>Estimate, in hours</p>
        <Slider
          defaultValue={[8, 24]}
          min={0}
          max={40}
          thumbLabels={['Shortest estimate', 'Longest estimate']}
        />
      </div>
    </div>
  );
}

export function OtpFieldDemo() {
  return (
    <Field className='w-fit'>
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={CODE_LENGTH}>
        {CODE_SLOTS.map((index) => {
          const startsSecondHalf = index === HALF_CODE_LENGTH;
          return (
            <Fragment key={index}>
              {startsSecondHalf && <OTPFieldSeparator />}
              <OTPFieldInput aria-label={codeSlotLabelOf(index)} />
            </Fragment>
          );
        })}
      </OTPField>
      <FieldDescription>We sent it to lena@example.com</FieldDescription>
    </Field>
  );
}

export function CropperDemo() {
  return (
    <div className='w-full'>
      <Cropper className='h-56' image={CROP_IMAGE}>
        <CropperDescription />
        <CropperImage />
        <CropperCropArea />
      </Cropper>
    </div>
  );
}
