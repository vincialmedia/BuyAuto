import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from 'buyauto';

// `value` is set so the slots contain digits — an empty OTP is six empty boxes.
export function SixDigit() {
  return (
    <InputOTP maxLength={6} value="482913">
      <InputOTPGroup>
        <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}

export function PartiallyFilled() {
  return (
    <InputOTP maxLength={6} value="482">
      <InputOTPGroup>
        <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
        <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
