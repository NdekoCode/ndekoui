'use client';

import { useId } from 'react';
import { usePaymentInputs } from 'react-payment-inputs';
import images, { type CardImages } from 'react-payment-inputs/images';

import { CreditCardIcon, WalletIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';

const CARD_IMAGES = images as unknown as CardImages;

const ICON_TILE =
  'keycap-3d text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg';

export default function Dialog16() {
  const id = useId();
  const nameId = `${id}-name`;
  const numberId = `${id}-number`;
  const expiryId = `${id}-expiry`;
  const cvcId = `${id}-cvc`;
  const defaultId = `${id}-default`;
  const {
    meta,
    getCardNumberProps,
    getExpiryDateProps,
    getCVCProps,
    getCardImageProps,
  } = usePaymentInputs();
  const hasCardType = Boolean(meta.cardType);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Update card
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <div className='flex flex-col gap-4'>
          <span aria-hidden='true' className={ICON_TILE}>
            <WalletIcon className='size-5' />
          </span>
          <DialogHeader>
            <DialogTitle>Update your card</DialogTitle>
            <DialogDescription>
              The new card replaces the Visa ending in 4242 for the next
              invoices.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form className='flex flex-col gap-5'>
          <div className='flex flex-col gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor={nameId}>Name on card</Label>
              <Input
                id={nameId}
                autoComplete='cc-name'
                placeholder='Amara Okafor'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={numberId}>Card number</Label>
              <div className='relative'>
                <Input
                  {...getCardNumberProps()}
                  id={numberId}
                  className='peer pe-9 [direction:inherit]'
                />
                <span className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 peer-disabled:opacity-50'>
                  {hasCardType && (
                    <svg
                      className='overflow-hidden rounded-sm'
                      {...getCardImageProps({ images: CARD_IMAGES })}
                      width={20}
                    />
                  )}
                  {!hasCardType && <CreditCardIcon className='size-4' />}
                </span>
              </div>
            </div>
            <div className='flex gap-4'>
              <div className='grid flex-1 gap-2'>
                <Label htmlFor={expiryId}>Expiry date</Label>
                <Input
                  {...getExpiryDateProps()}
                  id={expiryId}
                  className='[direction:inherit]'
                />
              </div>
              <div className='grid flex-1 gap-2'>
                <Label htmlFor={cvcId}>CVC</Label>
                <Input
                  {...getCVCProps()}
                  id={cvcId}
                  className='[direction:inherit]'
                />
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Checkbox id={defaultId} />
            <Label
              htmlFor={defaultId}
              className='text-muted-foreground font-normal'
            >
              Use it as the default payment method
            </Label>
          </div>
          <Button type='button' size='lg' className='w-full'>
            Update card
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
