import { MessageSquare } from "lucide-react";

export function MessageCenterRail() {
  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight text-neutral-900">Message Center</div>
          <div className="text-xs text-neutral-600">Kommunikation pro Inserat</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-4">
        <div className="text-sm text-neutral-700">Keine Nachrichten im Message Center</div>
      </div>
    </div>
  );
}