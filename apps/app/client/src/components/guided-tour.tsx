import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
    target: string;
    title: string;
    description: string;
    position?: "top" | "bottom" | "left" | "right" | "center";
}

interface GuidedTourProps {
    steps: TourStep[];
    tourId: string;
    onComplete?: () => void;
}

function tourStorageKey(tourId: string) {
    return `nocely_tour_${tourId}_done`;
}

function TooltipArrow({ position }: { position: string }) {
    const base = "absolute w-3 h-3 bg-white dark:bg-zinc-900 rotate-45 border-zinc-200 dark:border-zinc-700";
    switch (position) {
        case "right":
            return <div className={`${base} -left-1.5 top-8 border-l border-b`} />;
        case "left":
            return <div className={`${base} -right-1.5 top-8 border-r border-t`} />;
        case "bottom":
            return <div className={`${base} left-8 -top-1.5 border-l border-t`} />;
        case "top":
            return <div className={`${base} left-8 -bottom-1.5 border-r border-b`} />;
        default:
            return null;
    }
}

export function GuidedTour({ steps, tourId, onComplete }: GuidedTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const step = steps?.[currentStep];
    const isCentered = !step?.target || step?.position === "center";

    const updatePosition = useCallback(() => {
        if (!step || !step.target || step.position === "center") {
            setHighlightRect(null);
            setTooltipPos(null);
            return;
        }

        const el = document.querySelector(`[data-tour='${step.target}']`);
        if (!el) {
            setHighlightRect(null);
            setTooltipPos(null);
            return;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            setHighlightRect(null);
            setTooltipPos(null);
            return;
        }

        setHighlightRect(rect);

        const pad = 16;
        const tooltipW = 340;
        const tooltipEl = tooltipRef.current;
        const tooltipH = tooltipEl ? tooltipEl.offsetHeight : 200;
        let top = 0;
        let left = 0;

        switch (step.position) {
            case "right":
                top = rect.top + rect.height / 2 - tooltipH / 2;
                left = rect.right + pad;
                if (left + tooltipW > window.innerWidth - 8) {
                    left = rect.left - tooltipW - pad;
                }
                break;
            case "left":
                top = rect.top + rect.height / 2 - tooltipH / 2;
                left = rect.left - tooltipW - pad;
                if (left < 8) {
                    left = rect.right + pad;
                }
                break;
            case "bottom":
                top = rect.bottom + pad;
                left = rect.left + rect.width / 2 - tooltipW / 2;
                if (top + tooltipH > window.innerHeight - 8) {
                    top = rect.top - tooltipH - pad;
                }
                break;
            case "top":
                top = rect.top - tooltipH - pad;
                left = rect.left + rect.width / 2 - tooltipW / 2;
                if (top < 8) {
                    top = rect.bottom + pad;
                }
                break;
            default:
                top = rect.bottom + pad;
                left = rect.left + rect.width / 2 - tooltipW / 2;
                break;
        }

        top = Math.max(8, Math.min(top, window.innerHeight - tooltipH - 8));
        left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));

        setTooltipPos({ top, left });
    }, [step]);

    const scheduleUpdate = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            updatePosition();
        });
    }, [updatePosition]);

    useEffect(() => {
        const alreadyDone = localStorage.getItem(tourStorageKey(tourId));
        if (!alreadyDone) {
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, [tourId]);

    const finish = useCallback(() => {
        setIsVisible(false);
        localStorage.setItem(tourStorageKey(tourId), "true");
        onComplete?.();
    }, [onComplete, tourId]);

    const isStepVisible = useCallback((idx: number) => {
        const s = steps[idx];
        if (!s.target || s.position === "center") return true;
        const el = document.querySelector(`[data-tour='${s.target}']`);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }, [steps]);

    const next = useCallback(() => {
        let nextIdx = currentStep + 1;
        while (nextIdx < steps.length && !isStepVisible(nextIdx)) {
            nextIdx++;
        }
        if (nextIdx < steps.length) {
            setCurrentStep(nextIdx);
        } else {
            finish();
        }
    }, [currentStep, finish, isStepVisible, steps.length]);

    const prev = useCallback(() => {
        let prevIdx = currentStep - 1;
        while (prevIdx > 0 && !isStepVisible(prevIdx)) {
            prevIdx--;
        }
        if (prevIdx >= 0) setCurrentStep(prevIdx);
    }, [currentStep, isStepVisible]);

    useEffect(() => {
        if (!isVisible) return;

        if (retryRef.current) clearTimeout(retryRef.current);

        const tryUpdate = (attempts: number) => {
            scheduleUpdate();
            if (attempts > 0 && step?.target) {
                const el = document.querySelector(`[data-tour='${step.target}']`);
                if (!el || (el.getBoundingClientRect().width === 0)) {
                    retryRef.current = setTimeout(() => tryUpdate(attempts - 1), 100);
                    return;
                }
            }
            retryRef.current = setTimeout(() => scheduleUpdate(), 300);
        };
        tryUpdate(10);

        const handleResize = () => scheduleUpdate();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") finish();
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };
        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleResize, true);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleResize, true);
            window.removeEventListener("keydown", handleKeyDown);
            cancelAnimationFrame(rafRef.current);
            if (retryRef.current) clearTimeout(retryRef.current);
        };
    }, [isVisible, currentStep, scheduleUpdate, step, finish, next, prev]);

    if (!isVisible || !step) return null;

    const maskId = `tour-mask-${tourId}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Guide d'utilisation" style={{ pointerEvents: "auto" }}>
                {isCentered ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={finish}
                    />
                ) : (
                    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                        <defs>
                            <mask id={maskId}>
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                {highlightRect && (
                                    <motion.rect
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: 1,
                                            x: highlightRect.left - 6,
                                            y: highlightRect.top - 6,
                                            width: highlightRect.width + 12,
                                            height: highlightRect.height + 12,
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        rx="8"
                                        fill="black"
                                    />
                                )}
                            </mask>
                        </defs>
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="rgba(0,0,0,0.55)"
                            mask={`url(#${maskId})`}
                            style={{ pointerEvents: "auto" }}
                            onClick={finish}
                        />
                    </svg>
                )}

                {highlightRect && !isCentered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent"
                        style={{
                            top: highlightRect.top - 6,
                            left: highlightRect.left - 6,
                            width: highlightRect.width + 12,
                            height: highlightRect.height + 12,
                            pointerEvents: "none",
                        }}
                    >
                        <div className="absolute inset-0 rounded-lg animate-pulse bg-primary/10" />
                    </motion.div>
                )}

                <motion.div
                    ref={tooltipRef}
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`absolute bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-5 w-[340px] ${
                        isCentered ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""
                    }`}
                    style={
                        !isCentered && tooltipPos
                            ? { top: tooltipPos.top, left: tooltipPos.left }
                            : undefined
                    }
                    onClick={(e) => e.stopPropagation()}
                >
                    {!isCentered && <TooltipArrow position={step.position || "bottom"} />}

                    <button
                        onClick={finish}
                        aria-label="Fermer le guide"
                        className="absolute top-3 right-3 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="mb-3">
                        <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 pr-6">{step.title}</h3>
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
                        {step.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentStep
                                            ? "w-6 bg-primary"
                                            : i < currentStep
                                            ? "w-1.5 bg-primary/40"
                                            : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <Button variant="ghost" size="sm" onClick={prev} className="h-8 px-3 text-xs">
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Retour
                                </Button>
                            )}
                            {currentStep === 0 && (
                                <Button variant="ghost" size="sm" onClick={finish} className="h-8 px-3 text-xs text-zinc-400">
                                    Passer
                                </Button>
                            )}
                            <Button size="sm" onClick={next} className="h-8 px-4 text-xs">
                                {currentStep === steps.length - 1 ? (
                                    "Terminer"
                                ) : (
                                    <>
                                        Suivant
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export function useShouldShowTour(tourId: string): boolean {
    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(!localStorage.getItem(tourStorageKey(tourId)));
    }, [tourId]);
    return show;
}

export function resetTour(tourId: string) {
    localStorage.removeItem(tourStorageKey(tourId));
}

export function resetAllTours() {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("nocely_tour_") && key.endsWith("_done")) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("nocely_tour_completed");
}
