
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWizard } from "./ListingWizard";
import { planSelectionSchema, type PlanSelectionForm } from "@/lib/buyauto/schemas";
import { ChevronLeft, Check, Clock, Calendar, Infinity, Zap, Star, X, Info } from "lucide-react";

const basePlans = [
  {
    id: "free30",
    name: "Standard",
    subtitle: "Gratis",
    price: 0,
    duration: 60,
    duration_days: 60,
    icon: Clock,
    color: "neutral",
    features: [
      "60 Tage online",
      "Standardplatzierung",
      "5 Fotos möglich",
      "Mobile & Desktop"
    ],
    description: "Perfekt für einen schnellen Verkauf",
    renewable: false
  },
  {
    id: "paid90",
    name: "Verlängert",
    subtitle: "90 Tage",
    price: 50,
    duration: 90,
    duration_days: 90,
    icon: Calendar,
    color: "blue",
    features: [
      "90 Tage online",
      "Standardplatzierung",
      "15 Fotos möglich",
      "Mehr Interessenten erreichen"
    ],
    description: "Ideal wenn Sie mehr Zeit benötigen",
    renewable: true
  },
  {
    id: "unlimited",
    name: "Unlimitiert",
    subtitle: "Ohne Ablauf",
    price: 190,
    duration: null,
    duration_days: null,
    icon: Infinity,
    color: "purple",
    features: [
      "Unbegrenzte Laufzeit",
      "Bis zum Verkauf online",
      "15 Fotos möglich",
      "Kein Ablaufdatum"
    ],
    description: "Bis Ihr Fahrzeug verkauft ist",
    renewable: true
  }
];

export default function Step3_PlanSelection() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const [selectedPlan, setSelectedPlan] = useState(data.price_plan || "");
  const [isPremiumEnabled, setIsPremiumEnabled] = useState(data.is_premium || false);
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

  const handlePlanSelect = (plan: typeof basePlans[0]) => {
    setSelectedPlan(plan.id);
    setValue("price_plan", plan.id);
    setValue("duration_days", plan.duration_days);
    
    // Calculate total price (base plan + premium if enabled)
    const totalPrice = plan.price + (isPremiumEnabled ? 30 : 0);
    setValue("plan_price", totalPrice);
  };

  const handlePremiumToggle = (enabled: boolean) => {
    setIsPremiumEnabled(enabled);
    setValue("is_premium", enabled);
    
    // Recalculate total price
    const selectedPlanData = basePlans.find(p => p.id === selectedPlan);
    if (selectedPlanData) {
      const totalPrice = selectedPlanData.price + (enabled ? 30 : 0);
      setValue("plan_price", totalPrice);
    }
  };

  const onSubmit = async (formData: PlanSelectionForm) => {
    const selectedPlanData = basePlans.find(p => p.id === selectedPlan);
    
    if (!selectedPlanData) return;

    // Update form data with premium toggle
    const finalData = {
      ...formData,
      is_premium: isPremiumEnabled,
      plan_price: selectedPlanData.price + (isPremiumEnabled ? 30 : 0)
    };

    updateData(finalData);

    // If free plan without premium, proceed directly
    if (finalData.plan_price === 0) {
      nextStep();
      return;
    }

    // For paid plans, initiate Stripe checkout (stub implementation)
    setProcessingPayment(true);
    
    try {
      // TODO: Replace with actual Stripe integration
      await initiateStripeCheckout(selectedPlanData, isPremiumEnabled);
    } catch (error) {
      console.error("Payment failed:", error);
      setProcessingPayment(false);
    }
  };

  const initiateStripeCheckout = async (plan: typeof basePlans[0], premium: boolean) => {
    // Stub implementation - replace with actual Stripe integration
    console.log("Initiating Stripe checkout for plan:", plan, "with premium:", premium);
    
    // Simulate payment process
    setTimeout(() => {
      setProcessingPayment(false);
      nextStep();
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('de-CH');
  };

  const getTotalPrice = () => {
    const selectedPlanData = basePlans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return 0;
    return selectedPlanData.price + (isPremiumEnabled ? 30 : 0);
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
            Plan wählen
          </h2>
          <p className="text-neutral-600 font-light leading-relaxed">
            Wählen Sie die optimale Laufzeit für Ihr Inserat
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Base Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {basePlans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              const colorClasses = {
                neutral: "border-neutral-200/40 hover:border-neutral-300",
                blue: "border-blue-200/40 hover:border-blue-300 bg-gradient-to-br from-blue-50/30 to-white",
                purple: "border-purple-200/40 hover:border-purple-300 bg-gradient-to-br from-purple-50/30 to-white"
              };
              
              const selectedClasses = {
                neutral: "border-neutral-400 shadow-md shadow-neutral-200/50",
                blue: "border-blue-500 shadow-md shadow-blue-200/50",
                purple: "border-purple-500 shadow-md shadow-purple-200/50"
              };

              return (
                <Card
                  key={plan.id}
                  className={`
                    relative cursor-pointer transition-all duration-300 rounded-lg overflow-hidden bg-white
                    ${isSelected 
                      ? `${selectedClasses[plan.color as keyof typeof selectedClasses]} scale-[1.02]` 
                      : `${colorClasses[plan.color as keyof typeof colorClasses]} hover:scale-[1.01] shadow-sm hover:shadow-md`
                    }
                  `}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="text-center space-y-2">
                      <div className={`
                        w-12 h-12 mx-auto rounded-lg flex items-center justify-center
                        ${plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                          'bg-neutral-100 text-neutral-600'
                        }
                      `}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
                        {plan.name}
                      </h3>
                      
                      <p className="text-sm text-neutral-500 font-light">
                        {plan.subtitle}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-center py-2">
                      <div className="text-3xl font-bold text-neutral-900">
                        CHF {formatPrice(plan.price)}
                      </div>
                      <div className="text-sm text-neutral-500 mt-1 font-light">
                        {plan.duration ? `${plan.duration} Tage` : "Unlimitiert"}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-neutral-700">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="font-light">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Renewable Status */}
                    <div className="pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-light text-neutral-700">
                          Inserat Erneuerbar
                        </span>
                        <div className="flex items-center space-x-1">
                          {plan.renewable ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3 text-neutral-400 hover:text-neutral-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">
                                {plan.renewable
                                  ? "Das Inserat kann bei Ablauf einfach erneuert werden."
                                  : "Das Inserat muss bei Erneuerung neu erfasst werden"
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-500 text-center pt-2 border-t border-neutral-100 font-light">
                      {plan.description}
                    </p>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className={`
                        absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                        ${plan.color === 'blue' ? 'bg-blue-500' :
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

          {/* Premium Add-on */}
          <div className="bg-gradient-to-br from-red-50 to-red-100/30 rounded-lg p-6 border-2 border-red-200/40">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-red-600" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
                      Premium-Boost hinzufügen
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-neutral-600 font-light">
                        + CHF 30
                      </span>
                      <Switch
                        id="premium-toggle"
                        checked={isPremiumEnabled}
                        onCheckedChange={handlePremiumToggle}
                        className="data-[state=checked]:bg-red-500"
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-neutral-600 font-light mb-3">
                    Maximale Sichtbarkeit für Ihr Inserat - kombinierbar mit jedem Plan
                  </p>
                  
                  <ul className="space-y-1">
                    {[
                      "Erscheint ganz oben in den Suchergebnissen",
                      "Roter Premium-Rahmen um Ihr Inserat",
                      "2x mehr Sichtbarkeit und Klicks",
                      "Hervorgehobenes Premium-Badge"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-neutral-700">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Premium Renewable Status */}
                  <div className="pt-3 mt-3 border-t border-red-200/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light text-neutral-700">
                        Inserat erneuerbar
                      </span>
                      <div className="flex items-center space-x-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-neutral-400 hover:text-neutral-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">
                              Das Inserat kann bei Ablauf einfach erneuert werden.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.price_plan && (
            <div className="p-4 bg-red-50 border border-red-200/60 rounded-lg">
              <p className="text-sm text-red-600 flex items-center font-light">
                <Zap className="w-4 h-4 mr-2" />
                {errors.price_plan.message}
              </p>
            </div>
          )}

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="bg-gradient-to-br from-neutral-50 to-red-50/20 rounded-lg p-6 border border-neutral-200/40">
              <h3 className="text-lg font-medium text-neutral-900 mb-4 tracking-tight">Gewählter Plan</h3>
              {(() => {
                const plan = basePlans.find(p => p.id === selectedPlan);
                const totalPrice = getTotalPrice();
                return plan ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {plan.name}
                        {isPremiumEnabled && <span className="text-red-600 ml-2">+ Premium</span>}
                      </p>
                      <p className="text-sm text-neutral-600 font-light">
                        {plan.duration ? `${plan.duration} Tage Laufzeit` : "Unbegrenzte Laufzeit"}
                        {isPremiumEnabled && " • Premium-Platzierung"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-neutral-900">
                        CHF {formatPrice(totalPrice)}
                      </p>
                      {totalPrice > 0 && (
                        <p className="text-sm text-neutral-500 font-light">einmalig</p>
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
              className="px-6 py-3 bg-transparent hover:bg-neutral-50 border-neutral-200/40 text-neutral-600 rounded-lg transition-all duration-200"
              disabled={processingPayment}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            
            <Button
              type="submit"
              disabled={!selectedPlan || processingPayment}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
            >
              {processingPayment ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Zahlung wird verarbeitet...
                </div>
              ) : (
                getTotalPrice() === 0 
                  ? "Weiter zu Bildern"
                  : "Weiter zur Bezahlung"
              )}
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
}
