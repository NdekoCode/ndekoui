'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import {
  ImageIcon,
  PaperclipIcon,
  SendIcon,
  ThumbsUpIcon,
  TriangleAlertIcon,
  XIcon,
  LightbulbIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import {
  ActionButton,
  useTimedAction,
  type ActionLabels,
} from './_parts/action-button';
import { ChoiceSegments, type SegmentOption } from './_parts/choice-segments';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { chipVariantsOf, morphOf } from './_parts/motion';
import { CURRENT_USER, WORKSPACE_NAME, firstNameOf } from './_parts/people';
import { Swap } from './_parts/swap';

type FeedbackKind = 'idea' | 'problem' | 'praise';

type Attachment = { name: string; size: string };

const KINDS: SegmentOption<FeedbackKind>[] = [
  { value: 'idea', label: 'Idea', icon: LightbulbIcon },
  { value: 'problem', label: 'Problem', icon: TriangleAlertIcon },
  { value: 'praise', label: 'Praise', icon: ThumbsUpIcon },
];

const PLACEHOLDER: Record<FeedbackKind, string> = {
  idea: 'Describe the idea and the problem it would solve',
  problem: 'What you did, what happened and what you expected',
  praise: 'What worked well, and where',
};

const THANKS_LINE: Record<FeedbackKind, string> = {
  idea: 'The product team reads every idea and links it to the roadmap once it is planned',
  problem: `We reply by e-mail within two working days, at ${CURRENT_USER.email}`,
  praise: 'It goes straight to the people who built that part',
};

const SCALE = [1, 2, 3, 4, 5];

const FIRST_RATING = 4;

const MESSAGE_LIMIT = 500;

const KILOBYTE = 1024;

const MEGABYTE = KILOBYTE * KILOBYTE;

const SEND_LABELS: ActionLabels = {
  idle: 'Send feedback',
  working: 'Sending',
  done: 'Sent',
};

const STEP_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

const STEP_VARIANTS: Variants = {
  hidden: { opacity: 0, filter: 'blur(2px)', transition: STEP_TRANSITION },
  shown: { opacity: 1, filter: 'blur(0px)', transition: STEP_TRANSITION },
};

const STEP_FADE: Variants = {
  hidden: { opacity: 0, transition: STEP_TRANSITION },
  shown: { opacity: 1, transition: STEP_TRANSITION },
};

const SCALE_SEGMENT = [
  'relative isolate flex h-7 flex-1 cursor-pointer items-center justify-center rounded-full text-[13px] font-medium tabular-nums text-muted-foreground',
  'transition-colors duration-150 hover:text-foreground has-data-checked:text-foreground',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

const SCALE_THUMB =
  'absolute inset-0 -z-10 rounded-full bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

function stepVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return STEP_FADE;
  }
  return STEP_VARIANTS;
}

function questionOf(rating: number) {
  if (rating <= 2) {
    return 'What got in your way';
  }
  if (rating === 3) {
    return 'What would make it work better for you';
  }
  return 'What do you rely on most';
}

function sizeLabelOf(bytes: number) {
  if (bytes < MEGABYTE) {
    const kilobytes = Math.max(1, Math.round(bytes / KILOBYTE));
    return `${kilobytes} KB`;
  }
  const megabytes = (bytes / MEGABYTE).toFixed(1);
  return `${megabytes} MB`;
}

function RatingScale({
  rating,
  labelId,
  onChange,
}: {
  rating: number;
  labelId: string;
  onChange: (rating: number) => void;
}) {
  const thumbId = useId();
  const shouldReduceMotion = useReducedMotion();
  const thumbTransition = morphOf(shouldReduceMotion);

  function changeRating(value: unknown) {
    const nextRating = Number(value);
    const isOnScale = SCALE.includes(nextRating);
    if (isOnScale) {
      onChange(nextRating);
    }
  }

  return (
    <div className='flex items-center gap-3'>
      <span className='text-muted-foreground shrink-0 text-xs'>Not well</span>
      <RadioGroup
        aria-labelledby={labelId}
        value={String(rating)}
        onValueChange={changeRating}
        className='bg-foreground/[0.05] flex flex-1 gap-0.5 rounded-full p-0.5'
      >
        {SCALE.map((step) => {
          const isPicked = step === rating;

          return (
            <label key={step} className={SCALE_SEGMENT}>
              <RadioGroupItem value={String(step)} className='sr-only' />
              {isPicked && (
                <motion.span
                  layoutId={thumbId}
                  transition={thumbTransition}
                  aria-hidden='true'
                  className={SCALE_THUMB}
                />
              )}
              {step}
            </label>
          );
        })}
      </RadioGroup>
      <span className='text-muted-foreground shrink-0 text-xs'>Very well</span>
    </div>
  );
}

function AttachSlot({
  attachment,
  onAttach,
  onRemove,
}: {
  attachment: Attachment | null;
  onAttach: (attachment: Attachment) => void;
  onRemove: () => void;
}) {
  const inputId = useId();
  const shouldReduceMotion = useReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    onAttach({ name: file.name, size: sizeLabelOf(file.size) });
  }

  return (
    <div className='relative h-11'>
      <AnimatePresence initial={false} mode='popLayout'>
        {attachment && (
          <motion.div
            key='file'
            variants={variants}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='bg-card hairline-ring ring-border flex h-11 items-center gap-2.5 rounded-lg pr-1.5 pl-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            <span className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'>
              <ImageIcon className='size-3.5' />
            </span>
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-[13px] font-medium'>
                {attachment.name}
              </span>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {attachment.size}
              </span>
            </span>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Remove ${attachment.name}`}
              onClick={onRemove}
              className='text-muted-foreground'
            >
              <XIcon />
            </Button>
          </motion.div>
        )}
        {!attachment && (
          <motion.label
            key='slot'
            htmlFor={inputId}
            variants={variants}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='hairline-border border-foreground/20 text-muted-foreground hover:bg-foreground/[0.02] hover:text-foreground has-focus-visible:ring-ring/25 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-dashed text-[13px] transition-colors duration-150 has-focus-visible:ring-[3px]'
          >
            <PaperclipIcon className='size-4' />
            Attach a screenshot
            <span className='text-muted-foreground/80'>(optional)</span>
            <input
              id={inputId}
              type='file'
              accept='image/png,image/jpeg'
              onChange={pickFile}
              className='sr-only'
            />
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedbackForm({
  kind,
  onKindChange,
  onSent,
}: {
  kind: FeedbackKind;
  onKindChange: (kind: FeedbackKind) => void;
  onSent: () => void;
}) {
  const [rating, setRating] = useState(FIRST_RATING);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>({
    name: 'timesheet-export.png',
    size: '284 KB',
  });
  const { state, run } = useTimedAction();
  const scaleLabelId = useId();
  const messageId = useId();
  const countId = useId();
  const question = questionOf(rating);
  const hasMessage = message.trim().length > 0;
  const isIdle = state === 'idle';
  const isSendDisabled = isIdle && !hasMessage;

  function changeMessage(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(event.target.value);
  }

  function removeAttachment() {
    setAttachment(null);
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasMessage) {
      return;
    }
    run(onSent);
  }

  return (
    <form onSubmit={send} className='flex flex-col gap-5'>
      <ModalHeader>
        <ModalTitle>Send feedback</ModalTitle>
        <ModalDescription>
          {`It goes to the people who build ${WORKSPACE_NAME}; they read every message`}
        </ModalDescription>
      </ModalHeader>
      <ChoiceSegments
        label='Kind of feedback'
        value={kind}
        options={KINDS}
        onValueChange={onKindChange}
      />
      <div className='flex flex-col gap-2'>
        <span id={scaleLabelId} className='text-[13px] font-medium'>
          {`How well does ${WORKSPACE_NAME} work for you`}
        </span>
        <RatingScale
          rating={rating}
          labelId={scaleLabelId}
          onChange={setRating}
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-baseline justify-between gap-3'>
          <label htmlFor={messageId} className='text-[13px] font-medium'>
            <Swap swapKey={question} kind='label'>
              {question}
            </Swap>
          </label>
          <span className='text-muted-foreground text-xs'>Required</span>
        </div>
        <Textarea
          id={messageId}
          required
          value={message}
          maxLength={MESSAGE_LIMIT}
          aria-describedby={countId}
          placeholder={PLACEHOLDER[kind]}
          onChange={changeMessage}
          className='min-h-24'
        />
        <p
          id={countId}
          className='text-muted-foreground self-end text-xs tabular-nums'
        >
          {`${message.length} of ${MESSAGE_LIMIT} characters`}
        </p>
      </div>
      <AttachSlot
        attachment={attachment}
        onAttach={setAttachment}
        onRemove={removeAttachment}
      />
      <ModalFooter>
        <ModalCloseButton type='button' variant='ghost'>
          Cancel
        </ModalCloseButton>
        <ActionButton
          type='submit'
          state={state}
          labels={SEND_LABELS}
          idleIcon={<SendIcon />}
          disabled={isSendDisabled}
        />
      </ModalFooter>
    </form>
  );
}

function ThanksStep({
  kind,
  onSendMore,
}: {
  kind: FeedbackKind;
  onSendMore: () => void;
}) {
  return (
    <div className='flex flex-col gap-5'>
      <ModalHeader className='items-start gap-3'>
        <StatusOrb tone='success' />
        <ModalTitle>{`Thanks, ${firstNameOf(CURRENT_USER)}`}</ModalTitle>
        <ModalDescription>{THANKS_LINE[kind]}</ModalDescription>
      </ModalHeader>
      <ModalFooter>
        <Button variant='ghost' onClick={onSendMore}>
          Send more feedback
        </Button>
        <ModalCloseButton variant='outline'>Close</ModalCloseButton>
      </ModalFooter>
    </div>
  );
}

function FeedbackContent() {
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [isSent, setIsSent] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const stepVariants = stepVariantsOf(shouldReduceMotion);

  function markSent() {
    setIsSent(true);
  }

  function sendMore() {
    setFormKey((previous) => previous + 1);
    setIsSent(false);
  }

  return (
    <div className='relative'>
      <AnimatePresence initial={false} mode='popLayout'>
        {!isSent && (
          <motion.div
            key={`form-${formKey}`}
            variants={stepVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
          >
            <FeedbackForm
              kind={kind}
              onKindChange={setKind}
              onSent={markSent}
            />
          </motion.div>
        )}
        {isSent && (
          <motion.div
            key='thanks'
            variants={stepVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
          >
            <ThanksStep kind={kind} onSendMore={sendMore} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Modal09() {
  return (
    <ModalPreview triggerLabel='Open send feedback' size='md'>
      <FeedbackContent />
    </ModalPreview>
  );
}
