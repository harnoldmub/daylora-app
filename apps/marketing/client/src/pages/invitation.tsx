import React, { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    Play,
    Pause,
    MapPin,
    Clock,
    Calendar,
    Music,
    Gift,
    Sparkles,
    Download,
    CheckCircle,
    Copy,
    ChevronDown,
    Heart,
    Shirt,
    Hotel,
    Utensils,
    Camera,
    Wine
} from "lucide-react";
import { toPng } from 'html-to-image';
import heroImage from "../assets/hero-couple.jpg";

// --- Types
interface Guest {
    id: number;
    firstName: string;
    lastName: string;
    tableNumber: number;
    partySize: number;
    availability: 'confirmed' | 'declined' | 'pending';
}

// --- Icons / Assets ---
// Using Lucide icons for simplicity and elegance

// --- Main Component ---
export default function Invitation() {
    const [, params] = useRoute("/invitation/:id");
    const id = params?.id;
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Guest Data
    const { data: guest, isLoading, error } = useQuery<Guest>({
        queryKey: ["guest", id],
        queryFn: async () => {
            if (!id) throw new Error("No ID provided");
            const res = await fetch(`/api/guests/${id}`);
            if (!res.ok) throw new Error("Invitation non trouvée");
            return res.json();
        },
        enabled: !!id,
        retry: false
    });

    if (isLoading) return <LoadingScreen />;
    if (error || !guest) return <ErrorScreen message={(error as Error)?.message} />;

    return (
        <div ref={scrollRef} className="bg-black min-h-screen w-full font-serif text-[#D4AF37] overflow-x-hidden selection:bg-[#D4AF37] selection:text-black">

            {/* 1. Envelope / Header Section */}
            <EnvelopeHeader guest={guest} />

            {/* 2. Countdown Section */}
            <CountdownSection />

            {/* 3. Quote & Intro */}
            <QuoteSection />

            {/* Accommodation (Moved here) */}
            <AccommodationSection />

            {/* 4. Photo Section */}
            <PhotoSection />

            {/* 5. Audio & Parents */}
            <AudioParentsSection />

            {/* 6. Event Details (Ceremony/Reception) */}
            {(guest.availability === 'confirmed' || guest.availability === 'pending') && (
                <EventDetailsSection />
            )}

            {/* 7. Timeline */}
            <TimelineSection guest={guest} />

            {/* 8. Info (Dress Code, Gifts, Accommodation) */}
            <InfogridSection />

            {/* 9. QR Pass (Preserved) */}
            <AccessPassSection guest={guest} />

            {/* 10. RSVP / Footer */}
            <FooterSection />

        </div>
    );
}

// --- Sub-Components ---

function EnvelopeHeader({ guest }: { guest: Guest }) {
    return (
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center p-8 bg-[#0a0a0a] overflow-hidden">
            {/* Top "Fold" Decoration */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#111] to-transparent z-0 opacity-50 clip-path-envelope-top" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 text-center space-y-8 max-w-2xl mx-auto border border-[#D4AF37]/20 p-12 py-20 bg-[#050505]/80 backdrop-blur-sm shadow-2xl"
            >
                <div className="space-y-2">
                    <p className="font-sans text-xs tracking-[0.4em] uppercase text-white/60">Wedding Invitation</p>
                    <div className="h-[1px] w-20 bg-[#D4AF37] mx-auto opacity-50 my-4" />
                </div>

                <div className="font-handwriting text-5xl md:text-7xl text-white leading-tight">
                    Les <br />
                    <span className="text-3xl md:text-5xl text-[#D4AF37] font-serif">&</span> <br />
                    Mariés
                </div>

                <div className="space-y-4 pt-4">
                    <p className="text-2xl tracking-widest border-t border-b border-[#D4AF37]/30 py-2 inline-block px-12">
                        21.03.2026
                    </p>
                    <p className="text-sm font-sans tracking-widest uppercase text-white/50">
                        Bruxelles, Belgique
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-10 animate-bounce"
            >
                <ChevronDown className="w-6 h-6 text-[#D4AF37]/50" />
            </motion.div>
        </section>
    );
}

function CountdownSection() {
    // Target Date: March 21, 2026 14:00:00
    const targetDate = new Date("2026-03-21T14:00:00").getTime();
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
    }

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-20 bg-[#000] text-center">
            <div className="border-t border-b border-[#D4AF37]/20 py-12 max-w-4xl mx-auto px-4">
                <p className="text-xs tracking-[0.3em] uppercase mb-8 text-white/40">Le Grand Jour approche</p>

                <div className="grid grid-cols-4 gap-4 md:gap-12">
                    <CountdownItem value={timeLeft.days} label="Jours" />
                    <CountdownItem value={timeLeft.hours} label="Heures" />
                    <CountdownItem value={timeLeft.minutes} label="Min" />
                    <CountdownItem value={timeLeft.seconds} label="Sec" />
                </div>
            </div>
        </section>
    );
}

function CountdownItem({ value, label }: { value: number, label: string }) {
    return (
        <div className="flex flex-col items-center space-y-2">
            <span className="text-4xl md:text-6xl font-serif text-[#D4AF37] font-light">
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-white/50">{label}</span>
        </div>
    );
}

function QuoteSection() {
    return (
        <section className="py-24 px-8 text-center bg-[#050505]">
            <div className="w-16 h-16 mx-auto mb-8 opacity-20">
                <Sparkles className="w-full h-full text-[#D4AF37]" />
            </div>
            <h3 className="max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed italic text-white/80 font-serif">
                "Et par-dessus toutes ces choses, revêtez-vous de l'amour, qui est le lien de la perfection."
            </h3>
            <p className="mt-4 text-[#D4AF37] text-sm tracking-widest uppercase">Colossiens 3:14</p>

            <div className="mt-16 text-6xl md:text-8xl font-serif text-[#D4AF37] opacity-90 border border-[#D4AF37]/30 inline-block p-8 md:p-12">
                R <span className="text-4xl align-middle mx-2 text-white/50">|</span> A
            </div>

            <p className="mt-8 text-2xl uppercase tracking-[0.2em] text-white">Nous nous marions !</p>
        </section>
    );
}

function PhotoSection() {
    return (
        <section className="py-24 px-6 bg-[#0a0a0a] flex justify-center">
            <div className="max-w-md w-full p-3 border border-[#D4AF37]/30 bg-[#111] shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-700">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="aspect-[3/4] overflow-hidden w-full relative"
                >
                    <div className="absolute inset-0 border border-[#D4AF37]/20 z-10 m-2" />
                    <img
                        src={heroImage}
                        alt="Couple"
                        className="w-full h-full object-cover"
                    />
                </motion.div>
            </div>
        </section>
    );
}

function AudioParentsSection() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error("Audio play failed", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <section className="py-24 bg-[#080808] px-6">
            <audio ref={audioRef} src="/music.mp3" loop />
            <div className="max-w-md mx-auto bg-[#111] p-6 text-center border border-[#D4AF37]/20 rounded-sm mb-20">
                <p className="text-xs uppercase tracking-widest mb-4 text-white/60">Notre Chanson</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-[#D4AF37]">0:00</span>
                    <div className="h-[2px] bg-[#333] flex-1 relative">
                        <div className={`absolute left-0 top-0 h-full bg-[#D4AF37] transition-all duration-1000`} style={{ width: isPlaying ? '100%' : '0%' }} />
                    </div>
                    <span className="text-xs text-[#D4AF37]">3:45</span>
                </div>
                <button
                    onClick={togglePlay}
                    className="mt-6 w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center mx-auto hover:bg-[#D4AF37] hover:text-black transition-colors"
                >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <p className="mt-4 text-sm font-serif italic text-white/80">"Bolamu" - Divine Yala</p>
            </div>

            <div className="text-center space-y-12">
                <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Avec la bénédiction de</p>
                    <h3 className="text-xl text-white font-serif">Dieu et de nos parents</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                    <div>
                        <p className="text-sm text-white/40 uppercase mb-4 tracking-widest">Famille de la mariée</p>
                        <p className="text-xl md:text-2xl font-serif text-[#D4AF37]">Famille KASENGA</p>
                    </div>
                    <div>
                        <p className="text-sm text-white/40 uppercase mb-4 tracking-widest">Famille du marié</p>
                        <p className="text-xl md:text-2xl font-serif text-[#D4AF37]">Famille MUBUANGA</p>
                    </div>
                </div>

                <p className="pt-12 font-serif italic text-white/60 max-w-lg mx-auto">
                    "Nous unirons nos vies dans le sacrement du mariage"
                </p>
            </div>
        </section>
    );
}

function EventDetailsSection() {
    return (
        <section className="py-24 bg-[#0a0a0a] text-center px-4">
            <h3 className="text-3xl md:text-4xl font-serif text-[#D4AF37] mb-4 uppercase tracking-widest">Célébrations</h3>
            <p className="text-white/60 text-sm mb-16 uppercase tracking-wide">Samedi 21 Mars 2026</p>

            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                {/* Mairie */}
                <div className="bg-[#111] p-8 border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-colors group">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#000] border border-[#D4AF37]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <h4 className="text-xl font-serif text-[#D4AF37] mb-2">Cérémonie Civile</h4>
                    <p className="text-[#D4AF37] text-xl font-bold mb-4">10:00</p>

                    <div className="flex flex-col items-center gap-1 mb-8">
                        <span className="text-[#D4AF37] uppercase tracking-wide text-xs font-bold">Commune de Rhode-Saint-Genèse</span>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                            <span>Rue du Village 46,<br />1640 Rhode-Saint-Genèse</span>
                            <CopyButton text="Rue du Village 46, 1640 Rhode-Saint-Genèse" />
                        </div>
                    </div>
                </div>

                {/* Religion */}
                <div className="bg-[#111] p-8 border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-colors group">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#000] border border-[#D4AF37]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ChurchIcon className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <h4 className="text-xl font-serif text-[#D4AF37] mb-2">Cérémonie Religieuse</h4>
                    <p className="text-[#D4AF37] text-xl font-bold mb-4">12:00</p>

                    <div className="flex flex-col items-center gap-1 mb-8">
                        <span className="text-[#D4AF37] uppercase tracking-wide text-xs font-bold">Église Saint-Jean</span>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                            <span>Place Saint-Jean,<br />1000 Bruxelles</span>
                            <CopyButton text="Place Saint-Jean, 1000 Bruxelles" />
                        </div>
                    </div>
                </div>

                {/* Party */}
                <div className="bg-[#111] p-8 border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-colors group">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#000] border border-[#D4AF37]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Wine className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <h4 className="text-xl font-serif text-[#D4AF37] mb-2">Soirée</h4>
                    <p className="text-[#D4AF37] text-xl font-bold mb-4">19:00</p>

                    <div className="flex flex-col items-center gap-1 mb-8">
                        <span className="text-[#D4AF37] uppercase tracking-wide text-xs font-bold">Yeni Yaşam</span>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                            <span>Dobbelenbergstraat 107,<br />1130 Brussel</span>
                            <CopyButton text="Dobbelenbergstraat 107, 1130 Brussel" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function TimelineSection({ guest }: { guest: Guest }) {
    const show19 = guest.availability === 'confirmed' || guest.availability === 'pending';
    const show21 = guest.availability === 'confirmed' || guest.availability === 'pending';

    return (
        <section className="py-24 bg-[#0a0a0a] px-6 text-center overflow-hidden">
            <h3 className="text-2xl md:text-3xl uppercase tracking-[0.3em] text-[#D4AF37] mb-20 font-light">Programme</h3>

            <div className="max-w-4xl mx-auto space-y-20">
                {/* March 19 - Mariage coutumier */}
                {show19 && (
                    <div className="border border-[#D4AF37]/20 p-8 md:p-12">
                        <div className="mb-12">
                            <h4 className="text-xl md:text-2xl font-serif text-[#D4AF37] mb-2">Jeudi 19 Mars 2026</h4>
                            <p className="text-white text-sm uppercase tracking-wide">Remise de dot et Mariage coutumier</p>
                        </div>

                        <div className="relative max-w-md mx-auto">
                            <div className="absolute left-[60px] top-0 bottom-0 w-[2px] bg-[#D4AF37]/20" />
                            <div className="space-y-12">
                                <TimelineItem time="19h30" title="Mariage coutumier" icon={Heart} />
                            </div>
                            <div className="mt-8 text-center bg-[#D4AF37]/5 p-4 border border-[#D4AF37]/20">
                                <p className="text-white text-lg font-serif mb-2">Yeni Yaşam</p>
                                <div className="text-white/80 text-sm flex items-center justify-center gap-2">
                                    Dobbelenbergstraat 107, 1130 Brussel
                                    <CopyButton text="Dobbelenbergstraat 107, 1130 Brussel" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* March 21 - Wedding Day */}
                {show21 && (
                    <div className="border border-[#D4AF37]/20 p-8 md:p-12">
                        <div className="mb-12">
                            <h4 className="text-xl md:text-2xl font-serif text-[#D4AF37] mb-2">Samedi 21 Mars 2026</h4>
                            <p className="text-white text-sm uppercase tracking-wide">Mariage & Réception</p>
                        </div>

                        <div className="relative max-w-md mx-auto">
                            <div className="absolute left-[60px] top-0 bottom-0 w-[2px] bg-[#D4AF37]/20" />
                            <div className="space-y-12">
                                <TimelineItem time="10h00" title="Mairie - Cérémonie Civile" icon={MapPin} />
                                <TimelineItem time="12h00" title="Église - Cérémonie Religieuse" icon={ChurchIcon} />
                                <TimelineItem time="15h00" title="Séance photo & Cocktail" icon={Camera} />
                                <TimelineItem time="19h00" title="Réception & Dîner" icon={Utensils} />
                                <TimelineItem time="22h00" title="Soirée dansante" icon={Music} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function AccommodationSection() {
    return (
        <section className="py-24 bg-[#080808] text-center px-4 border-b border-[#D4AF37]/10">
            <Hotel className="w-12 h-12 text-[#D4AF37] mx-auto mb-6 opacity-80" />
            <h3 className="text-3xl font-serif text-[#D4AF37] mb-12 uppercase tracking-wide">Hébergement</h3>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-[#111] p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors group">
                    <h4 className="text-xl font-serif text-white mb-2 group-hover:text-[#D4AF37] transition-colors">Tangla Hotel Brussels</h4>
                    <p className="text-white/60 text-sm mb-6 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-[#D4AF37]" />
                        Avenue E. Mounier 5,<br />1200 Bruxelles
                    </p>
                    <a
                        href="https://tanglabrussels.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block border-b border-[#D4AF37] text-[#D4AF37] text-xs uppercase tracking-widest pb-1 hover:text-white hover:border-white transition-colors"
                    >
                        Réserver
                    </a>
                </div>

                <div className="bg-[#111] p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors group">
                    <h4 className="text-xl font-serif text-white mb-2 group-hover:text-[#D4AF37] transition-colors">Van der Valk Hotel</h4>
                    <p className="text-white/60 text-sm mb-6 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-[#D4AF37]" />
                        Culliganlaan 4b,<br />1831 Diegem
                    </p>
                    <a
                        href="https://www.hotelbrusselsairport.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block border-b border-[#D4AF37] text-[#D4AF37] text-xs uppercase tracking-widest pb-1 hover:text-white hover:border-white transition-colors"
                    >
                        Réserver
                    </a>
                </div>
            </div>
        </section>
    );
}

// Custom Church Icon
function ChurchIcon(props: any) {
    return <Hotel {...props} />; // Placeholder using Hotel as church
}

function TimelineItem({ time, title, icon: Icon }: any) {
    return (
        <div className="relative flex items-start gap-6">
            {/* Icon on the left */}
            <div className="relative z-10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <Icon className="w-10 h-10 text-[#D4AF37]/70 stroke-[1.5]" />
            </div>

            {/* Dot on the timeline */}
            <div className="absolute left-[60px] top-[20px] w-3 h-3 rounded-full bg-[#D4AF37] -translate-x-1/2 z-20" />

            {/* Content on the right */}
            <div className="text-left pt-2 flex-1">
                <p className="text-[#D4AF37] text-lg md:text-xl font-light mb-1">{time}</p>
                <p className="text-white/70 text-sm md:text-base font-light">{title}</p>
            </div>
        </div>
    );
}

function InfogridSection() {
    return (
        <section className="py-24 bg-[#0a0a0a] px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">

                {/* Dress Code */}
                <div className="text-center p-8 bg-[#111] border-t-2 border-[#D4AF37]">
                    <Shirt className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" />
                    <h4 className="text-xl uppercase tracking-widest text-white mb-4">
                        Dress Code<br />Soirée
                    </h4>
                    <p className="text-[#D4AF37] font-serif italic text-2xl mb-2">Golden Chic</p>
                    <p className="text-white/50 text-xs max-w-xs mx-auto">
                        Nous vous invitons à porter une tenue élégante avec une touche dorée.
                    </p>
                </div>

                {/* Gifts */}
                <div className="text-center p-8 bg-[#111] border-t-2 border-[#D4AF37]">
                    <Gift className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" />
                    <h4 className="text-xl uppercase tracking-widest text-white mb-4">Cadeaux</h4>
                    <p className="text-white/60 text-sm max-w-xs mx-auto mb-4">
                        Votre présence est notre plus beau cadeau. Si vous souhaitez nous gâter, une urne sera disponible.
                    </p>
                    <p className="text-[#D4AF37]/80 text-xs max-w-xs mx-auto italic mb-6">
                        Nous acceptons également avec joie le farotage.
                    </p>
                    <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto" />
                </div>
            </div>
        </section>
    );
}

function AccessPassSection({ guest }: { guest: Guest }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const downloadRef = useRef<HTMLDivElement>(null); // Ref for purely the download part

    const handleDownload = async (type: '19' | '21') => {
        try {
            const response = await fetch(`/api/invitation/generate/${guest.id || 1}?type=${type}`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invitation-${type}-Mars-${guest.firstName}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("PDF Download failed", err);
            alert("Erreur lors du téléchargement du PDF");
        }
    };

    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">

            <div className="text-center mb-12 relative z-10">
                <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-3xl text-white font-serif">Votre Pass d'Accès</h3>
            </div>

            <div className="flex flex-col items-center relative z-10 p-4">

                {/* The Card Container that gets downloaded */}
                <div ref={downloadRef} className="bg-[#111] p-8 md:p-12 max-w-sm w-full border border-[#D4AF37]/50 relative text-center shadow-2xl">
                    <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-[#D4AF37]" />
                    <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-[#D4AF37]" />
                    <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-[#D4AF37]" />
                    <div className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-[#D4AF37]" />

                    <h4 className="text-[#D4AF37] font-serif italic text-xl mb-1">Wedding Invitation</h4>
                    <h4 className="text-white uppercase tracking-[0.2em] text-[10px] mb-8">Les Mariés</h4>

                    <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Invité(e)</p>
                    <h2 className="text-3xl font-serif text-white mb-2">{guest.firstName}</h2>
                    <h2 className="text-xl font-serif text-white/50 mb-8">{guest.lastName}</h2>

                    <div className="bg-white p-4 inline-block mb-8 rounded-lg">
                        <img
                            // Placeholder QR - in production use a real QR gen lib
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GUEST-${guest.firstName}`}
                            alt="QR Code"
                            className="w-32 h-32 opacity-90"
                        />
                    </div>

                    <p className="text-[#D4AF37] text-sm font-serif mb-1">Nombre d'invités : {guest.partySize}</p>
                </div>

                <div className="flex gap-4 mt-12 flex-wrap justify-center">
                    {(guest.availability === 'confirmed' || guest.availability === 'pending') && (
                        <button
                            onClick={() => handleDownload('19')}
                            className="bg-[#D4AF37] text-black px-8 py-4 rounded-sm uppercase tracking-[0.2em] text-xs font-bold hover:bg-white transition-colors flex items-center gap-3"
                        >
                            <Download className="w-4 h-4" />
                            Pass 19 Mars
                        </button>
                    )}

                    {(guest.availability === 'confirmed' || guest.availability === 'pending') && (
                        <button
                            onClick={() => handleDownload('21')}
                            className="bg-white text-black px-8 py-4 rounded-sm uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#D4AF37] transition-colors flex items-center gap-3"
                        >
                            <Download className="w-4 h-4" />
                            Pass 21 Mars
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

function FooterSection() {
    return (
        <section className="py-20 bg-black text-center border-t border-[#D4AF37]/20">
            <h3 className="text-4xl font-handwriting text-white mb-6">Merci</h3>
            <p className="text-white/60 text-sm tracking-widest mb-12">Nous avons hâte de célébrer avec vous</p>

            <p className="mt-24 text-[10px] text-white/20 uppercase tracking-widest">
                Les Mariés 2026 • Designed with Love
            </p>
        </section>
    );
}

// Stats / Loading
function LoadingScreen() {
    return (
        <div className="h-screen bg-black flex items-center justify-center">
            <div className="text-[#D4AF37] animate-pulse tracking-[0.4em] uppercase text-xs">Chargement...</div>
        </div>
    );
}

function ErrorScreen({ message }: { message: string }) {
    return (
        <div className="h-screen bg-black flex items-center justify-center p-8 text-center">
            <div className="border border-[#D4AF37] p-12 max-w-md">
                <p className="text-[#D4AF37] mb-4">Accès Restreint</p>
                <p className="text-white/50 text-sm">{message}</p>
            </div>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 ml-2 text-[#D4AF37] hover:text-white transition-colors"
            title="Copier l'adresse"
        >
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}
