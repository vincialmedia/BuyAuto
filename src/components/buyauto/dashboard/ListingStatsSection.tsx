import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Clock, CheckCircle2, XCircle, BarChart3, TrendingUp, AlertCircle } from "lucide-react";

interface ListingStatsSectionProps {
  stats: {
    active: number;
    pending: number;
    sold: number;
    expired: number;
  } | null;
}

export function ListingStatsSection({ stats }: ListingStatsSectionProps) {
  // Handle null/undefined stats gracefully
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const total = stats.active + stats.pending + stats.sold + stats.expired;

  const cards = [
    {
      title: "Insgesamt",
      value: total,
      icon: BarChart3,
      color: "neutral",
      description: "Alle Ihre Inserate"
    },
    {
      title: "Aktive Inserate",
      value: stats.active,
      icon: TrendingUp,
      color: "emerald",
      description: "Veröffentlicht und sichtbar"
    },
    {
      title: "Ausstehend",
      value: stats.pending,
      icon: Clock,
      color: "amber",
      description: "Warten auf Freigabe"
    },
    {
      title: "Abgelaufen",
      value: stats.expired,
      icon: AlertCircle,
      color: "red",
      description: "Benötigen Verlängerung"
    }
  ];

  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    neutral: "bg-neutral-50 text-neutral-600 border-neutral-100"
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title}
            className="hover:shadow-md transition-all duration-200 border-neutral-200/60 bg-gradient-to-br from-white to-neutral-50/30"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {card.value}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-500">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
