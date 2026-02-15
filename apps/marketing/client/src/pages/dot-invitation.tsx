import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Calendar, Heart, Users, Clock, Gift } from "lucide-react";
import logoRA from "@/assets/logo-ra.png";

interface GuestData {
  id: number;
  firstName: string;
  lastName: string;
  availability: string;
  partySize: number;
  pdfUrl: string | null;
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-2 justify-center items-center">
      {[
        { value: timeLeft.days, label: "J" },
        { value: timeLeft.hours, label: "H" },
        { value: timeLeft.minutes, label: "M" },
        { value: timeLeft.seconds, label: "S" },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <span className="text-lg font-bold text-amber-400">
              {item.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] text-amber-200/50 mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GuestInvitationPage() {
  const { guestId } = useParams<{ guestId: string }>();

  const { data: guest, isLoading, error } = useQuery<GuestData>({
    queryKey: ["/api/invitation/guest", guestId],
    queryFn: async () => {
      const res = await fetch(`/api/invitation/guest/${guestId}`);
      if (!res.ok) throw new Error("Invité non trouvé");
      return res.json();
    },
    enabled: !!guestId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-amber-200 text-lg">Invitation non trouvée</p>
        </div>
      </div>
    );
  }

  const showConfirmed = guest.availability === "confirmed" || guest.availability === "pending";
  const isCouple = guest.partySize >= 2;

  // Determine the countdown target date based on availability
  const getCountdownDate = () => {
    return new Date("2026-03-21T00:00:00");
  };

  const countdownDate = getCountdownDate();
  const countdownLabel = "21 Mars 2026";

  const handleDownloadDot = () => {
    if (guest.pdfUrl) {
      window.open(guest.pdfUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-300/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 2}s infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Gold border effect */}
        <div className="absolute -inset-[2px] bg-gradient-to-b from-amber-400 via-amber-500/50 to-amber-400 rounded-2xl" />

        <div className="relative bg-[#0d0d18] rounded-2xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src={logoRA}
              alt="Les Mariés"
              className="w-24 h-24 mx-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-serif text-amber-400 mb-1">
            Les Mariés
          </h1>
          <p className="text-amber-200/60 text-sm tracking-[0.3em] uppercase mb-8">
            Vos Invitations
          </p>

          {/* Guest info box */}
          <div className="bg-[#151520] rounded-xl p-5 mb-6 border border-amber-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isCouple ? (
                <Users className="w-4 h-4 text-amber-400" />
              ) : (
                <Heart className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-amber-200/70 text-xs uppercase tracking-wider">
                {isCouple ? "Invitation Couple" : "Invitation Personnelle"}
              </span>
            </div>

            <h2 className="text-2xl font-serif text-white">
              {guest.firstName} {guest.lastName}
            </h2>
            <p className="text-amber-200/50 text-sm mt-1">
              {isCouple ? "2 personnes" : "1 personne"}
            </p>
          </div>

          {/* Countdown */}
          <div className="mb-8">
            <p className="text-amber-200/60 text-xs uppercase tracking-widest mb-3">
              <Clock className="w-3 h-3 inline mr-1" />
              Compte à rebours - {countdownLabel}
            </p>
            <Countdown targetDate={countdownDate} />
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            {showConfirmed && (
              <div>
                <p className="text-amber-300/80 text-xs mb-2 uppercase tracking-widest">
                  Soirée du Mariage
                </p>
                {guest.pdfUrl ? (
                  <Button
                    onClick={handleDownloadDot}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold h-14 text-base rounded-xl"
                    data-testid="button-download-confirm"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    Télécharger l'Invitation
                    <Download className="w-4 h-4 ml-3" />
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="w-full bg-gray-800 text-gray-500 font-medium h-14 text-base rounded-xl cursor-not-allowed border border-gray-700"
                    data-testid="button-download-pending"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    21 Mars 2026
                    <span className="ml-3 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                      Bientôt
                    </span>
                  </Button>
                )}
              </div>
            )}


            {!showConfirmed && (
              <div className="text-amber-200/60 text-sm py-4">
                Invitation non disponible ou participation déclinée
              </div>
            )}
          </div>

          {/* Cagnotte section */}
          <div className="mt-8 pt-6 border-t border-amber-500/10">
            <div className="bg-gradient-to-r from-amber-500/5 via-amber-400/10 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-xs uppercase tracking-wider font-medium">
                  Cadeau de Mariage
                </span>
              </div>
              <p className="text-amber-200/70 text-xs mb-3 leading-relaxed">
                Votre présence est notre plus beau cadeau. Si vous souhaitez nous gâter, nous préférons une participation à notre cagnotte.
              </p>
              <a
                href="https://ar2k26.com/cagnotte"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                data-testid="link-cagnotte"
              >
                <Heart className="w-3 h-3" />
                Contribuer à la cagnotte
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-amber-500/10">
            <p className="text-amber-200/40 text-xs">
              Téléchargez vos invitations personnalisées
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
