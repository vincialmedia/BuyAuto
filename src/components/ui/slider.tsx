import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type RootProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

const Slider = React.forwardRef <
    React.ElementRef < typeof SliderPrimitive.Root >,
    RootProps & {
        /** Human-friendly defaults; override per-usage if needed */
        step?: number;
        min?: number;
        max?: number;
        "aria-label"?: string;
    }
        > (({ className, step = 1, min = 0, max = 100, ...props }, ref) => (
            <SliderPrimitive.Root
                ref={ref}
                step={step}
                min={min}
                max={max}
                className={cn(
                    "relative flex w-full touch-none select-none items-center cursor-pointer",
                    className
                )}
                {...props}
            >
                <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200 cursor-pointer">
                    <SliderPrimitive.Range className="absolute h-full bg-red-600 cursor-pointer" />
                </SliderPrimitive.Track>

                {/* Single-thumb slider by default; callers can pass multiple values if desired */}
                <SliderPrimitive.Thumb
                    className={cn(
                        "block h-5 w-5 rounded-full border-2 border-red-600 bg-white shadow-lg transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2",
                        "disabled:pointer-events-none disabled:opacity-50",
                        "cursor-grab hover:scale-110 active:cursor-grabbing active:scale-95"
                    )}
                />
            </SliderPrimitive.Root>
        ));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
