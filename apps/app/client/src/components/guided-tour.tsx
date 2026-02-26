import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
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

function getTargetEl(target: string): Element | null {
    return document.querySelector(`[data-tour='${target}']`);
}


function TooltipArrow({ position, primaryColor }: { position: string; primaryColor?: string }) {
    const color = primaryColor || "white";
    const base = `absolute w-3 h-3 rotate-45`;
    const style = { backgroundColor: color };
    switch (position) {
        case "right":
            return <div className={`${base} -left-1.5 top-8 border-l border-b border-zinc-200 dark:border-zinc-700`} style={style} />;
        case "left":
            return <div className={`${base} -right-1.5 top-8 border-r border-t border-zinc-200 dark:border-zinc-700`} style={style} />;
        case "bottom":
            return <div className={`${base} left-8 -top-1.5 border-l border-t border-zinc-200 dark:border-zinc-700`} style={style} />;
        case "top":
            return <div className={`${base} left-8 -bottom-1.5 border-r border-b border-zinc-200 dark:border-zinc-700`} style={style} />;
        default:
            return null;
    }
}

export function GuidedTour({ steps, tourId, onComplete }: GuidedTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
    const [maskRects, setMaskRects] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    const step = steps?.[currentStep];
    const isCentered = !step?.target || step?.position === "center";

    const computeLayout = useCallback(() => {
        if (!step || isCentered) {
            setHighlightStyle(null);
            setMaskRects(null);
            setTooltipStyle({});
            return;
        }

        const el = getTargetEl(step.target);
        if (!el) {
            setHighlightStyle(null);
            setMaskRects(null);
            setTooltipStyle({});
            return;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            setHighlightStyle(null);
            setMaskRects(null);
            setTooltipStyle({});
            return;
        }

        const pad = 8;
        const hx = rect.left - pad;
        const hy = rect.top - pad;
        const hw = rect.width + pad * 2;
        const hh = rect.height + pad * 2;

        setHighlightStyle({
            position: "fixed",
            top: hy,
            left: hx,
            width: hw,
            height: hh,
            pointerEvents: "none",
        });

        setMaskRects({ x: hx, y: hy, w: hw, h: hh });

        const tooltipW = 320;
        const tooltipEl = tooltipRef.current;
        const tooltipH = tooltipEl ? tooltipEl.offsetHeight : 180;
        const gap = 14;
        let top = 0;
        let left = 0;

        const pos = step.position || "bottom";

        switch (pos) {
            case "right":
                top = rect.top + rect.height / 2 - tooltipH / 2;
                left = rect.right + gap;
                if (left + tooltipW > window.innerWidth - 12) {
                    left = rect.left - tooltipW - gap;
                }
                break;
            case "left":
                top = rect.top + rect.height / 2 - tooltipH / 2;
                left = rect.left - tooltipW - gap;
                if (left < 12) {
                    left = rect.right + gap;
                }
                break;
            case "top":
                top = rect.top - tooltipH - gap;
                left = rect.left + rect.width / 2 - tooltipW / 2;
                if (top < 12) {
                    top = rect.bottom + gap;
                }
                break;
            case "bottom":
            default:
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2 - tooltipW / 2;
                if (top + tooltipH > window.innerHeight - 12) {
                    top = rect.top - tooltipH - gap;
                }
                break;
        }

        top = Math.max(12, Math.min(top, window.innerHeight - tooltipH - 12));
        left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));

        setTooltipStyle({ position: "fixed", top, left, width: tooltipW });
    }, [step, isCentered]);

    const scheduleUpdate = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(computeLayout);
    }, [computeLayout]);

    useEffect(() => {
        const alreadyDone = localStorage.getItem(tourStorageKey(tourId));
        if (!alreadyDone) {
            const timer = setTimeout(() => setIsVisible(true), 600);
            return () => clearTimeout(timer);
        }
    }, [tourId]);

    const finish = useCallback(() => {
        setIsVisible(false);
        localStorage.setItem(tourStorageKey(tourId), "true");
        onComplete?.();
    }, [onComplete, tourId]);

    const isStepReachable = useCallback((idx: number) => {
        const s = steps[idx];
        if (!s.target || s.position === "center") return true;
        const el = getTargetEl(s.target);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }, [steps]);

    const scrollToTarget = useCallback((target: string) => {
        const el = getTargetEl(target);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!inViewport) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, []);

    const goTo = useCallback((idx: number) => {
        setCurrentStep(idx);
        const s = steps[idx];
        if (s?.target && s.position !== "center") {
            scrollToTarget(s.target);
        }
    }, [steps, scrollToTarget]);

    const next = useCallback(() => {
        let nextIdx = currentStep + 1;
        while (nextIdx < steps.length && !isStepReachable(nextIdx)) {
            nextIdx++;
        }
        if (nextIdx < steps.length) {
            goTo(nextIdx);
        } else {
            finish();
        }
    }, [currentStep, finish, goTo, isStepReachable, steps.length]);

    const prev = useCallback(() => {
        let prevIdx = currentStep - 1;
        while (prevIdx > 0 && !isStepReachable(prevIdx)) {
            prevIdx--;
        }
        if (prevIdx >= 0) goTo(prevIdx);
    }, [currentStep, goTo, isStepReachable]);

    useEffect(() => {
        if (!isVisible) return;

        let retries = 0;
        const maxRetries = 15;

        const tryLayout = () => {
            computeLayout();
            if (step?.target && step.position !== "center") {
                const el = getTargetEl(step.target);
                if ((!el || el.getBoundingClientRect().width === 0) && retries < maxRetries) {
                    retries++;
                    setTimeout(tryLayout, 100);
                    return;
                }
            }
        };

        setTimeout(tryLayout, 50);

        const handleResize = () => scheduleUpdate();
        const handleScroll = () => scheduleUpdate();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") finish();
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("keydown", handleKeyDown);

        const interval = setInterval(scheduleUpdate, 500);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("keydown", handleKeyDown);
            cancelAnimationFrame(rafRef.current);
            clearInterval(interval);
        };
    }, [isVisible, currentStep, computeLayout, scheduleUpdate, step, finish, next, prev]);

    useLayoutEffect(() => {
        if (isVisible) computeLayout();
    }, [isVisible, currentStep, computeLayout]);

    if (!isVisible || !step) return null;

    const maskId = `tour-mask-${tourId}`;
    const visibleIndices = steps.map((_, i) => i).filter(i => isStepReachable(i));
    const visibleSteps = visibleIndices.map(i => steps[i]);
    const currentVisibleIdx = visibleIndices.indexOf(currentStep);
    const totalVisible = visibleSteps.length;

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
                    <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                        <defs>
                            <mask id={maskId}>
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                {maskRects && (
                                    <motion.rect
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: 1,
                                            x: maskRects.x,
                                            y: maskRects.y,
                                            width: maskRects.w,
                                            height: maskRects.h,
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

                {highlightStyle && !isCentered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent"
                        style={{
                            ...highlightStyle,
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
                    className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-5 ${
                        isCentered ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px]" : ""
                    }`}
                    style={!isCentered ? tooltipStyle : undefined}
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
                            {visibleSteps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentVisibleIdx
                                            ? "w-6 bg-primary"
                                            : i < currentVisibleIdx
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

                    <p className="text-[10px] text-zinc-400 mt-3 text-center">
                        {currentVisibleIdx + 1} / {totalVisible}
                    </p>
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
