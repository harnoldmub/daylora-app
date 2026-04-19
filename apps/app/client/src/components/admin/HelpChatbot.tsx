import { useState, useMemo } from "react";
import {
  HelpCircle,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Paintbrush,
  Users,
  Gift,
  Share2,
  CreditCard,
  FileText,
  ExternalLink,
  Radio,
  ListChecks,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getAppNls } from "@/lib/nls";

interface FAQItem {
  question: string;
  answer: string;
  link?: { label: string; href: string };
  category: string;
}

const categoryIcons: Record<string, typeof Paintbrush> = {
  Design: Paintbrush,
  Invités: Users,
  Guests: Users,
  Cadeaux: Gift,
  Gifts: Gift,
  Partage: Share2,
  Sharing: Share2,
  Abonnement: CreditCard,
  Subscription: CreditCard,
  Pages: FileText,
  Checklist: ListChecks,
  Planning: CalendarDays,
  Budget: Wallet,
};

type HelpChatbotProps = {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  language?: string;
};

export function HelpChatbot({ isOpen: isOpenProp, onOpenChange, hideTrigger = false, language }: HelpChatbotProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const nls = getAppNls(language);
  const faqItems: FAQItem[] = nls.helpCenter.items.map((item) => ({
    category: nls.helpCenter.categories[item.category as keyof typeof nls.helpCenter.categories],
    question: item.question,
    answer: item.answer,
    link: "link" in item ? item.link : undefined,
  }));
  const categories = Array.from(new Set(faqItems.map((item) => item.category)));
  const isControlled = typeof isOpenProp === "boolean";
  const isOpen = isControlled ? isOpenProp : internalOpen;

  const setIsOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return faqItems;
    const q = search.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  return (
    <>
      {!hideTrigger ? (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center"
          aria-label={nls.helpCenter.title}
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      ) : null}

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{nls.helpCenter.title}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={nls.helpCenter.searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setExpandedQuestion(null);
                  }}
                  className="w-full h-10 pl-9 pr-4 rounded-lg border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.keys(groupedItems).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{nls.helpCenter.noResults.replace("{search}", search)}</p>
                  <p className="text-xs mt-1">{nls.helpCenter.noResultsHint}</p>
                </div>
              )}
              {categories
                .filter((cat) => groupedItems[cat])
                .map((category) => {
                  const Icon = categoryIcons[category] || FileText;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {category}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {groupedItems[category].map((item, idx) => {
                          const isExpanded = expandedQuestion === item.question;
                          return (
                            <div
                              key={`${category}-${idx}`}
                              className="rounded-lg border bg-card overflow-hidden"
                            >
                              <button
                                onClick={() =>
                                  setExpandedQuestion(
                                    isExpanded ? null : item.question,
                                  )
                                }
                                className="w-full flex items-center gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span>{item.question}</span>
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 pt-0 ml-6">
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {item.answer}
                                  </p>
                                  {item.link && (
                                    <Link
                                      href={item.link.href}
                                      onClick={() => setIsOpen(false)}
                                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      {item.link.label}
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                {nls.helpCenter.footer}{" "}
                <a
                  href="mailto:help@daylora.app"
                  className="text-primary hover:underline"
                >
                  help@daylora.app
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
