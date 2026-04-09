
import { Check, ArrowRight, Layout, Users, Gift, Info, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wedding } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getAppNls } from "@/lib/nls";

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    href: string;
    isCompleted: boolean;
    icon: React.ElementType;
}

export function OnboardingChecklist({ wedding }: { wedding: Wedding }) {
    const { data: guests } = useQuery({
        queryKey: [`/api/guests`, wedding.id],
        enabled: !!wedding.id
    });
    const language = wedding.config?.language === "en" ? "en" : "fr";
    const nls = getAppNls(language);

    const steps: ChecklistItem[] = [
        {
            id: 'template',
            label: nls.checklist.steps.template.label,
            description: nls.checklist.steps.template.description,
            href: `/templates`,
            isCompleted: !!wedding.templateId,
            icon: Layout
        },
        {
            id: 'info',
            label: nls.checklist.steps.info.label,
            description: nls.checklist.steps.info.description,
            href: `/preview/${wedding.slug}`,
            isCompleted: !!wedding.weddingDate && !!wedding.config?.texts?.heroSubtitle,
            icon: Info
        },
        {
            id: 'guests',
            label: nls.checklist.steps.guests.label,
            description: nls.checklist.steps.guests.description,
            href: `/guests`,
            isCompleted: (guests as any[])?.length > 0,
            icon: Users
        },
        {
            id: 'features',
            label: nls.checklist.steps.features.label,
            description: nls.checklist.steps.features.description,
            href: `/gifts`,
            isCompleted: !!wedding.config?.features?.cagnotteEnabled || !!wedding.config?.features?.giftsEnabled,
            icon: Gift
        },
        {
            id: 'publish',
            label: nls.checklist.steps.publish.label,
            description: nls.checklist.steps.publish.description,
            href: `/welcome`,
            isCompleted: wedding.isPublished,
            icon: CheckCircle2
        }
    ];

    const completedCount = steps.filter(s => s.isCompleted).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    if (progress === 100 && wedding.isPublished) return null;

    const firstIncompleteIndex = steps.findIndex(s => !s.isCompleted);

    return (
        <Card className="border-0 shadow-lg rounded-2xl bg-white overflow-hidden" data-tour="checklist">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-serif">{nls.checklist.title}</CardTitle>
                        <CardDescription>{nls.checklist.completedSteps.replace("{done}", String(completedCount)).replace("{total}", String(steps.length))}</CardDescription>
                    </div>
                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>
                <div className="w-full bg-primary/10 h-[3px] rounded-full mt-4 overflow-hidden">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                {steps.map((step, index) => {
                    const isFirstIncomplete = index === firstIncompleteIndex;
                    return (
                        <div
                            key={step.id}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5",
                                step.isCompleted
                                    ? "bg-background/50 border-primary/20 opacity-50"
                                    : isFirstIncomplete
                                        ? "border-amber-200 bg-amber-50/30 shadow-sm"
                                        : "bg-white dark:bg-black border-border shadow-sm hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                                    step.isCompleted
                                        ? "bg-green-100 text-green-600"
                                        : "bg-amber-100 text-amber-700"
                                )}>
                                    {step.isCompleted
                                        ? <Check className="h-5 w-5 animate-check-pop" />
                                        : index + 1
                                    }
                                </div>
                                <div>
                                    <h4 className={cn("font-medium", step.isCompleted && "line-through text-muted-foreground")}>
                                        {step.label}
                                    </h4>
                                    <p className="text-sm text-muted-foreground hidden md:block">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                            {!step.isCompleted && (
                                <Button
                                    asChild
                                    size="sm"
                                    variant={isFirstIncomplete ? "default" : "outline"}
                                    className="ml-4"
                                >
                                    <Link href={step.href}>
                                        {nls.checklist.cta} <ArrowRight className="ml-2 h-3 w-3" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
