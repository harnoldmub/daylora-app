import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Gift, Sparkles, Trophy, Crown, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import type { Contribution } from "@shared/schema";
import { useParams, Link } from "wouter";
import { useWedding } from "@/hooks/use-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LIVE_TEMPLATE_THEME = {
  classic: {
    pageClass: "bg-background",
    donorTitleClass: "text-foreground",
  },
  modern: {
    pageClass: "bg-background",
    donorTitleClass: "text-foreground",
  },
  minimal: {
    pageClass: "bg-background",
    donorTitleClass: "text-foreground",
  },
} as const;

interface LiveData {
  total: number;
  currency: string;
  latest: Contribution | null;
  recent: Contribution[];
}

// Fun messages library
const funMessages = {
  generic: [
    "💸 Chaque euro nous rapproche un peu plus de la lune de miel 🌴",
    "🍕 Promis, cet argent ne servira pas que pour les pizzas.",
    "🛋️ Merci de soutenir l'amour… et notre futur canapé.",
    "😉 Ce don augmente vos chances d'être invité à l'anniversaire de mariage 😉",
    "💕 L'amour, c'est beau. L'amour + une cagnotte, c'est encore mieux.",
    "🚀 Un petit geste pour vous, un grand pas pour notre voyage.",
    "🌙 Spoiler : on pensera à vous pendant la lune de miel 💕",
    "🎯 Ce bouton n'a jamais fait autant plaisir à deux personnes.",
    "🏖️ Ce don finance notre futur débat : plage ou montagne ?",
    "🍝 Grâce à vous, on pourra manger autre chose que des pâtes 🍝",
    "💰 Oui, ceci est un investissement émotionnel.",
    "✈️ L'amour ne s'achète pas… mais le voyage de noces, si.",
    "😅 Merci, ce don nous évite de vendre un rein.",
  ],
  romantic: [
    "💍 Merci de faire partie de notre histoire",
    "✨ Un petit geste qui restera longtemps dans nos souvenirs.",
    "❤️ Votre contribution compte plus que vous ne l'imaginez ❤️",
    "💎 Entourés de vous, on se sent déjà riches.",
    "🌟 Merci d'ajouter un peu plus de magie à ce jour.",
  ],
  complicity: [
    "😉 Si tu lis ça, c'est que tu comptes beaucoup pour nous 😉",
    "👋 On espère te voir très vite… et pas seulement sur cette page !",
    "🙏 Merci de soutenir ce grand jour à ta façon.",
    "🥂 On promet de trinquer à ta santé 🥂",
    "💝 Ce mariage ne serait pas pareil sans toi.",
  ],
  liveEvent: [
    "🚨 Attention : montée d'amour détectée.",
    "🎊 Nouveau soutien en cours…",
    "💕 L'ambiance monte, la cagnotte aussi !",
    "⏳ Le voyage se rapproche à vue d'œil.",
    "📈 L'amour est officiellement en croissance.",
  ],
};

// Dynamic message templates
const dynamicMessageTemplates = [
  "💸 {name} vient d'ajouter {amount} : officiellement invité à la photo de groupe.",
  "🎉 {name} participe ! Le voyage se rapproche…",
  "{name} prouve que l'amour se mesure aussi en euros 😄",
  "Merci {name} ! Une valise de plus est presque bouclée 🧳",
  "{amount} de plus… et toujours autant d'amour 💖",
];

function FunMessageBanner({
  latestContribution,
  showDynamic
}: {
  latestContribution: Contribution | null;
  showDynamic: boolean;
}) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const lastMessageRef = useRef("");

  useEffect(() => {
    const getRandomMessage = () => {
      let message = "";

      if (showDynamic && latestContribution) {
        // Show dynamic message with real contribution data
        const template = dynamicMessageTemplates[Math.floor(Math.random() * dynamicMessageTemplates.length)];
        message = template
          .replace("{name}", latestContribution.donorName || "Un invité")
          .replace("{amount}", formatAmount(latestContribution.amount));
      } else {
        // Show random generic/romantic/complicity/live message
        const allMessages = [
          ...funMessages.generic,
          ...funMessages.romantic,
          ...funMessages.complicity,
          ...funMessages.liveEvent,
        ];

        // Avoid repeating the same message
        let attempts = 0;
        do {
          message = allMessages[Math.floor(Math.random() * allMessages.length)];
          attempts++;
        } while (message === lastMessageRef.current && attempts < 10);
      }

      lastMessageRef.current = message;
      return message;
    };

    const updateMessage = () => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage(getRandomMessage());
        setIsVisible(true);
      }, 500);
    };

    // Initial message
    setCurrentMessage(getRandomMessage());

    // Change message every 7 seconds
    const interval = setInterval(updateMessage, 7000);

    return () => clearInterval(interval);
  }, [latestContribution, showDynamic]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mb-8"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-background/70 to-primary/10 border border-primary/20 backdrop-blur-sm shadow-sm">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ width: '50%' }}
        />

        <div className="relative z-10 px-6 py-5">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs text-muted-foreground font-light tracking-widest uppercase">
              Message du moment
            </span>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>

          <motion.p
            className={`text-center text-lg md:text-xl font-medium text-foreground leading-relaxed transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
          >
            {currentMessage}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function LiveContributions() {
  const { slug } = useParams<{ slug: string }>();
  const { data: wedding } = useWedding(slug);
  const isPreview = typeof window !== "undefined" ? window.location.pathname.startsWith("/preview/") : false;
  const basePath = slug ? (isPreview ? `/preview/${slug}` : `/${slug}`) : "";
  const [showPopup, setShowPopup] = useState(false);
  const [newContribution, setNewContribution] = useState<Contribution | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const lastContributionId = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: liveData } = useQuery<LiveData>({
    queryKey: ["/api/contributions/live", slug],
    queryFn: async () => {
      const url = slug
        ? `/api/contributions/live?slug=${encodeURIComponent(slug)}`
        : "/api/contributions/live";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Impossible de charger les contributions live");
      return response.json();
    },
    enabled: !!slug,
    refetchInterval: 5000,
  });

  const liveEnabled =
    (wedding?.config?.navigation?.pages?.live ?? true) &&
    (wedding?.config?.features?.liveEnabled ?? true);

  const displayTitle = wedding?.config?.texts?.siteTitle || wedding?.title || "Notre Mariage";
  const displayLogoUrl = wedding?.config?.branding?.logoUrl || "";
  const displayLogoText = wedding?.config?.branding?.logoText || displayTitle;
  const liveTitle = wedding?.config?.texts?.liveTitle || "CAGNOTTE EN DIRECT";
  const liveSubtitle = wedding?.config?.texts?.liveSubtitle || "Merci pour votre générosité";
  const liveDonorsTitle = wedding?.config?.texts?.liveDonorsTitle || "NOS GÉNÉREUX DONATEURS";
  const liveQrCaption = wedding?.config?.texts?.liveQrCaption || "Scannez pour contribuer";
  const templateId = (wedding?.templateId as keyof typeof LIVE_TEMPLATE_THEME) || "classic";
  const liveTheme = LIVE_TEMPLATE_THEME[templateId] || LIVE_TEMPLATE_THEME.classic;
  const publicCagnotteUrl = slug
    ? `${window.location.origin}/${slug}/cagnotte`
    : `${window.location.origin}/cagnotte`;

  useEffect(() => {
    const generateQR = async () => {
      try {
        const primaryHex = wedding?.config?.theme?.primaryColor || "#1a1a2e";
        const dataUrl = await QRCode.toDataURL(publicCagnotteUrl, {
          width: 280,
          margin: 2,
          color: {
            dark: primaryHex,
            light: "#ffffff",
          },
        });
        setQrCodeUrl(dataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };
    generateQR();
  }, [publicCagnotteUrl, wedding?.config?.theme?.primaryColor]);

  useEffect(() => {
    if (liveData?.latest && liveData.latest.id !== lastContributionId.current) {
      if (lastContributionId.current !== null) {
        setNewContribution(liveData.latest);
        setShowPopup(true);

        // Play sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => { });
        }

        // Trigger confetti for contributions >= 100€
        if (liveData.latest.amount >= 10000) {
          const duration = 3000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

          const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
          };

          const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
          }, 250);
        }

        setTimeout(() => {
          setShowPopup(false);
        }, 8000);
      }
      lastContributionId.current = liveData.latest.id;
    }
  }, [liveData?.latest]);

  const total = liveData?.total || 0;
  const recent = liveData?.recent || [];

  const top5 = useMemo(() => {
    return [...recent].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [recent]);

  const scrollingList = useMemo(() => {
    const list = [...recent];
    while (list.length > 0 && list.length < 10) {
      list.push(...recent);
    }
    return list;
  }, [recent]);

  if (!liveEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="p-8 max-w-lg text-center">
          <h2 className="text-2xl font-serif font-bold mb-3">Live indisponible</h2>
          <p className="text-muted-foreground mb-6">Cette page a ete desactivee dans la configuration du site.</p>
          <Link href={basePath || "/"}>
            <Button>Retour au site</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-screen ${liveTheme.pageClass} text-foreground relative overflow-hidden`}>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex">
        {qrCodeUrl && (
          <div className="w-72 border-r border-border bg-white/75 backdrop-blur-sm flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-6 h-6 text-primary" />
                <h3 className="text-sm text-muted-foreground font-light tracking-widest uppercase">
                  {liveQrCaption}
                </h3>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg shadow-black/5 inline-block">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Cagnotte"
                  className="w-48 h-48"
                  data-testid="img-qr-code"
                />
              </div>
              <a
                href={publicCagnotteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-muted-foreground text-sm mt-4 font-light underline underline-offset-4 hover:text-primary transition-colors"
              >
                {publicCagnotteUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            {displayLogoUrl ? (
              <img
                src={displayLogoUrl}
                alt={displayLogoText}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
            ) : (
              <div className="w-24 h-24 mx-auto mb-4 rounded-full border border-primary/20 bg-white/70 flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {(displayLogoText || "LB")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-1">
              {displayTitle}
            </h1>
            <p className="text-lg text-muted-foreground font-light tracking-widest">
              {liveTitle}
            </p>
            <p className="text-sm text-muted-foreground mt-2">{liveSubtitle}</p>
          </div>

          <FunMessageBanner
            latestContribution={liveData?.latest || null}
            showDynamic={recent.length > 0}
          />

          {top5.length > 0 && (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-primary" />
                <h2 className={`text-lg font-light tracking-widest ${liveTheme.donorTitleClass}`}>
                  {liveDonorsTitle}
                </h2>
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                {top5.map((contribution, idx) => (
                  <motion.div
                    key={`top-${contribution.id}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative flex items-center justify-between backdrop-blur-sm border rounded-xl px-4 py-3 overflow-hidden ${
                      idx < 3 ? "bg-white/80 border-primary/20" : "bg-white/70 border-border"
                    }`}
                  >
                    {idx < 3 && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/12 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1 + idx * 0.5,
                          ease: "easeInOut",
                        }}
                        style={{ width: '50%' }}
                      />
                    )}
                    <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0">
                      <motion.div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          idx === 0
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : idx === 1
                              ? "bg-muted text-foreground"
                              : idx === 2
                                ? "bg-primary/15 text-primary"
                                : "bg-muted/60 text-muted-foreground"
                        }`}
                        animate={idx < 3 ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                      >
                        {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-medium ${idx < 3 ? "text-foreground" : "text-foreground"}`} data-testid={`text-top-donor-${idx}`}>
                          {contribution.donorName}
                        </p>
                        {contribution.message && (
                          <p className="text-xs text-muted-foreground truncate italic">
                            "{contribution.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <Heart className="w-5 h-5 relative z-10 flex-shrink-0 text-primary" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {scrollingList.length > 0 && (
          <div className="w-80 border-l border-border bg-white/75 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-border text-center">
              <h2 className="text-sm text-muted-foreground font-light tracking-widest uppercase">
                Tous les donateurs
              </h2>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0">
                <motion.div
                  className="flex flex-col"
                  animate={{
                    y: [0, -50 * scrollingList.length],
                  }}
                  transition={{
                    duration: scrollingList.length * 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {[...scrollingList, ...scrollingList].map((contribution, idx) => (
                    <div
                      key={`scroll-${contribution.id}-${idx}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border/60"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {contribution.donorName}
                        </p>
                        {contribution.message && (
                          <p className="text-xs text-muted-foreground truncate italic">
                            "{contribution.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/95 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/95 to-transparent pointer-events-none z-10" />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPopup && newContribution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative"
            >
              <div className="absolute -inset-10 bg-gradient-to-r from-primary/25 via-primary/10 to-primary/25 rounded-full blur-3xl opacity-70 animate-pulse" />

              <div className="relative bg-white border border-primary/25 rounded-3xl p-12 md:p-16 text-center max-w-lg mx-4 shadow-[0_30px_80px_rgba(0,0,0,0.20)]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-6 -right-6"
                >
                  <Sparkles className="w-12 h-12 text-primary" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-6 -left-6"
                >
                  <Sparkles className="w-12 h-12 text-primary" />
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                >
                  <Heart className="w-12 h-12 text-primary" fill="currentColor" />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-light text-muted-foreground mb-2">
                  Merci
                </h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/70 to-primary mb-6"
                  data-testid="popup-donor-name"
                >
                  {newContribution.donorName}
                </motion.p>

                {newContribution.message ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl md:text-2xl text-foreground/90 italic max-w-md"
                  >
                    "{newContribution.message}"
                  </motion.p>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-primary"
                  >
                    <Heart className="w-8 h-8" fill="currentColor" />
                    <span className="text-xl md:text-2xl font-light">Merci pour votre générosité</span>
                    <Heart className="w-8 h-8" fill="currentColor" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-4 text-muted-foreground/70 text-xs">
        Rafraîchissement automatique toutes les 5 secondes
      </div>
    </div>
  );
}
