import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RELIST_PRICE_CHF,
  RELIST_PROMO_ACTIVE,
  type Plan,
} from "@/lib/buyauto/stripe_config";
import { T, useT } from "@/i18n/runtime";

/**
 * What a private plan does *not* include, rendered as grey X rows.
 *
 * Shared between /preise and the listing wizard's plan step: those two used to
 * carry their own lists and had drifted — /preise named three limits on
 * Standard while the wizard only named one, so a seller who compared the plans
 * before starting saw a stricter offer than the one they were checking out
 * with. Only Standard has exclusions today; Verlängert and Unlimitiert render
 * nothing.
 */
export function PrivatePlanExclusions({
  plan,
  className,
  itemClassName,
}: {
  plan: Plan;
  className?: string;
  itemClassName?: string;
}) {
  const t = useT();
  if (plan !== "standard") return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("flex items-start gap-2 text-sm text-neutral-400", itemClassName)}>
        <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{t("Keine Premium-Platzierung")}</span>
      </div>
      <div className={cn("flex items-start gap-2 text-sm text-neutral-400", itemClassName)}>
        <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{t("Maximal 5 Fotos")}</span>
      </div>
      <div className={cn("flex items-start gap-2 text-sm text-neutral-400", itemClassName)}>
        <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          {RELIST_PROMO_ACTIVE ? (
            <T
              k="Nach Ablauf: Wiedereinstellen <0>CHF {price}</0> <1>zurzeit gratis</1>"
              vars={{ price: RELIST_PRICE_CHF }}
              c={[<s key="price" />, <span key="promo" className="font-semibold text-emerald-700" />]}
            />
          ) : (
            t("Nach Ablauf: Wiedereinstellen für CHF {price}", { price: RELIST_PRICE_CHF })
          )}
        </span>
      </div>
    </div>
  );
}
