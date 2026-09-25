
import { Shield, CheckCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale, useT } from "@/i18n/runtime";
import { localizePath } from "@/i18n/config";

export default function TrustBadges() {
  const t = useT();
  const locale = useLocale();
  const badges = [
    {
      icon: Shield,
      text: t("Inserate manuell geprüft"),
      color: "from-green-500 to-green-600"
    },
    {
      icon: CheckCircle,
      text: t("Sichere Zahlungen via Stripe"),
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      text: t("Schweizer Team in Zürich"),
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <Card className="border-0 shadow-lg shadow-neutral-900/5 bg-gradient-to-br from-white to-neutral-50 rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg text-neutral-900 mb-4">
          {t("Sicher & Vertrauensvoll")}
        </h3>
        <div className="space-y-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-neutral-700 font-medium">
                  {badge.text}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-neutral-200/60">
          <a
            href={localizePath("/leasingvertrag-uebertragen#tipps", locale)}
            className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline transition-colors"
          >
            {t("Sicher kaufen / übernehmen – Tipps →")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
