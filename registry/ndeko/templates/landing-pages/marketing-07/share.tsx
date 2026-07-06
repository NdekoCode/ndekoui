'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  CopyIcon,
  MailIcon,
  ShareIcon,
} from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { NETWORKS, SHARE } from './data';
import { PopShape } from './pop-shape';
import { Reveal } from './reveal';
import { COPY_PRESS_KEY, MEMBER_TOTAL, SESSION } from './share-session';

const COPIED_FOR_MS = 1600;

const INVITE_URL = `https://${SHARE.link}`;

function CopyLabel({ isCopied }: { isCopied: boolean }) {
  if (isCopied) {
    return (
      <span className='inline-flex items-center gap-1.5'>
        <CheckIcon />
        Copied
      </span>
    );
  }
  return (
    <span className='inline-flex items-center gap-1.5'>
      <CopyIcon />
      {SHARE.copyLabel}
    </span>
  );
}

export function Share() {
  const { ref, isAutoplaying, state, act, pressed } = useSession(SESSION);
  const { schedule } = useTimeouts();
  const joinedMembers = [...SHARE.members, SHARE.invited].slice(
    0,
    state.joined
  );
  const hasPending = state.joined < MEMBER_TOTAL;
  const isCopyPressed = pressed === COPY_PRESS_KEY;
  const announcement = announcementOf(state.isCopied, state.joined);
  const message = spokenUnless(isAutoplaying, announcement);
  useKeptHeight(ref);

  async function copy() {
    try {
      await navigator.clipboard.writeText(INVITE_URL);
    } catch {
      return;
    }
    act({ type: 'copied' });
    schedule(() => act({ type: 'copyEnded' }), COPIED_FOR_MS);
  }

  async function share() {
    const canShare = typeof navigator.share === 'function';
    if (!canShare) {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: SHARE.shareTitle,
        text: SHARE.shareText,
        url: INVITE_URL,
      });
    } catch {
      return;
    }
  }

  return (
    <section className='relative overflow-x-clip px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'>
      <PopShape
        kind='square'
        series={5}
        className='top-12 left-6 size-8 rotate-12 @3xl:top-20 @3xl:left-28 @3xl:size-12'
      />
      <Reveal
        className='mx-auto max-w-4xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SHARE.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SHARE.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='bg-foreground/[0.03] min-h-[26rem] rounded-2xl p-2 @3xl:min-h-[20rem] @3xl:p-3'
          >
            <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-6 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:p-6'>
              <div className='flex flex-col gap-2 @xl:flex-row'>
                <Input
                  readOnly
                  size='lg'
                  value={SHARE.link}
                  aria-label='Invite link'
                />
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='lg'
                    onClick={copy}
                    className={pressedQuietOf(isCopyPressed)}
                  >
                    <Swap swapKey={String(state.isCopied)}>
                      <CopyLabel isCopied={state.isCopied} />
                    </Swap>
                  </Button>
                  <Button size='lg' onClick={share}>
                    <ShareIcon />
                    {SHARE.shareLabel}
                  </Button>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-4'>
                <div className='flex -space-x-2'>
                  {joinedMembers.map((member) => (
                    <Avatar
                      key={member}
                      seed={member}
                      role='img'
                      aria-label={member}
                      className='ring-card size-9 ring-2'
                    />
                  ))}
                  {hasPending && (
                    <span
                      role='img'
                      aria-label={`${SHARE.invited}, invited`}
                      className='border-foreground/25 text-muted-foreground bg-card ring-card flex size-9 items-center justify-center rounded-full border border-dashed ring-2'
                    >
                      <MailIcon className='size-4' />
                    </span>
                  )}
                </div>
                <p className='text-muted-foreground text-[13px] tabular-nums'>
                  <MotionNumber value={state.joined} /> of {MEMBER_TOTAL} have
                  joined
                </p>
              </div>
              <div className='flex flex-col gap-3'>
                <p className='text-muted-foreground text-xs'>
                  {SHARE.networksTitle}
                </p>
                <ul className='flex flex-wrap gap-2'>
                  {NETWORKS.map((network) => (
                    <li
                      key={network.id}
                      className='bg-foreground/[0.05] flex items-center gap-2 rounded-full py-1 ps-1 pe-3 text-xs font-medium'
                    >
                      <BrandTile brand={network.id} size='lg' />
                      {network.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <LiveRegion message={message} />
        </SettleItem>
      </Reveal>
    </section>
  );
}

function announcementOf(isCopied: boolean, joined: number) {
  if (isCopied) {
    return 'Invite link copied';
  }
  return `${joined} of ${MEMBER_TOTAL} have joined`;
}
