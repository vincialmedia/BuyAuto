import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizard } from "./ListingWizard";
import { planSelectionSchema, type PlanSelectionForm } from "@/lib/buyauto/schemas";
import { ChevronLeft, Check, Star, Clock, Infinity, Zap } from "lucide-react";

const pricingPlans = [
  {
    id: "free30",
    name: "Standard",
    subtitle: "Gratis",
    price: 0,
    duration: 30,
    duration_days: 30,
    is_premium: false,
    icon: Clock,
    color: "neutral",
    features: [
      "30 Tage online",
      "Standardplatzierung",
      "Basis-Sichtbarkeit",
      "Mobile & Desktop"
    ],
    description: "Perfekt für einen schnellen Verkauf"
  },
  {
    id: "premium30",
    name: "Premium",
    subtitle: "Empfohlen",
    price: 30,
    duration: 30,
    duration_days: 30,
    is_premium: true,
    icon: Star,
    color: "red",
    popular: true,
    features: [
      "30 Tage Premium-Platzierung",
      "Erscheint ganz oben",
      "Roter Premium-Rahmen",
      "2x mehr Sichtbarkeit",
      "Hervorgehobenes Badge"
    ],
    description: "Maximale Aufmerksamkeit für Ihr Inserat"
  },
  {
    id: "paid90",
    name: "Verlängert",
    subtitle: "Mehr Zeit",
    price: 50,
    duration: 90,
    duration_days: 90,
    is_premium: false,
    icon: Clock,
    color: "blue",
    features: [
      "90 Tage online",
      "Standardplatzierung",
      "Längere Laufzeit",
      "Mehr Interessenten erreichen"
    ],
    description: "Ideal wenn Sie mehr Zeit benötigen"
  },
  {
    id: "unlimited",
    name: "Unlimitiert",
    subtitle: "Ohne Ablauf",
    price: 190,
    duration: null,
    duration_days: null,
    is_premium: false,
    icon: Infinity,
    color: "purple",
    features: [
      "Unbegrenzte Laufzeit",
      "Bis zum Verkauf online",
      "Kein Ablaufdatum",
      "Maximum Reichweite"
    ],
    description: "Bis Ihr Fahrzeug verkauft ist"
  }
];

export default function Step4_PlanSelection() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const [selectedPlan, setSelectedPlan] = useState(data.price_plan || "");
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PlanSelectionForm>({
    resolver: zodResolver(planSelectionSchema),
    defaultValues: {
      price_plan: data.price_plan,
      is_premium: data.is_premium,
      duration_days: data.duration_days,
      plan_price: data.plan_price,
    },
  });

  const handlePlanSelect = (plan: typeof pricingPlans[0]) => {
    setSelectedPlan(plan.id);
    setValue("price_plan", plan.id);
    setValue("is_premium", plan.is_premium);
    setValue("duration_days", plan.duration_days);
    setValue("plan_price", plan.price);
  };

  const onSubmit = async (formData: PlanSelectionForm) => {
    const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan);
    
    if (!selectedPlanData) return;

    updateData(formData);

    // If free plan, proceed directly
    if (selectedPlanData.price === 0) {
      nextStep();
      return;
    }

    // For paid plans, initiate Stripe checkout (stub implementation)
    setProcessingPayment(true);
    
    try {
      // TODO: Replace with actual Stripe integration
      await initiateStripeCheckout(selectedPlanData);
    } catch (error) {
      console.error("Payment failed:", error);
      setProcessingPayment(false);
    }
  };

  const initiateStripeCheckout = async (plan: typeof pricingPlans[0]) => {
    // Stub implementation - replace with actual Stripe integration
    console.log("Initiating Stripe checkout for plan:", plan);
    
    // Simulate payment process
    setTimeout(() => {
      setProcessingPayment(false);
      nextStep();
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('de-CH');
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2">
          Inseratsdauer & Sichtbarkeit wählen
        </h2>
        <p className="text-neutral-600">
          Wählen Sie die optimale Laufzeit für Ihr Inserat
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const colorClasses = {
              neutral: "border-neutral-200 hover:border-neutral-300",
              red: "border-red-200 hover:border-red-300 bg-gradient-to-br from-red-50/50 to-orange-50/30",
              blue: "border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50/50 to-cyan-50/30",
              purple: "border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50/50 to-indigo-50/30"
            };
            
            const selectedClasses = {
              neutral: "border-neutral-400 shadow-lg shadow-neutral-200",
              red: "border-red-400 shadow-lg shadow-red-200/50",
              blue: "border-blue-400 shadow-lg shadow-blue-200/50",
              purple: "border-purple-400 shadow-lg shadow-purple-200/50"
            };

            return (
              <Card
                key={plan.id}
                className={`
                  relative cursor-pointer transition-all duration-300 rounded-2xl overflow-hidden
                  ${isSelected 
                    ? `${selectedClasses[plan.color as keyof typeof selectedClasses]} scale-[1.02]` 
                    : `${colorClasses[plan.color as keyof typeof colorClasses]} hover:scale-[1.01] hover:shadow-md`
                  }
                  ${plan.popular ? 'ring-2 ring-red-200 ring-offset-2' : ''}
                `}
                onClick={() => handlePlanSelect(plan)}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 text-xs font-medium shadow-lg">
                      {plan.subtitle}
                    </Badge>
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className={`
                      w-12 h-12 mx-auto rounded-2xl flex items-center justify-center
                      ${plan.color === 'red' ? 'bg-red-100 text-red-600' :
                        plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-neutral-100 text-neutral-600'
                      }
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {plan.name}
                    </h3>
                    
                    {!plan.popular && (
                      <p className="text-sm text-neutral-500">
                        {plan.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center py-2">
                    <div className="text-3xl font-bold text-neutral-900">
                      CHF {formatPrice(plan.price)}
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      {plan.duration ? `${plan.duration} Tage` : "Unlimitiert"}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-neutral-700">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Description */}
                  <p className="text-xs text-neutral-500 text-center pt-2 border-t border-neutral-100">
                    {plan.description}
                  </p>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className={`
                      absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                      ${plan.color === 'red' ? 'bg-red-500' :
                        plan.color === 'blue' ? 'bg-blue-500' :
                        plan.color === 'purple' ? 'bg-purple-500' :
                        'bg-neutral-500'
                      }
                    `}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Error Message */}
        {errors.price_plan && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              {errors.price_plan.message}
            </p>
          </div>
        )}

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl p-6 border border-amber-200/30">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Gewählter Plan</h3>
            {(() => {
              const plan = pricingPlans.find(p => p.id === selectedPlan);
              return plan ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">{plan.name}</p>
                    <p className="text-sm text-neutral-600">
                      {plan.duration ? `${plan.duration} Tage Laufzeit` : "Unbegrenzte Laufzeit"}
                      {plan.is_premium && " • Premium-Platzierung"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">
                      CHF {formatPrice(plan.price)}
                    </p>
                    {plan.price > 0 && (
                      <p className="text-sm text-neutral-500">einmalig</p>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            onClick={prevStep}
            variant="outline"
            className="px-6 py-3 bg-transparent hover:bg-neutral-50 border-neutral-300 text-neutral-600 rounded-xl transition-all duration-200"
            disabled={processingPayment}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          
          <Button
            type="submit"
            disabled={!selectedPlan || processingPayment}
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg shadow-amber-200 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {processingPayment ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Zahlung wird verarbeitet...
              </div>
            ) : (
              selectedPlan && pricingPlans.find(p => p.id === selectedPlan)?.price === 0 
                ? "Weiter zur Vorschau"
                : "Weiter zur Bezahlung"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}