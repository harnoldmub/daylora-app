import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    Heart,
    ChevronDown,
    X,
    Share2,
    Facebook,
    Twitter,
    MessageCircle,
    Link2,
    Check,
    Gift,
} from "lucide-react";
import { useParams, Redirect, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    insertRsvpResponseSchema,
    type InsertRsvpResponse,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AccommodationSection } from "@/components/accommodation";
import { motion } from "framer-motion";
import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { InlineEditor } from "@/components/ui/inline-editor";
import { Layout, Eye } from "lucide-react";
import { getButtonClass } from "@/lib/design-presets";
import { usePublicEdit } from "@/contexts/public-edit";
import { compressImageFileToJpegDataUrl } from "@/lib/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Default/Fake data for empty state or loading
const FAKE_DATA = {
    title: "Sophie & Marc",
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    location: "Château de la Verrière",
    heroImage: "/defaults/hero_default.jpg",
    couplePhoto: "/defaults/couple_default.jpg",
    story: "Leur histoire a commencé il y a quelques années, une rencontre simple qui s'est transformée en une belle aventure. Aujourd'hui, ils s'apprêtent à dire 'Oui' entourés de leurs proches."
};

const DEFAULT_LOCATION_ITEMS = [
    {
        title: "Cérémonie civile",
        address: "Mairie de Lille — 10 Rue Pierre Mauroy",
        description: "Rendez-vous à 14h30 pour accueillir les invités."
    },
    {
        title: "Réception",
        address: "Château de la Verrière — Salle des Roses",
        description: "Cocktail et dîner à partir de 18h."
    }
];

const DEFAULT_PROGRAM_ITEMS = [
    {
        time: "14:30",
        title: "Accueil des invités",
        description: "Installation et photos de famille."
    },
    {
        time: "15:00",
        title: "Cérémonie",
        description: "Échange des vœux et sortie des mariés."
    },
    {
        time: "18:30",
        title: "Cocktail & Dîner",
        description: "Apéritif, repas et animations."
    }
];

type LocationItem = {
    title: string;
    address: string;
    description: string;
};

type ProgramItem = {
    time: string;
    title: string;
    description: string;
};

const MAX_HERO_IMAGE_DATA_URL_LENGTH = 2_800_000;
const MAX_COUPLE_IMAGE_DATA_URL_LENGTH = 2_000_000;
const MAX_GALLERY_IMAGE_DATA_URL_LENGTH = 1_200_000;
const MAX_GALLERY_IMAGES = 10;
const DEFAULT_GALLERY_IMAGES = [
    "/defaults/gallery/01.jpg",
    "/defaults/gallery/02.jpg",
    "/defaults/gallery/03.jpg",
    "/defaults/gallery/04.jpg",
    "/defaults/gallery/05.jpg",
    "/defaults/gallery/06.jpg",
];

const TEMPLATE_STYLES = {
    classic: {
        pageBg: "bg-[#FFFDF9]",
        heroOverlay: "from-[#2B2320]/30 via-transparent to-[#FFFDF9]",
        heroWrapper: "text-center max-w-5xl space-y-8",
        heroTitle: "text-6xl md:text-8xl font-serif font-bold text-[#2B2320] leading-[1.1]",
        heroSubtitle: "text-sm md:text-base font-serif italic tracking-[0.3em] uppercase text-primary/80 mb-4",
        heroDate: "text-xl md:text-3xl font-serif font-medium text-[#7A6B5E] mt-6 border-y border-primary/20 py-4 inline-block px-10",
        heroButton: "px-14 py-7 text-sm tracking-[0.2em] uppercase font-bold bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-none",
        rsvpSection: "bg-[#FFFDF9] py-32",
        rsvpCard: "border-none shadow-[0_30px_100px_rgba(200,169,106,0.12)] bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-white/50",
        storyTitle: "text-5xl font-serif font-bold text-[#2B2320] mb-10 text-center",
        storyLayout: "grid grid-cols-1 lg:grid-cols-2 gap-20 items-center",
        storyImage: "rounded-[3rem] shadow-2xl border-8 border-white rotate-1",
        container: "max-w-6xl mx-auto px-6",
        decoration: "serif-border",
    },
    modern: {
        pageBg: "bg-white",
        heroOverlay: "from-black/60 via-black/20 to-white",
        heroWrapper: "text-left max-w-7xl pt-20 px-10",
        heroTitle: "text-7xl md:text-[10rem] font-sans font-black text-white leading-[0.85] tracking-tighter uppercase",
        heroSubtitle: "text-[10px] md:text-xs font-sans font-black tracking-[0.8em] uppercase text-primary mb-6 drop-shadow-md",
        heroDate: "text-2xl md:text-4xl font-sans font-black text-white/40 mt-8 tracking-widest uppercase",
        heroButton: "px-12 py-6 text-xs tracking-[0.4em] uppercase font-black bg-white text-black hover:bg-primary hover:text-white transition-all rounded-none",
        rsvpSection: "bg-black text-white py-32",
        rsvpCard: "bg-white/5 border border-white/10 backdrop-blur-2xl rounded-none shadow-2xl p-10",
        storyTitle: "text-7xl md:text-9xl font-sans font-black text-black leading-none tracking-tighter mb-12",
        storyLayout: "grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0 items-stretch",
        storyImage: "rounded-none grayscale hover:grayscale-0 transition-all duration-1000 object-cover h-full",
        container: "max-w-full mx-auto px-0",
        decoration: "none",
    },
    minimal: {
        pageBg: "bg-[#FAFAFA]",
        heroOverlay: "from-transparent via-transparent to-[#FAFAFA]",
        heroWrapper: "text-center max-w-3xl space-y-12",
        heroTitle: "text-5xl md:text-7xl font-sans font-thin text-[#1A1A1A] tracking-[-0.05em] leading-tight",
        heroSubtitle: "text-[9px] font-sans tracking-[1em] uppercase text-[#A0A0A0] mb-8",
        heroDate: "text-lg md:text-2xl font-sans font-light text-[#666666] mt-4 flex items-center justify-center gap-4 before:h-px before:w-8 before:bg-black/10 after:h-px after:w-8 after:bg-black/10",
        heroButton: "px-10 py-5 text-[10px] tracking-[0.5em] uppercase font-medium border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors rounded-full",
        rsvpSection: "bg-[#FAFAFA] py-32",
        rsvpCard: "border border-[#EEEEEE] shadow-none bg-white rounded-xl p-8",
        storyTitle: "text-4xl font-sans font-extralight text-[#1A1A1A] text-center mb-16",
        storyLayout: "max-w-4xl mx-auto space-y-20 px-6",
        storyImage: "rounded-lg opacity-90 shadow-sm",
        container: "max-w-4xl mx-auto px-6",
        decoration: "floral",
    },
} as const;

const getButtonRadiusClass = (buttonRadius?: string) => {
    if (buttonRadius === "square") return "rounded-md";
    if (buttonRadius === "rounded") return "rounded-xl";
    return "rounded-full";
};

function Countdown({ weddingDate }: { weddingDate: string }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const target = new Date(weddingDate);
        const timer = setInterval(() => {
            const now = new Date();
            const difference = target.getTime() - now.getTime();

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
    }, [weddingDate]);

    return (
        <div className="flex gap-4 md:gap-8 justify-center items-center flex-wrap">
            {[
                { value: timeLeft.days, label: "Jours" },
                { value: timeLeft.hours, label: "Heures" },
                { value: timeLeft.minutes, label: "Minutes" },
                { value: timeLeft.seconds, label: "Secondes" },
            ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-2xl md:text-3xl font-serif font-bold text-primary">
                            {item.value.toString().padStart(2, "0")}
                        </span>
                    </div>
                    <span className="text-xs md:text-sm text-muted-foreground mt-2 font-sans">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function InvitationPage() {
    const params = useParams<{ slug: string }>();
    const [routePath, setLocation] = useLocation();
    const search = useSearch();

    const slug = params.slug || "";

    const { data: wedding, isLoading } = useWedding(slug || undefined);
    const updateWedding = useUpdateWedding();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { canEdit, editMode } = usePublicEdit();
    const [ctaPath, setCtaPath] = useState("rsvp");
    const [draftMedia, setDraftMedia] = useState<{ heroImage: string; couplePhoto: string }>({ heroImage: "", couplePhoto: "" });
    const [isUploading, setIsUploading] = useState<{ heroImage: boolean; couplePhoto: boolean }>({ heroImage: false, couplePhoto: false });
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!wedding) return;
        setCtaPath(wedding.config?.navigation?.heroCtaPath || "rsvp");
        setDraftMedia({
            heroImage: wedding.config?.media?.heroImage || "",
            couplePhoto: wedding.config?.media?.couplePhoto || "",
        });
    }, [wedding?.id, (wedding as any)?.updatedAt]);

    const queryParams = useMemo(() => new URLSearchParams(search), [search]);
    const routeSection = useMemo(() => routePath.replace(/^\//, "").trim(), [routePath]);
    const requestedSection = useMemo(() => {
        const fromQuery = (queryParams.get("section") || "").trim();
        const fromRoute = routeSection;
        return (fromQuery || fromRoute) || null;
    }, [queryParams, routeSection]);

    const SECTION_IDS = useMemo(() => ["rsvp", "story", "gallery", "location", "program"] as const, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!requestedSection) return;
        if (!SECTION_IDS.includes(requestedSection as any)) return;
        // Wait a tick so the section is present, then scroll smoothly.
        setTimeout(() => {
            document.getElementById(requestedSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    }, [requestedSection, SECTION_IDS, wedding?.id]);

    // Save text helper
    const handleSaveText = async (key: string, value: string) => {
        if (!wedding) return;

        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    texts: {
                        ...(wedding.config.texts || {}),
                        [key]: value
                    }
                }
            });
            toast({ title: "Modifications enregistrées" });
        } catch (error) {
            toast({
                title: "Erreur lors de la sauvegarde",
                variant: "destructive"
            });
        }
    };

    const toDateInputValue = (value: string) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const pad = (n: number) => n.toString().padStart(2, "0");
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    };

    const fromDateInputValue = (value: string) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString();
    };

    const saveCountdownDate = async (value: string) => {
        if (!wedding) return;
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        countdownDate: value,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'enregistrer le countdown.", variant: "destructive" });
        }
    };

    const updateMedia = async (key: "heroImage" | "couplePhoto", value: string) => {
        if (!wedding) return;
        setDraftMedia((prev) => ({ ...prev, [key]: value }));
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    media: {
                        ...(wedding.config.media || {}),
                        [key]: value,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'enregistrer l'image.", variant: "destructive" });
        }
    };

    const handleMediaUpload = (key: "heroImage" | "couplePhoto") => async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !wedding) return;
        try {
            setIsUploading((prev) => ({ ...prev, [key]: true }));
            const compressed = await compressImageFileToJpegDataUrl(file, {
                maxSize: key === "heroImage" ? 1700 : 1400,
                quality: 0.84,
                maxDataUrlLength: key === "heroImage" ? MAX_HERO_IMAGE_DATA_URL_LENGTH : MAX_COUPLE_IMAGE_DATA_URL_LENGTH,
            });
            await updateMedia(key, compressed);
        } catch (err: any) {
            const msg =
                String(err?.message) === "too_large"
                    ? "Image trop lourde. Importez une image plus légère."
                    : "Impossible d'importer l'image.";
            toast({ title: "Erreur", description: msg, variant: "destructive" });
        } finally {
            setIsUploading((prev) => ({ ...prev, [key]: false }));
            event.target.value = "";
        }
    };

    const updateLocationItem = async (index: number, patch: Partial<LocationItem>) => {
        if (!wedding) return;
        const currentItems = (wedding.config?.sections?.locationItems?.length
            ? wedding.config.sections.locationItems
            : DEFAULT_LOCATION_ITEMS) as LocationItem[];
        const nextItems = currentItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        locationItems: nextItems,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'enregistrer le lieu.", variant: "destructive" });
        }
    };

    const deleteLocationItem = async (index: number) => {
        if (!wedding) return;
        const currentItems = (wedding.config?.sections?.locationItems?.length
            ? wedding.config.sections.locationItems
            : DEFAULT_LOCATION_ITEMS) as LocationItem[];
        const nextItems = currentItems.filter((_item, idx) => idx !== index);
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        locationItems: nextItems,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible de supprimer le lieu.", variant: "destructive" });
        }
    };

    const addLocationItem = async () => {
        if (!wedding) return;
        const currentItems = (wedding.config?.sections?.locationItems?.length
            ? wedding.config.sections.locationItems
            : DEFAULT_LOCATION_ITEMS) as LocationItem[];
        const nextItems = [...currentItems, { title: "Nouveau lieu", address: "", description: "" }];
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        locationItems: nextItems,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'ajouter le lieu.", variant: "destructive" });
        }
    };

    const updateProgramItem = async (index: number, patch: Partial<ProgramItem>) => {
        if (!wedding) return;
        const currentItems = (wedding.config?.sections?.programItems?.length
            ? wedding.config.sections.programItems
            : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
        const nextItems = currentItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        programItems: nextItems,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'enregistrer le déroulé.", variant: "destructive" });
        }
    };

    const deleteProgramItem = async (index: number) => {
        if (!wedding) return;
        const currentItems = (wedding.config?.sections?.programItems?.length
            ? wedding.config.sections.programItems
            : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
        const nextItems = currentItems.filter((_item, idx) => idx !== index);
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        programItems: nextItems,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible de supprimer l'étape.", variant: "destructive" });
        }
    };

    const addProgramItem = async () => {
        if (!wedding) return;
        const currentItems = (wedding.config?.sections?.programItems?.length
            ? wedding.config.sections.programItems
            : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
        const nextItems = [...currentItems, { time: "12:00", title: "Nouvelle étape", description: "" }];
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        programItems: nextItems,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'ajouter l'étape.", variant: "destructive" });
        }
    };

    const saveCtaPath = async (value: string) => {
        if (!wedding) return;
        setCtaPath(value);
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    navigation: {
                        ...(wedding.config.navigation || {}),
                        heroCtaPath: value,
                    } as any,
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'enregistrer l'action du bouton.", variant: "destructive" });
        }
    };

    const form = useForm<InsertRsvpResponse>({
        resolver: zodResolver(insertRsvpResponseSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            partySize: 1,
            availability: undefined,
            notes: "",
        },
    });

    const rsvpMutation = useMutation({
        mutationFn: async (data: InsertRsvpResponse) => {
            return await apiRequest("POST", "/api/rsvp", data);
        },
        onSuccess: () => {
            setIsSubmitted(true);
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur",
                description: error.message || "Une erreur s'est produite.",
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const currentWedding = wedding || {
        ...FAKE_DATA,
        id: "fake-id",
        slug: "demo",
        templateId: "classic",
        config: {
            theme: {
                primaryColor: "#C8A96A",
                secondaryColor: "#FFFDF9",
                fontFamily: "serif",
                toneId: "golden-ivory",
                buttonStyle: "solid",
                buttonRadius: "pill",
            }
        }
    } as any;

    if (currentWedding.templateId === 'heritage') {
        return <Redirect to={`/invitation/${currentWedding.id}`} />;
    }

    const templateId = (currentWedding.templateId as keyof typeof TEMPLATE_STYLES) || "classic";
    const template = TEMPLATE_STYLES[templateId] || TEMPLATE_STYLES.classic;
    const heroTitle = currentWedding.config?.texts?.heroTitle || currentWedding.title;
    const heroSubtitle = currentWedding.config?.texts?.heroSubtitle || "Le Mariage de";
    const heroCta = currentWedding.config?.texts?.heroCta || "Confirmer votre présence";
    const rsvpTitle = currentWedding.config?.texts?.rsvpTitle || "CONFIRMEZ VOTRE PRÉSENCE";
    const rsvpDescription = currentWedding.config?.texts?.rsvpDescription || "Nous serions ravis de vous compter parmi nous";
    const rsvpButton = currentWedding.config?.texts?.rsvpButton || "Je confirme ma présence";
    const storyTitle = currentWedding.config?.texts?.storyTitle || "NOTRE HISTOIRE";
    const storyBody = currentWedding.config?.texts?.storyBody || currentWedding.story || FAKE_DATA.story;
    const locationTitle = currentWedding.config?.texts?.locationTitle || "LIEU & ACCÈS";
    const locationDescription = currentWedding.config?.texts?.locationDescription || "Toutes les informations pour nous rejoindre";
    const programTitle = currentWedding.config?.texts?.programTitle || "DÉROULEMENT";
    const programDescription = currentWedding.config?.texts?.programDescription || "Le programme de notre journée";
    const heroImage = wedding ? (draftMedia.heroImage || "") : FAKE_DATA.heroImage;
    const couplePhoto = wedding ? (draftMedia.couplePhoto || "") : FAKE_DATA.couplePhoto;
    const logoUrl = currentWedding.config?.branding?.logoUrl || "";
    const logoText = currentWedding.config?.branding?.logoText || currentWedding.title;
    const countdownDate = currentWedding.config?.sections?.countdownDate || currentWedding.weddingDate || FAKE_DATA.date;
    const locationItems: LocationItem[] = (currentWedding.config?.sections?.locationItems?.length
        ? currentWedding.config.sections.locationItems
        : DEFAULT_LOCATION_ITEMS) as LocationItem[];
    const programItems: ProgramItem[] = (currentWedding.config?.sections?.programItems?.length
        ? currentWedding.config.sections.programItems
        : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
    const showRsvp = currentWedding.config?.navigation?.pages?.rsvp ?? true;
    const showStory = currentWedding.config?.navigation?.pages?.story ?? true;
    const showGallery = currentWedding.config?.navigation?.pages?.gallery ?? true;
    const showLocation = currentWedding.config?.navigation?.pages?.location ?? true;
    const showProgram = currentWedding.config?.navigation?.pages?.program ?? true;
    const buttonToneClass = getButtonClass(currentWedding.config?.theme?.buttonStyle);
    const buttonRadiusClass = getButtonRadiusClass(currentWedding.config?.theme?.buttonRadius);
    const isModernTemplate = templateId === "modern";

    const galleryTitle = currentWedding.config?.texts?.galleryTitle || "GALERIE";
    const galleryDescription =
        currentWedding.config?.texts?.galleryDescription || "Quelques instants capturés avant le grand jour.";
    const galleryImages = (
        (currentWedding.config?.sections?.galleryImages?.length
            ? currentWedding.config.sections.galleryImages
            : DEFAULT_GALLERY_IMAGES) as string[]
    ).slice(0, MAX_GALLERY_IMAGES);

    const resolveInternalHref = (path: string) => {
        if (path === "home") return "/";
        if (path === "rsvp") return "/rsvp";
        if (path === "story") return "/story";
        if (path === "gallery") return "/gallery";
        if (path === "location") return "/location";
        if (path === "program") return "/program";
        if (path === "cagnotte") return "/cagnotte";
        if (path === "live") return "/live";
        if (path.startsWith("page:")) return `/page/${path.replace(/^page:/, "")}`;
        return "/";
    };

    const handleHeroCtaClick = () => {
        if (!slug) return;
        if (canEdit && editMode) return;
        setLocation(resolveInternalHref(ctaPath || "rsvp"));
    };

    const saveGalleryImages = async (nextImages: string[]) => {
        if (!wedding) return;
        const capped = nextImages.slice(0, MAX_GALLERY_IMAGES);
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    sections: {
                        ...(wedding.config.sections || {}),
                        galleryImages: capped,
                    },
                },
            });
        } catch {
            toast({ title: "Erreur", description: "Impossible d'enregistrer la galerie.", variant: "destructive" });
        }
    };

    const onGalleryFilesSelected = async (files: FileList | null) => {
        if (!files || !wedding) return;
        const current = (
            wedding.config?.sections?.galleryImages?.length
                ? wedding.config.sections.galleryImages
                : DEFAULT_GALLERY_IMAGES
        ).slice(0, MAX_GALLERY_IMAGES);
        const remaining = Math.max(0, MAX_GALLERY_IMAGES - current.length);
        const batch = Array.from(files).slice(0, remaining);
        if (batch.length === 0) {
            toast({ title: "Galerie pleine", description: "Maximum 10 photos.", variant: "destructive" });
            return;
        }

        const next: string[] = [...current];
        for (const file of batch) {
            try {
                const compressed = await compressImageFileToJpegDataUrl(file, {
                    maxSize: 1200,
                    quality: 0.82,
                    maxDataUrlLength: MAX_GALLERY_IMAGE_DATA_URL_LENGTH,
                });
                next.push(compressed);
            } catch (err: any) {
                const msg =
                    String(err?.message) === "too_large"
                        ? "Une photo est trop lourde. Importez une image plus légère."
                        : "Impossible d'importer une photo.";
                toast({ title: "Erreur", description: msg, variant: "destructive" });
            }
        }

        await saveGalleryImages(next);
    };

    const removeGalleryImage = async (index: number) => {
        if (!wedding) return;
        const current = (
            wedding.config?.sections?.galleryImages?.length
                ? wedding.config.sections.galleryImages
                : DEFAULT_GALLERY_IMAGES
        ).slice(0, MAX_GALLERY_IMAGES);
        await saveGalleryImages(current.filter((_img, idx) => idx !== index));
    };

    const resetGallery = async () => {
        await saveGalleryImages([...DEFAULT_GALLERY_IMAGES]);
    };

    const FloralDecoration = () => (
        <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-6 text-black/10 transition-transform hover:scale-110 duration-700" fill="currentColor">
            <path d="M50,10 C60,30 90,40 50,90 C10,40 40,30 50,10 Z" />
            <path d="M50,40 C70,50 80,80 50,90 C20,80 30,50 50,40 Z" opacity="0.5" />
        </svg>
    );

    if (
        (requestedSection === "rsvp" && !showRsvp) ||
        (requestedSection === "story" && !showStory) ||
        (requestedSection === "gallery" && !showGallery) ||
        (requestedSection === "location" && !showLocation) ||
        (requestedSection === "program" && !showProgram)
    ) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="text-center">
                    <div className="text-lg font-semibold text-foreground mb-2">Page desactivée</div>
                    <p className="text-sm text-muted-foreground mb-6">
                        Cette page a ete masquee dans la configuration du site.
                    </p>
                    <Button onClick={() => setLocation("/")} variant="outline">
                        Retour au site
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen relative group/page ${template.pageBg}`}>
            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
                    {heroImage ? (
                        <motion.div
                            className="absolute inset-0 bg-cover bg-center opacity-40"
                            style={{ backgroundImage: `url(${heroImage})` }}
                            initial={{ scale: 1 }}
                            animate={{ scale: 1.08 }}
                            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        />
                    ) : (
                        <div className="absolute inset-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary" />
                            <div
                                className="absolute inset-0 opacity-60"
                                style={{
                                    backgroundImage:
                                        "radial-gradient(ellipse at 20% 15%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.08), transparent 60%)",
                                }}
                            />
                        </div>
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-b ${template.heroOverlay}`} />

                    <div className={`relative z-10 mx-auto ${template.heroWrapper}`}>
                        {template.decoration === "floral" && <FloralDecoration />}

                        <div className={`flex items-center mb-10 ${isModernTemplate ? "justify-start" : "justify-center"}`}>
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={logoText}
                                    className="h-16 md:h-20 object-contain drop-shadow-xl"
                                />
                            ) : (
                                <div className="text-xs font-black uppercase tracking-[0.4em] text-white/60">
                                    {logoText || "L'Union"}
                                </div>
                            )}
                        </div>

                        <motion.div
                            className={`mb-6 flex ${isModernTemplate ? "justify-start" : "justify-center"} ${template.heroSubtitle}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <InlineEditor
                                value={heroSubtitle}
                                onSave={(val) => handleSaveText("heroSubtitle", val)}
                                canEdit={canEdit && editMode}
                                placeholder="Le Mariage de"
                            />
                        </motion.div>

                        <h1 className={`${template.heroTitle} mb-8 drop-shadow-2xl`}>
                            <InlineEditor
                                value={heroTitle}
                                onSave={(val) => handleSaveText("heroTitle", val)}
                                canEdit={canEdit && editMode}
                                placeholder={currentWedding.title}
                                className={isModernTemplate ? "text-left" : "text-center"}
                            />
                        </h1>

                        <div className="mb-12">
                            <div className={`${template.heroDate} ${isModernTemplate ? "justify-start" : "justify-center"}`}>
                                <InlineEditor
                                    value={currentWedding.config?.texts?.weddingDate || (currentWedding.weddingDate ? new Date(currentWedding.weddingDate).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' }) : "Prochainement")}
                                    onSave={(val) => handleSaveText("weddingDate", val)}
                                    canEdit={canEdit && editMode}
                                    placeholder="19 & 21 mars 2026"
                                />
                            </div>
                        </div>

	                        <div className={`mb-14 ${isModernTemplate ? "justify-start" : "justify-center"} flex`}>
	                            <Countdown weddingDate={countdownDate} />
	                        </div>

                            <div className={`flex ${isModernTemplate ? "justify-start" : "justify-center"}`}>
                                <Button
                                    size="lg"
                                    className={`${template.heroButton} ${buttonToneClass} ${buttonRadiusClass}`}
                                    onClick={handleHeroCtaClick}
                                >
                                    {heroCta}
                                </Button>
                            </div>

	                        {canEdit && editMode ? (
	                            <div className={`mt-10 ${isModernTemplate ? "text-left" : "text-center"}`}>
	                                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm">
                                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Action bouton</div>
                                    <select
                                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                                        value={ctaPath}
                                        onChange={(e) => saveCtaPath(e.target.value)}
                                    >
                                        <option value="rsvp">Aller vers RSVP</option>
                                        <option value="story">Aller vers Histoire</option>
                                        <option value="gallery">Aller vers Galerie</option>
                                        <option value="location">Aller vers Lieux</option>
                                        <option value="program">Aller vers Programme</option>
                                        <option value="cagnotte">Aller vers Cagnotte</option>
                                        <option value="live">Aller vers Live</option>
                                        {(currentWedding.config?.navigation?.customPages || [])
                                            .filter((p: any) => p.enabled && p.slug)
                                            .map((p: any) => (
                                                <option key={p.id} value={`page:${p.slug}`}>
                                                    Page: {p.title}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="mt-4 text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Texte du bouton:</span>{" "}
                                    <InlineEditor
                                        value={heroCta}
                                        onSave={(val) => handleSaveText("heroCta", val)}
                                        canEdit={canEdit && editMode}
                                        placeholder="Confirmer votre présence"
                                    />
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm">
                                        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Image de couverture</div>
                                        <input type="file" accept="image/*" onChange={handleMediaUpload("heroImage")} />
                                        <div className="mt-2 flex items-center gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={() => updateMedia("heroImage", "")} disabled={!heroImage || isUploading.heroImage}>
                                                Supprimer
                                            </Button>
                                            {isUploading.heroImage ? <span className="text-xs text-muted-foreground">Import...</span> : null}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm">
                                        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Countdown</div>
                                        <input
                                            type="datetime-local"
                                            className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                                            value={toDateInputValue(countdownDate)}
                                            onChange={(e) => saveCountdownDate(fromDateInputValue(e.target.value))}
                                        />
                                        <div className="mt-2 text-xs text-muted-foreground">Change la date du compte à rebours.</div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
            </section>

            {/* RSVP Section */}
            {showRsvp ? (
                <section id="rsvp" className={`scroll-mt-24 py-32 px-6 ${template.rsvpSection}`}>
                    <div className="max-w-3xl mx-auto">
                        {!isSubmitted ? (
                            <>
                                <h1 className="text-4xl md:text-6xl font-serif font-light text-center mb-6 text-foreground tracking-tight">
                                    <InlineEditor
                                        value={rsvpTitle}
                                        onSave={(val) => handleSaveText("rsvpTitle", val)}
                                        canEdit={canEdit && editMode}
                                    />
                                </h1>
                                <div className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
                                    <InlineEditor
                                        value={rsvpDescription}
                                        onSave={(val) => handleSaveText("rsvpDescription", val)}
                                        canEdit={canEdit && editMode}
                                        isTextArea={true} // Allow multiline for description
                                        className="text-center"
                                    />
                                </div>

                                <Card className={`relative overflow-hidden ${template.rsvpCard}`}>
                                    {canEdit && editMode ? (
                                        <div className="mb-10 p-6 rounded-3xl bg-primary/5 border border-primary/10">
                                            <div className="text-[11px] uppercase tracking-widest text-primary font-bold mb-3">Texte du bouton RSVP</div>
                                            <InlineEditor
                                                value={rsvpButton}
                                                onSave={(val) => handleSaveText("rsvpButton", val)}
                                                canEdit={canEdit && editMode}
                                                placeholder="Je confirme ma présence"
                                            />
                                        </div>
                                    ) : null}
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit((d) => rsvpMutation.mutate(d))} className="space-y-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormField
                                                    control={form.control}
                                                    name="firstName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Prénom *</FormLabel>
                                                            <FormControl><Input {...field} className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20" placeholder="Votre prénom" /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="lastName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Nom *</FormLabel>
                                                            <FormControl><Input {...field} className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20" placeholder="Votre nom" /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Adresse email *</FormLabel>
                                                            <FormControl><Input {...field} value={field.value ?? ""} type="email" className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20" placeholder="votre@email.com" /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="availability"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Serez-vous présent ? *</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20">
                                                                        <SelectValue placeholder="Sélectionnez" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="confirmed">Oui, avec grand plaisir !</SelectItem>
                                                                    <SelectItem value="declined">Non, je ne pourrai pas être présent</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button type="submit" size="lg" className={`w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 ${buttonRadiusClass} ${buttonToneClass}`} disabled={rsvpMutation.isPending}>
                                                {rsvpMutation.isPending ? "Envoi..." : rsvpButton}
                                            </Button>
                                        </form>
                                    </Form>
                                </Card>
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white/50 rounded-[4rem] border border-primary/10">
                                <Check className="h-24 w-24 text-primary mx-auto mb-8 drop-shadow-xl" />
                                <h3 className="text-4xl font-serif font-black mb-4">Merci !</h3>
                                <p className="text-muted-foreground mb-10 text-lg">Nous avons bien reçu votre réponse.</p>
                                <Button variant="outline" size="lg" className="rounded-full px-10" onClick={() => setIsSubmitted(false)}>Ajouter une autre réponse</Button>
                            </div>
                        )}
                    </div>
                </section>
            ) : null}

            {/* Story Section */}
            {showStory ? (
                <section id="story" className="scroll-mt-24 py-32 px-6">
                    <div className={template.container}>
                        <h2 className={`${template.storyTitle} mb-12`}>
                            <InlineEditor
                                value={storyTitle}
                                onSave={(val) => handleSaveText("storyTitle", val)}
                                canEdit={canEdit && editMode}
                            />
                        </h2>
                        <div className={template.storyLayout}>
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img
                                    src={couplePhoto || "/defaults/couple_default.jpg"}
                                    alt="Le couple"
                                    className={`w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-[1.02] ${template.storyImage}`}
                                />
                                {canEdit && editMode ? (
                                    <div className="mt-4 rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm relative z-20">
                                        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Photo du couple</div>
                                        <input type="file" accept="image/*" onChange={handleMediaUpload("couplePhoto")} />
                                        <div className="mt-2 flex items-center gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={() => updateMedia("couplePhoto", "")} disabled={!couplePhoto || isUploading.couplePhoto}>
                                                Supprimer
                                            </Button>
                                            {isUploading.couplePhoto ? <span className="text-xs text-muted-foreground">Import...</span> : null}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <div className="space-y-8 flex flex-col justify-center">
                                {template.decoration === "floral" && <FloralDecoration />}
                                <div className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light italic text-[#7A6B5E] max-w-lg mx-auto lg:mx-0">
                                    <InlineEditor
                                        value={storyBody}
                                        onSave={(val) => handleSaveText("storyBody", val)}
                                        canEdit={canEdit && editMode}
                                        isTextArea
                                    />
                                </div>
                                {template.decoration === "serif-border" && (
                                    <div className="h-px w-24 bg-primary/30 mx-auto lg:mx-0" />
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* Gallery Section */}
            {showGallery ? (
                <section id="gallery" className="scroll-mt-24 py-28 px-6 bg-white/40">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide">
                                <InlineEditor
                                    value={galleryTitle}
                                    onSave={(val) => handleSaveText("galleryTitle", val)}
                                    canEdit={canEdit && editMode}
                                    className="uppercase"
                                />
                            </h2>
                            <div className="mt-4 text-muted-foreground leading-relaxed">
                                <InlineEditor
                                    value={galleryDescription}
                                    onSave={(val) => handleSaveText("galleryDescription", val)}
                                    canEdit={canEdit && editMode}
                                    isTextArea
                                />
                            </div>
                        </div>

                        {canEdit && editMode ? (
                            <div className="mt-10 rounded-3xl bg-white/80 border border-primary/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="text-sm text-muted-foreground">
                                    {galleryImages.length}/{MAX_GALLERY_IMAGES} photos
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={async (e) => {
                                            await onGalleryFilesSelected(e.target.files);
                                            e.target.value = "";
                                        }}
                                    />
                                    <Button type="button" size="sm" variant="outline" onClick={resetGallery}>
                                        Remettre par defaut
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {galleryImages.map((src, idx) => (
                                <div key={`${src}-${idx}`} className="relative group">
                                    <button
                                        type="button"
                                        className="block w-full"
                                        onClick={() => setLightboxIndex(idx)}
                                    >
                                        <div className="aspect-square overflow-hidden rounded-3xl border border-primary/10 bg-muted shadow-sm">
                                            <img
                                                src={src}
                                                alt={`Photo ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                    </button>
                                    {canEdit && editMode ? (
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="secondary"
                                            className="absolute top-3 right-3 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 shadow-lg"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                await removeGalleryImage(idx);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Dialog
                        open={lightboxIndex !== null}
                        onOpenChange={(open) => {
                            if (!open) setLightboxIndex(null);
                        }}
                    >
                        <DialogContent className="max-w-6xl p-0 overflow-hidden bg-black border-black">
                            {lightboxIndex !== null ? (
                                <div className="relative">
                                    <img
                                        src={galleryImages[lightboxIndex] || ""}
                                        alt=""
                                        className="w-full h-[80vh] object-contain bg-black"
                                    />
                                    {galleryImages.length > 1 ? (
                                        <div className="absolute left-4 top-4 flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    setLightboxIndex((idx) =>
                                                        idx === null
                                                            ? 0
                                                            : (idx - 1 + galleryImages.length) % galleryImages.length
                                                    )
                                                }
                                            >
                                                Precedent
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    setLightboxIndex((idx) =>
                                                        idx === null ? 0 : (idx + 1) % galleryImages.length
                                                    )
                                                }
                                            >
                                                Suivant
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </DialogContent>
                    </Dialog>
                </section>
            ) : null}

            {/* Location Section */}
            {showLocation ? (
                <section id="location" className="scroll-mt-24 py-24 px-6 bg-muted/20">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide">
                            <InlineEditor
                                value={locationTitle}
                                onSave={(val) => handleSaveText("locationTitle", val)}
                                canEdit={canEdit && editMode}
                                className="uppercase"
                            />
                        </h2>
                        <div className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            <InlineEditor
                                value={locationDescription}
                                onSave={(val) => handleSaveText("locationDescription", val)}
                                canEdit={canEdit && editMode}
                                isTextArea={true}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left">
                            {locationItems.map((item, idx) => (
                                <div key={`${item.title}-${idx}`} className="bg-white/80 border border-primary/10 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-serif font-semibold text-foreground mb-1">
                                        <InlineEditor
                                            value={item.title}
                                            onSave={(val) => updateLocationItem(idx, { title: val })}
                                            canEdit={canEdit && editMode}
                                            placeholder={`Lieu ${idx + 1}`}
                                        />
                                    </h3>
                                    {canEdit && editMode ? (
                                        <div className="mb-3">
                                            <InlineEditor
                                                value={item.address}
                                                onSave={(val) => updateLocationItem(idx, { address: val })}
                                                canEdit={canEdit && editMode}
                                                placeholder="Adresse"
                                            />
                                        </div>
                                    ) : item.address ? (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline mb-3 inline-block"
                                        >
                                            {item.address}
                                        </a>
                                    ) : null}
                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                        <InlineEditor
                                            value={item.description}
                                            onSave={(val) => updateLocationItem(idx, { description: val })}
                                            canEdit={canEdit && editMode}
                                            placeholder="Description"
                                            isTextArea
                                        />
                                    </div>
                                    {canEdit && editMode ? (
                                        <div className="pt-4">
                                            <Button type="button" variant="outline" size="sm" onClick={() => deleteLocationItem(idx)}>
                                                Supprimer
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                        {canEdit && editMode ? (
                            <div className="pt-6">
                                <Button type="button" variant="outline" onClick={addLocationItem}>
                                    Ajouter un lieu
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* Program Section */}
            {showProgram ? (
                <section id="program" className="scroll-mt-24 py-24 px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide">
                            <InlineEditor
                                value={programTitle}
                                onSave={(val) => handleSaveText("programTitle", val)}
                                canEdit={canEdit && editMode}
                                className="uppercase"
                            />
                        </h2>
                        <div className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            <InlineEditor
                                value={programDescription}
                                onSave={(val) => handleSaveText("programDescription", val)}
                                canEdit={canEdit && editMode}
                                isTextArea={true}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left">
                            {programItems.map((item, idx) => (
                                <div key={`${item.title}-${idx}`} className="border border-primary/10 rounded-2xl p-6">
                                    <div className="text-xs uppercase tracking-widest text-primary mb-2">
                                        <InlineEditor
                                            value={item.time}
                                            onSave={(val) => updateProgramItem(idx, { time: val })}
                                            canEdit={canEdit && editMode}
                                            placeholder="00:00"
                                        />
                                    </div>
                                    <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                                        <InlineEditor
                                            value={item.title}
                                            onSave={(val) => updateProgramItem(idx, { title: val })}
                                            canEdit={canEdit && editMode}
                                            placeholder={`Étape ${idx + 1}`}
                                        />
                                    </h3>
                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                        <InlineEditor
                                            value={item.description}
                                            onSave={(val) => updateProgramItem(idx, { description: val })}
                                            canEdit={canEdit && editMode}
                                            placeholder="Description"
                                            isTextArea
                                        />
                                    </div>
                                    {canEdit && editMode ? (
                                        <div className="pt-4">
                                            <Button type="button" variant="outline" size="sm" onClick={() => deleteProgramItem(idx)}>
                                                Supprimer
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                        {canEdit && editMode ? (
                            <div className="pt-6">
                                <Button type="button" variant="outline" onClick={addProgramItem}>
                                    Ajouter une étape
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
