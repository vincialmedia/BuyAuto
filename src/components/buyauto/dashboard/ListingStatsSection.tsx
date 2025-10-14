import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, AlertCircle, BarChart3 } from "lucide-react";
import { DashboardStats } from "@/services/dashboardService";

interface ListingStatsSectionProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export default function ListingStatsSection({ stats, isLoading }: ListingStatsSectionProps) {
  const cards = [
    {
      title: "Insgesamt",
      value: stats.total,
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse border-neutral-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-neutral-200 rounded-xl"></div>
              </div>
              <div className="w-16 h-8 bg-neutral-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-neutral-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
