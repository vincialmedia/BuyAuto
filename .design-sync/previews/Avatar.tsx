import { Avatar, AvatarFallback, AvatarImage } from 'buyauto';

// Avatar renders nothing on its own — it needs an AvatarImage or an
// AvatarFallback child. AvatarImage is left out of the primary cell on
// purpose: a remote URL cannot load during an offline capture, and Radix then
// shows the fallback anyway, so the fallback IS the honest preview.
export function Fallbacks() {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>VH</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AM</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarFallback>BA</AvatarFallback>
      </Avatar>
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">SZ</AvatarFallback>
      </Avatar>
    </div>
  );
}

// The composition used in the messaging rail and the seller mini-profile.
export function InSellerRow() {
  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-lg border p-3">
      <Avatar>
        <AvatarImage src="" alt="" />
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">Garage Meier AG</div>
        <div className="truncate text-xs text-muted-foreground">Zürich · Seit 2019 dabei</div>
      </div>
    </div>
  );
}
