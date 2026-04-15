import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCheck, Loader2, MessageSquare, Send, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

type ConversationStatus = "open" | "pending" | "answered" | "closed";

type ConversationSummary = {
  id: number;
  name: string;
  email: string;
  weddingSlug?: string | null;
  weddingTitle?: string | null;
  unreadCount: number;
  isUnread: boolean;
  status: ConversationStatus;
  sourcePage?: string | null;
  sourcePlan?: string | null;
  lastMessage?: {
    id: number;
    senderType?: "user" | "admin" | "bot" | null;
    role?: "user" | "admin" | "bot";
    content: string;
    createdAt: string;
  } | null;
  lastMessageAt?: string | null;
};

type ConversationDetail = {
  conversation: {
    id: number;
    userId: string;
    weddingId?: string | null;
    status: ConversationStatus;
    sourcePage?: string | null;
    sourcePlan?: string | null;
  };
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  wedding?: {
    id: string;
    slug: string;
    title: string;
  } | null;
  quickActions?: Array<{ key: string; label: string }>;
  messages: Array<{
    id: number;
    role: "user" | "admin" | "bot";
    senderType?: "user" | "admin" | "bot" | null;
    content: string;
    pageLabel?: string | null;
    currentUrl?: string | null;
    readAt?: string | null;
    createdAt: string;
    metadata?: {
      topic?: string;
      escalated?: boolean;
    } | null;
  }>;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function labelForStatus(status: ConversationStatus) {
  switch (status) {
    case "open":
      return "Ouvert";
    case "pending":
      return "En attente";
    case "answered":
      return "Répondu";
    case "closed":
      return "Fermé";
    default:
      return status;
  }
}

function classForStatus(status: ConversationStatus) {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "answered":
      return "bg-emerald-100 text-emerald-700";
    case "closed":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function senderTypeOf(message: { senderType?: "user" | "admin" | "bot" | null; role?: "user" | "admin" | "bot" }) {
  return message.senderType || message.role;
}

export default function SuperAdminConversations() {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<ConversationStatus | "all">("all");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadList = async (preserveSelection = true) => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/super-admin/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Impossible de charger les conversations");
      const nextItems = await res.json();
      setItems(nextItems);
      if (!preserveSelection) return;
      if (selectedId) {
        const exists = nextItems.some((item: ConversationSummary) => item.id === selectedId);
        if (!exists) setSelectedId(nextItems[0]?.id ?? null);
      } else if (nextItems[0]?.id) {
        setSelectedId(nextItems[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  };

  const loadDetail = async (conversationId: number) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/super-admin/conversations/${conversationId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Impossible de charger la conversation");
      const nextDetail = await res.json();
      setDetail(nextDetail);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadList().catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    loadDetail(selectedId).catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    const es = new EventSource("/api/super-admin/conversations/stream");
    const refresh = () => {
      loadList().catch(() => {});
      if (selectedId) loadDetail(selectedId).catch(() => {});
    };
    es.addEventListener("support.message", refresh);
    es.addEventListener("support.read", refresh);
    es.addEventListener("support.conversation", refresh);
    es.onerror = () => es.close();
    return () => {
      es.removeEventListener("support.message", refresh);
      es.removeEventListener("support.read", refresh);
      es.removeEventListener("support.conversation", refresh);
      es.close();
    };
  }, [selectedId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId, detail?.messages.length]);

  const filteredItems = useMemo(
    () => items.filter((item) => filter === "all" || item.status === filter),
    [items, filter],
  );

  const selectedSummary = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  const sendReply = async () => {
    const content = draft.trim();
    if (!selectedId || !content || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/super-admin/conversations/${selectedId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          pageLabel: "Super Admin Conversations",
          currentUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (!res.ok) throw new Error("Impossible d'envoyer la réponse");
      setDraft("");
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } finally {
      setSending(false);
    }
  };

  const handleReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendReply();
  };

  const updateStatus = async (status: ConversationStatus) => {
    if (!selectedId) return;
    await fetch(`/api/super-admin/conversations/${selectedId}/status`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await Promise.all([loadList(), loadDetail(selectedId)]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conversations</h1>
        <p className="mt-2 text-sm text-slate-500">
          Le chatbot répond d’abord, puis l’équipe Daylora peut reprendre la conversation quand nécessaire.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <MessageSquare className="h-4 w-4 text-red-600" />
              Conversations utilisateurs
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "open", "pending", "answered", "closed"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filter === status ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status === "all" ? "Toutes" : labelForStatus(status)}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="h-[700px]">
            <div className="p-3">
              {loadingList ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : null}

              {!loadingList && filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  Aucune conversation pour ce filtre.
                </div>
              ) : null}

              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const isActive = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-red-200 bg-red-50/70"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{item.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${classForStatus(item.status)}`}>
                            {labelForStatus(item.status)}
                          </span>
                          {item.isUnread ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                              {item.unreadCount} non lu
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 truncate text-xs text-slate-500">
                        {item.weddingSlug ? `${item.weddingSlug} · ` : ""}
                        {item.lastMessage?.content || "Nouvelle conversation"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>{item.sourcePage || "Page non remontée"}</span>
                        <span>{formatTime(item.lastMessageAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            {selectedSummary && detail ? (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{selectedSummary.name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${classForStatus(detail.conversation.status)}`}>
                      {labelForStatus(detail.conversation.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSummary.email}
                    {selectedSummary.weddingSlug ? ` · ${selectedSummary.weddingSlug}` : ""}
                    {detail.conversation.sourcePlan ? ` · Plan ${detail.conversation.sourcePlan}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Page source: {detail.conversation.sourcePage || "Non précisée"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => selectedId && fetch(`/api/super-admin/conversations/${selectedId}/read`, { method: "POST", credentials: "include" }).then(() => Promise.all([loadList(), loadDetail(selectedId)]))}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Marquer comme lu
                  </Button>
                  <Button type="button" variant="outline" onClick={() => updateStatus("answered")}>
                    Marquer traité
                  </Button>
                  <Button type="button" variant="outline" onClick={() => updateStatus(detail.conversation.status === "closed" ? "open" : "closed")}>
                    {detail.conversation.status === "closed" ? "Réouvrir" : "Fermer"}
                  </Button>
                </div>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-slate-900">Sélectionnez une conversation</h2>
            )}
          </div>

          <div className="flex h-[700px] flex-col">
            <ScrollArea className="flex-1 bg-slate-50/60">
              <div className="space-y-4 px-5 py-5">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : null}

                {!loadingDetail && selectedId && detail?.messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    Aucun message pour le moment.
                  </div>
                ) : null}

                {detail?.messages.map((message) => {
                  const senderType = senderTypeOf(message);
                  const isAdmin = senderType === "admin";
                  const isBot = senderType === "bot";

                  return (
                    <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[82%]">
                        {!isAdmin ? (
                          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                            {isBot ? <Bot className="h-3.5 w-3.5" /> : <User2 className="h-3.5 w-3.5" />}
                            <span>{isBot ? "Assistant Daylora" : "Utilisateur"}</span>
                          </div>
                        ) : null}
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            isAdmin
                              ? "rounded-br-md bg-red-600 text-white"
                              : isBot
                                ? "rounded-tl-md border border-[#eadfce] bg-white text-slate-800"
                                : "rounded-tl-md bg-white text-slate-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                          {!isAdmin && (message.pageLabel || message.currentUrl || message.metadata?.topic) ? (
                            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                              {message.pageLabel ? <p>Page: {message.pageLabel}</p> : null}
                              {message.currentUrl ? <p className="truncate">URL: {message.currentUrl}</p> : null}
                              {message.metadata?.topic ? <p>Topic: {message.metadata.topic}</p> : null}
                            </div>
                          ) : null}
                          <p className={`mt-2 text-[11px] ${isAdmin ? "text-white/80" : "text-slate-400"}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-slate-200 bg-white px-5 py-4">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleReplyKeyDown}
                placeholder="Écrire une réponse..."
                className="min-h-[96px] resize-none rounded-2xl"
                disabled={!selectedId}
              />
              <div className="mt-3 flex justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {detail?.conversation.status === "open"
                    ? "Cette conversation attend une reprise humaine."
                    : "Vous pouvez répondre directement depuis Daylora."}
                </div>
                <Button type="button" onClick={sendReply} disabled={!selectedId || !draft.trim() || sending}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Répondre
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
