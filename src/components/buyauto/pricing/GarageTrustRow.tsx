import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { GARAGE_TRUST_POINTS } from "@/lib/buyauto/garagePlans";

/**
 * Risk reversal, next to the CTAs rather than in the footer — the three
 * objections a garagist has before signing anything: contract length, hidden
 * setup cost, and the value-based pricing they know from the big portals.
 */
export function GarageTrustRow({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      {GARAGE_TRUST_POINTS.map((point) => (
        <div
          key={point.title}
          className="rounded-2xl border border-neutral-200/70 bg-white/70 px-4 py-3 backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-neutral-900">{point.title}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">{point.body}</p>
        </div>
      ))}
    </div>
  );
}
