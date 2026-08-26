import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from 'buyauto';

// InputOTPSeparator is a single dash between slot groups — nothing at all on
// its own. The six-digit code layout is the one the e-mail confirmation flow
// uses.
export function BetweenGroups() {
  return (
    <InputOTP maxLength={6} value="482">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}

export function Filled() {
  return (
    <InputOTP maxLength={6} value="482913">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
