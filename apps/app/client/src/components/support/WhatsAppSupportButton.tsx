import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type WhatsAppSupportButtonProps = {
  pageLabel?: string;
  weddingName?: string | null;
  weddingSlug?: string | null;
  userEmail?: string | null;
  className?: string;
  showHint?: boolean;
};

function sanitizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function resolveCurrentPageLabel(fallback?: string) {
  if (fallback) return fallback;
  if (typeof window === "undefined") return "Page inconnue";
  return window.location.pathname;
}

function resolveCurrentPageUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export function WhatsAppSupportButton({
  pageLabel,
  weddingName,
  weddingSlug,
  userEmail,
  className,
  showHint = false,
}: WhatsAppSupportButtonProps) {
  const [runtimeNumber, setRuntimeNumber] = useState("");
  const rawNumber = (import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || runtimeNumber || "").trim();
  const supportNumber = sanitizeWhatsAppNumber(rawNumber);

  useEffect(() => {
    if (import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER) return;
    let cancelled = false;
    fetch("/api/site-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((config) => {
        if (cancelled) return;
        setRuntimeNumber(String(config?.whatsappSupportNumber || "").trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!supportNumber) return null;

  const currentPage = resolveCurrentPageLabel(pageLabel);
  const currentPageUrl = resolveCurrentPageUrl();
  const eventLabel = weddingSlug || weddingName || "";
  const emailLabel = userEmail || "";

  const message = [
    "Bonjour, je suis sur Daylora et j'ai besoin d'aide.",
    `Page : ${currentPage}`,
    currentPageUrl ? `URL : ${currentPageUrl}` : null,
    eventLabel ? `Événement : ${eventLabel}` : null,
    emailLabel ? `Email : ${emailLabel}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const href = `https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className={cn("fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2", className)}>
      {showHint ? (
        <div className="hidden max-w-[260px] rounded-2xl border border-[#eadfce] bg-white/96 px-4 py-3 text-right shadow-lg backdrop-blur md:block">
          <p className="text-sm font-medium text-slate-900">
            Besoin d'aide pour finaliser votre événement ?
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Nous sommes disponibles sur WhatsApp.
          </p>
        </div>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-full border border-[#25d366]/20 bg-white/95 px-3 py-3 text-slate-700 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#25d366]/40 hover:text-[#128c48]"
        aria-label="Contacter le support sur WhatsApp"
      >
        <MessageCircle className="h-5 w-5 text-[#25d366]" />
        <span className="hidden text-sm font-medium sm:inline">Besoin d'aide ?</span>
      </a>
    </div>
  );
}
