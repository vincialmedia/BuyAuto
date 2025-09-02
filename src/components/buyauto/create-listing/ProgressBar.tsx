import { useWizard } from "./ListingWizard";

const steps = [
  { number: 1, label: "Fahrzeugdaten", description: "Grundlegende Fahrzeuginformationen" },
  { number: 2, label: "Leasingdetails", description: "Konditionen und Standort" },
  { number: 3, label: "Bilder", description: "Fotos hochladen" },
  { number: 4, label: "Plan wählen", description: "Inseratsdauer & Sichtbarkeit" },
  { number: 5, label: "Vorschau", description: "Bestätigung und Veröffentlichung" },
];

export default function ProgressBar() {
  const { currentStep } = useWizard();

  return (
    <div className="w-full">
      {/* Desktop Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 w-full h-0.5 bg-neutral-200 -z-10">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center group">
              {/* Step Circle */}
              <div className={`
                relative w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm
                transition-all duration-300 shadow-lg
                ${currentStep >= step.number 
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200' 
                  : 'bg-white text-neutral-400 border-2 border-neutral-200 shadow-neutral-100'
                }
                ${currentStep === step.number ? 'scale-110 shadow-xl' : ''}
              `}>
                {currentStep > step.number ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>

              {/* Step Content */}
              <div className="mt-3 text-center min-w-0 max-w-[140px]">
                <p className={`
                  text-sm font-medium transition-colors duration-200
                  ${currentStep >= step.number ? 'text-amber-600' : 'text-neutral-500'}
                `}>
                  {step.label}
                </p>
                <p className="text-xs text-neutral-400 mt-1 leading-tight">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 bg-neutral-200 rounded-full h-1.5">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-neutral-600">
            {currentStep}/{steps.length}
          </span>
        </div>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-neutral-900">
            {steps[currentStep - 1].label}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>
    </div>
  );
}