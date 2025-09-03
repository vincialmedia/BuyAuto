
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, AlertCircle, BarChart3 } from "lucide-react";
import { DashboardStats } from "@/services/dashboardService";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: "Aktive Inserate",
      value: stats.active,
      icon: TrendingUp,
      color: "emerald",
      description: "Veröffentlicht und aktiv"
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
    },
    {
      title: "Insgesamt",
      value: stats.total,
      icon: BarChart3,
      color: "neutral",
      description: "Alle Ihre Inserate"
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-neutral-200 rounded-lg"></div>
                <div className="w-6 h-6 bg-neutral-200 rounded"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title}
            className="hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-300 hover:-translate-y-0.5 border-neutral-200/60 bg-gradient-to-br from-white to-neutral-50/50"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-neutral-900 leading-none">
                    {card.value}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
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
