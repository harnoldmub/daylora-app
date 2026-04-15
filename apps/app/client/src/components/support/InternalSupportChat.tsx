import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, Sparkles, User2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type QuickAction = {
  key: string;
  label: string;
};

type SupportMessage = {
  id: number;
  role: "user" | "admin" | "bot";
  senderType?: "user" | "admin" | "bot" | null;
  content: string;
  pageLabel?: string | null;
  currentUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
  metadata?: {
    quickActions?: QuickAction[];
    topic?: string;
    escalated?: boolean;
  } | null;
};

type SupportConversationResponse = {
  conversation: {
    id: number;
    userId: string;
    weddingId?: string | null;
    lastMessageAt?: string | null;
    status: "open" | "pending" | "answered" | "closed";
    sourcePage?: string | null;
    sourcePlan?: string | null;
  };
  wedding?: {
    id: string;
    slug: string;
    title: string;
  } | null;
  quickActions?: QuickAction[];
  messages: SupportMessage[];
};

type InternalSupportChatProps = {
  pageLabel?: string;
  weddingId?: string | null;
  weddingSlug?: string | null;
  weddingName?: string | null;
  userEmail?: string | null;
  currentPlan?: string | null;
  className?: string;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function senderTypeOf(message: SupportMessage) {
  return message.senderType || message.role;
}

export function InternalSupportChat({
  pageLabel,
  weddingId,
  weddingSlug,
  weddingName,
  userEmail,
  currentPlan,
  className,
}: InternalSupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<SupportConversationResponse | null>(null);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const requestContext = useMemo(() => {
    const params = new URLSearchParams();
    if (weddingId) params.set("weddingId", weddingId);
    if (weddingSlug && !weddingId) params.set("slug", weddingSlug);
    return {
      query: params.toString() ? `?${params.toString()}` : "",
      headers: {
        ...(weddingId ? { "x-wedding-id": weddingId } : {}),
        ...(!weddingId && weddingSlug ? { "x-wedding-slug": weddingSlug } : {}),
      },
    };
  }, [weddingId, weddingSlug]);

  const fetchConversation = async (withLoader = false) => {
    if (withLoader) setLoading(true);
    try {
      const res = await fetch(`/api/support/conversation${requestContext.query}`, {
        credentials: "include",
        headers: requestContext.headers,
      });
      if (!res.ok) throw new Error("Impossible de charger la conversation");
      const data = await res.json();
      setConversation(data);
    } finally {
      if (withLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation(false).catch(() => {});
  }, [requestContext]);

  useEffect(() => {
    const es = new EventSource("/api/support/stream");
    const refresh = () => {
      fetchConversation(false).catch(() => {});
    };
    es.addEventListener("support.message", refresh);
    es.addEventListener("support.read", refresh);
    es.addEventListener("support.conversation", refresh);
    es.onerror = () => {
      es.close();
    };
    return () => {
      es.removeEventListener("support.message", refresh);
      es.removeEventListener("support.read", refresh);
      es.removeEventListener("support.conversation", refresh);
      es.close();
    };
  }, [requestContext]);

  useEffect(() => {
    if (!isOpen) return;
    fetchConversation(true).catch(() => {});
  }, [isOpen, requestContext]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [conversation?.messages.length, isOpen]);

  const unreadAdminCount = useMemo(
    () => conversation?.messages.filter((message) => senderTypeOf(message) === "admin" && !message.readAt).length || 0,
    [conversation],
  );

  const quickActions = useMemo(() => {
    const latestBotWithActions = [...(conversation?.messages || [])]
      .reverse()
      .find((message) => senderTypeOf(message) === "bot" && message.metadata?.quickActions?.length);
    return latestBotWithActions?.metadata?.quickActions || conversation?.quickActions || [];
  }, [conversation]);

  const sendMessage = async (content: string, actionKey?: string) => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await apiRequest("POST", "/api/support/messages", {
        content: trimmed,
        actionKey: actionKey || null,
        pageLabel: pageLabel || window.location.pathname,
        currentUrl: typeof window !== "undefined" ? window.location.href : "",
        weddingId: weddingId || null,
      });
      setDraft("");
      await fetchConversation(false);
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendMessage(draft);
  };

  const statusLabel =
    conversation?.conversation.status === "open" ? "Transmise à l'équipe" :
    conversation?.conversation.status === "answered" ? "Réponse envoyée" :
    conversation?.conversation.status === "closed" ? "Conversation fermée" :
    "Assistant disponible";

  return (
    <>
      <div className={cn("fixed bottom-4 right-16 z-40 md:bottom-4", className)}>
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Assistance"
          aria-label="Ouvrir l’assistance"
          className="relative h-11 rounded-full bg-[#1f1f1f] px-3 text-white shadow-lg hover:bg-black md:h-10 md:w-10 md:px-0"
        >
          <MessageSquare className="h-4 w-4 md:h-4 md:w-4" />
          <span className="ml-2 md:hidden">Assistance</span>
          {unreadAdminCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#d84b41] px-1.5 text-[10px] font-semibold text-white">
              {unreadAdminCount}
            </span>
          ) : null}
        </Button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-0 right-0 flex h-[88vh] w-full flex-col rounded-t-3xl border border-[#eadfce] bg-white shadow-2xl md:bottom-6 md:right-6 md:h-[720px] md:max-h-[calc(100vh-48px)] md:w-[410px] md:rounded-3xl">
            <div className="border-b border-[#efe7d9] bg-[#fcfaf6] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f1f1f] text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Besoin d’aide ?</h3>
                      <p className="text-xs text-slate-500">{statusLabel}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Nous répondons généralement rapidement.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {weddingName || weddingSlug ? `${weddingName || weddingSlug}` : "Support Daylora"}
                    {userEmail ? ` · ${userEmail}` : ""}
                    {currentPlan ? ` · Plan ${currentPlan}` : ""}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 bg-[#fcfaf6]">
              <div className="space-y-3 px-4 py-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : null}

                {conversation?.messages.map((message) => {
                  const senderType = senderTypeOf(message);
                  const isUser = senderType === "user";
                  const isBot = senderType === "bot";

                  return (
                    <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[88%]", isUser ? "items-end" : "items-start")}>
                        {!isUser ? (
                          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                            {isBot ? <Bot className="h-3.5 w-3.5" /> : <User2 className="h-3.5 w-3.5" />}
                            <span>{isBot ? "Assistant Daylora" : "Équipe Daylora"}</span>
                          </div>
                        ) : null}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 shadow-sm",
                            isUser
                              ? "rounded-br-md bg-[#c8a96a] text-white"
                              : isBot
                                ? "rounded-tl-md border border-[#eadfce] bg-white text-slate-800"
                                : "rounded-tl-md bg-[#1f1f1f] text-white",
                          )}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                          <div
                            className={cn(
                              "mt-2 flex items-center gap-2 text-[11px]",
                              isUser ? "text-white/80" : isBot ? "text-slate-400" : "text-white/75",
                            )}
                          >
                            <span>{formatTime(message.createdAt)}</span>
                            {isUser ? <span>{message.readAt ? "Lu" : "Envoyé"}</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {quickActions.length > 0 ? (
              <div className="border-t border-[#efe7d9] bg-white px-4 py-3">
                <div className="mb-2 text-xs font-medium text-slate-500">Actions rapides</div>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => sendMessage(action.label, action.key)}
                      className="rounded-full border border-[#e5d8c1] bg-[#fcfaf6] px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#c8a96a] hover:text-slate-900"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-t border-[#efe7d9] bg-white px-4 py-4">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Écrivez votre message..."
                className="min-h-[88px] resize-none rounded-2xl border-[#e8dfd1] bg-[#fcfaf6]"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Page: {pageLabel || window.location.pathname}
                </p>
                <Button type="button" onClick={() => sendMessage(draft)} disabled={!draft.trim() || sending}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
