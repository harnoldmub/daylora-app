import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Gift, Sparkles, Trophy, Crown, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import logoRA from "@assets/logo-ra.png";
import type { Contribution } from "@shared/schema";

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-yellow-500/20 border-2 border-yellow-400/40 backdrop-blur-sm">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent"
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
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-xs text-yellow-300/80 font-light tracking-widest uppercase">
              Message du moment
            </span>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>

          <motion.p
            className={`text-center text-lg md:text-xl font-medium text-yellow-50 leading-relaxed transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
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
  const [showPopup, setShowPopup] = useState(false);
  const [newContribution, setNewContribution] = useState<Contribution | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const lastContributionId = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: liveData } = useQuery<LiveData>({
    queryKey: ["/api/contributions/live"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    const generateQR = async () => {
      const url = "https://ar2k26.com/cagnotte";
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 280,
          margin: 2,
          color: {
            dark: "#1a1a2e",
            light: "#ffffff",
          },
        });
        setQrCodeUrl(dataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };
    generateQR();
  }, []);

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

  return (
    <div className="h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] text-white relative overflow-hidden">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300/20 rounded-full animate-pulse"
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
          <div className="w-72 border-r border-yellow-400/20 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-6 h-6 text-yellow-400" />
                <h3 className="text-sm text-yellow-300/80 font-light tracking-widest uppercase">
                  Scannez pour contribuer
                </h3>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg shadow-yellow-400/20 inline-block">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Cagnotte"
                  className="w-48 h-48"
                  data-testid="img-qr-code"
                />
              </div>
              <p className="text-yellow-100/60 text-sm mt-4 font-light">
                ar2k26.com/cagnotte
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <img
              src={logoRA}
              alt="Les Mariés"
              className="w-24 h-24 mx-auto mb-4 opacity-90"
            />
            <h1 className="text-3xl md:text-4xl font-serif text-yellow-300 mb-1">
              Les Mariés
            </h1>
            <p className="text-lg text-yellow-100/70 font-light tracking-widest">
              CAGNOTTE EN DIRECT
            </p>
          </div>

          <FunMessageBanner
            latestContribution={liveData?.latest || null}
            showDynamic={recent.length > 0}
          />

          {top5.length > 0 && (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-lg text-yellow-300/80 font-light tracking-widest">
                  NOS GÉNÉREUX DONATEURS
                </h2>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="space-y-2">
                {top5.map((contribution, idx) => (
                  <motion.div
                    key={`top-${contribution.id}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative flex items-center justify-between backdrop-blur-sm border rounded-xl px-4 py-3 overflow-hidden ${idx < 3
                      ? 'bg-gradient-to-r from-yellow-500/10 via-yellow-400/5 to-yellow-500/10 border-yellow-400/40'
                      : 'bg-white/5 border-yellow-400/20'
                      }`}
                  >
                    {idx < 3 && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent"
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-lg shadow-yellow-400/50' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-lg shadow-gray-300/50' :
                            idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100 shadow-lg shadow-amber-500/50' :
                              'bg-white/10 text-yellow-100/60'
                          }`}
                        animate={idx < 3 ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                      >
                        {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-medium ${idx < 3 ? 'text-yellow-100' : 'text-white'}`} data-testid={`text-top-donor-${idx}`}>
                          {contribution.donorName}
                        </p>
                        {contribution.message && (
                          <p className="text-xs text-yellow-100/50 truncate italic">
                            "{contribution.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <Heart className={`w-5 h-5 relative z-10 flex-shrink-0 ${idx < 3 ? 'text-yellow-300' : 'text-yellow-400'}`} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {scrollingList.length > 0 && (
          <div className="w-80 border-l border-yellow-400/20 bg-black/20 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-yellow-400/20 text-center">
              <h2 className="text-sm text-yellow-300/80 font-light tracking-widest uppercase">
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
                      className="flex items-center gap-3 px-4 py-3 border-b border-yellow-400/10"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400/80 to-yellow-600/80 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {contribution.donorName}
                        </p>
                        {contribution.message && (
                          <p className="text-xs text-yellow-100/50 truncate italic">
                            "{contribution.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#16213e] to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#16213e] to-transparent pointer-events-none z-10" />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative"
            >
              <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-yellow-400 rounded-full blur-3xl opacity-50 animate-pulse" />

              <div className="relative bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] border-4 border-yellow-400 rounded-3xl p-12 md:p-16 text-center max-w-lg mx-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-6 -right-6"
                >
                  <Sparkles className="w-12 h-12 text-yellow-400" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-6 -left-6"
                >
                  <Sparkles className="w-12 h-12 text-yellow-400" />
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center"
                >
                  <Heart className="w-12 h-12 text-white" fill="white" />
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-light text-yellow-100 mb-2">
                  Merci
                </h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-6"
                  data-testid="popup-donor-name"
                >
                  {newContribution.donorName}
                </motion.p>

                {newContribution.message ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl md:text-3xl text-yellow-100/90 italic max-w-md"
                  >
                    "{newContribution.message}"
                  </motion.p>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-yellow-400"
                  >
                    <Heart className="w-8 h-8" fill="currentColor" />
                    <span className="text-2xl font-light">Merci pour votre générosité</span>
                    <Heart className="w-8 h-8" fill="currentColor" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-4 text-yellow-100/30 text-xs">
        Rafraîchissement automatique toutes les 5 secondes
      </div>
    </div>
  );
}
