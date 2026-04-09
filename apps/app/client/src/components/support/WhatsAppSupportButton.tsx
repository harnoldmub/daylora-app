import { useMemo, useState } from "react";
import { Bot, Mail, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type WhatsAppSupportButtonProps = {
  pageLabel?: string;
  weddingName?: string | null;
  weddingSlug?: string | null;
  userEmail?: string | null;
  className?: string;
  showHint?: boolean;
};

type MiniMessage = {
  id: string;
  role: "bot" | "user";
  content: string;
};

const SUPPORT_EMAIL = "help@daylora.app";

const QUICK_ACTIONS = [
  {
    key: "design",
    label: "Aide pour le design",
    answer:
      "Vous pourrez modifier le template, les couleurs, les photos et les textes plus tard depuis l'espace Design. Commencez simple, puis affinez ensuite.",
  },
  {
    key: "guests",
    label: "Aide pour les invités",
    answer:
      "La gestion des invités se fait après la création du site. Vous pourrez ajouter vos proches, suivre les RSVP et partager leurs invitations personnalisées.",
  },
  {
    key: "premium",
    label: "Comprendre Premium",
    answer:
      "Premium débloque plus de personnalisation, plus d'invités, plus de cadeaux et davantage d'options pour votre événement.",
  },
  {
    key: "human",
    label: "Contacter l'équipe",
    answer:
      `Nous pouvons vous aider directement par email à ${SUPPORT_EMAIL}. Expliquez simplement votre besoin et nous vous répondrons rapidement.`,
  },
] as const;

function resolveCurrentPageLabel(fallback?: string) {
  if (fallback) return fallback;
  if (typeof window === "undefined") return "Page inconnue";
  return window.location.pathname;
}

function resolveCurrentPageUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function buildSupportMailto(params: {
  pageLabel?: string;
  weddingName?: string | null;
  weddingSlug?: string | null;
  userEmail?: string | null;
  draft?: string;
}) {
  const currentPage = resolveCurrentPageLabel(params.pageLabel);
  const currentPageUrl = resolveCurrentPageUrl();
  const eventLabel = params.weddingSlug || params.weddingName || "";
  const emailLabel = params.userEmail || "";

  const body = [
    "Bonjour, je suis sur Daylora et j'ai besoin d'aide.",
    "",
    params.draft ? `Message : ${params.draft}` : null,
    `Page : ${currentPage}`,
    currentPageUrl ? `URL : ${currentPageUrl}` : null,
    eventLabel ? `Événement : ${eventLabel}` : null,
    emailLabel ? `Email : ${emailLabel}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const subject = eventLabel ? `Aide Daylora - ${eventLabel}` : "Aide Daylora";
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function WhatsAppSupportButton({
  pageLabel,
  weddingName,
  weddingSlug,
  userEmail,
  className,
  showHint = false,
}: WhatsAppSupportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<MiniMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Bonjour, je peux vous aider à avancer rapidement. Choisissez un sujet ci-dessous ou écrivez votre question, puis nous pourrons aussi vous orienter vers help@daylora.app.",
    },
  ]);

  const mailtoHref = useMemo(
    () =>
      buildSupportMailto({
        pageLabel,
        weddingName,
        weddingSlug,
        userEmail,
        draft,
      }),
    [draft, pageLabel, userEmail, weddingName, weddingSlug]
  );

  const handleQuickAction = (label: string, answer: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `user-${prev.length + 1}`, role: "user", content: label },
      { id: `bot-${prev.length + 2}`, role: "bot", content: answer },
    ]);
  };

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `user-${prev.length + 1}`, role: "user", content: trimmed },
      {
        id: `bot-${prev.length + 2}`,
        role: "bot",
        content: `Merci, vous pouvez envoyer ce message à ${SUPPORT_EMAIL} et nous reviendrons vers vous rapidement.`,
      },
    ]);
    setDraft("");
  };

  return (
    <>
      <div className={cn("fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2", className)}>
        {showHint ? (
          <div className="hidden max-w-[280px] rounded-2xl border border-[#eadfce] bg-white/96 px-4 py-3 text-right shadow-lg backdrop-blur md:block">
            <p className="text-sm font-medium text-slate-900">
              Une question ?
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {SUPPORT_EMAIL}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group inline-flex items-center gap-2 rounded-full border border-[#d9e8d9] bg-white/95 px-3 py-3 text-slate-700 shadow-lg transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          aria-label="Ouvrir l'aide rapide"
        >
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="hidden text-sm font-medium sm:inline">Besoin d'aide ?</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-5 right-5 w-[calc(100vw-2rem)] max-w-[340px] overflow-hidden rounded-[24px] border border-[#eadfce] bg-[#fffdf9] shadow-2xl">
            <div className="border-b border-[#efe7d9] bg-white px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f1f1f] text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-slate-900">Mini assistant</h3>
                      <Bot className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Réponse rapide puis contact email si besoin.
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[280px] bg-[#fcfaf6]">
              <div className="space-y-2.5 px-3.5 py-3.5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm",
                      message.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "border border-[#eee4d5] bg-white text-slate-700"
                    )}
                  >
                    {message.content}
                  </div>
                ))}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => handleQuickAction(action.label, action.answer)}
                      className="rounded-full border border-[#eadfce] bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="border-t border-[#efe7d9] bg-white px-3.5 py-3">
              <div className="space-y-2.5">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Écrivez votre question..."
                  className="min-h-[78px] resize-none rounded-2xl border-[#eadfce] bg-[#fffdf9] text-sm"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {SUPPORT_EMAIL}
                  </a>
                  <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-end">
                    <Button type="button" size="sm" variant="outline" asChild className="h-10 justify-center px-4">
                      <a href={mailtoHref}>Envoyer par email</a>
                    </Button>
                    <Button type="button" size="sm" onClick={handleSend} disabled={!draft.trim()} className="h-10 justify-center px-4">
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Envoyer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
