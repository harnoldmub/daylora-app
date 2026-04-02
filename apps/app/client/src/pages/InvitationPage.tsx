import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Redirect, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Gift as GiftDb } from "@shared/schema";
import { Gift, Edit, Loader2, Link as LinkIcon, ExternalLink, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { usePublicGifts, useWedding, useUpdateWedding } from "@/hooks/use-api";
import { usePublicEdit } from "@/contexts/public-edit";
import { compressImageFileToJpegDataUrl } from "@/lib/image";
import { TemplateRenderer } from "@/features/public-site/templates/TemplateRenderer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LocationItem, ProgramItem } from "@/features/public-site/types";

const FAKE_DATA = {
  title: "Famille Lawson",
  date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  heroImage: "/defaults/lawson_couple.png",
  couplePhoto: "/defaults/lawson_reception.png",
  story: "Bienvenue sur le site de notre mariage.",
};

const DEFAULT_LOCATION_ITEMS: LocationItem[] = [
  { title: "Cérémonie civile", address: "Mairie de Lille — 10 Rue Pierre Mauroy", description: "Rendez-vous à 14h30 pour accueillir les invités." },
  { title: "Réception", address: "Château de la Verrière — Salle des Roses", description: "Cocktail et dîner à partir de 18h." },
];

const DEFAULT_PROGRAM_ITEMS: ProgramItem[] = [
  { time: "14:30", title: "Accueil des invités", description: "Installation et photos de famille." },
  { time: "15:00", title: "Cérémonie", description: "Échange des vœux et sortie des mariés." },
  { time: "18:30", title: "Cocktail & Dîner", description: "Apéritif, repas et animations." },
];

const DEFAULT_GALLERY_IMAGES = [
  "/defaults/gallery/01.jpg", "/defaults/gallery/02.jpg", "/defaults/gallery/03.jpg",
  "/defaults/gallery/04.jpg", "/defaults/gallery/05.jpg", "/defaults/gallery/06.jpg",
];

const MAX_HERO_IMAGE_DATA_URL_LENGTH = 2_800_000;
const MAX_COUPLE_IMAGE_DATA_URL_LENGTH = 2_000_000;
const MAX_GALLERY_IMAGE_DATA_URL_LENGTH = 1_200_000;
const MAX_GALLERY_IMAGES = 10;
const MAX_GIFT_IMAGE_DATA_URL_LENGTH = 900_000;

export default function InvitationPage() {
  const params = useParams();
  const [routePath, setLocation] = useLocation();
  const search = useSearch();
  const slug = (params as any).slug || (params as any).weddingId || "";

  const { data: wedding, isLoading } = useWedding(slug || undefined);
  const updateWedding = useUpdateWedding();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canEdit, editMode } = usePublicEdit();
  const [ctaPath, setCtaPath] = useState("rsvp");
  const [draftMedia, setDraftMedia] = useState<{ heroImage: string; couplePhoto: string }>({ heroImage: "", couplePhoto: "" });
  const [isUploading, setIsUploading] = useState<{ heroImage: boolean; couplePhoto: boolean }>({ heroImage: false, couplePhoto: false });

  useEffect(() => {
    if (!wedding) return;
    setCtaPath(normalizeCtaPath(wedding.config?.navigation?.heroCtaPath || "rsvp"));
    setDraftMedia({
      heroImage: wedding.config?.media?.heroImage || "",
      couplePhoto: wedding.config?.media?.couplePhoto || "",
    });
  }, [wedding?.id, (wedding as any)?.updatedAt]);

  useEffect(() => {
    if (!wedding) return;
    setDraftCagnotteExternalUrl(((wedding.config?.sections as any)?.cagnotteExternalUrl || "") as string);
  }, [wedding?.id, (wedding as any)?.updatedAt]);

  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const routeSection = useMemo(() => routePath.replace(/^\//, "").trim(), [routePath]);
  const requestedSection = useMemo(() => {
    const fromQuery = (queryParams.get("section") || "").trim();
    const fromRoute = routeSection;
    return (fromQuery || fromRoute) || null;
  }, [queryParams, routeSection]);

  const SECTION_IDS = useMemo(() => ["rsvp", "gifts", "cagnotte", "story", "gallery", "location", "program"] as const, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hashSection = (window.location.hash || "").replace(/^#/, "").trim();
    if (hashSection && SECTION_IDS.includes(hashSection as any)) {
      setTimeout(() => {
        document.getElementById(hashSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return;
    }
    if (!requestedSection) return;
    if (!SECTION_IDS.includes(requestedSection as any)) return;
    setTimeout(() => {
      document.getElementById(requestedSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [requestedSection, SECTION_IDS, wedding?.id]);

  const normalizeCtaPath = (value: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "rsvp";
    let v = raw.replace(/^https?:\/\/[^/]+/i, "");
    v = v.replace(/^\/+/, "");
    if (slug) {
      const previewPrefix = `preview/${slug}/`;
      const slugPrefix = `${slug}/`;
      while (v.startsWith(previewPrefix)) v = v.slice(previewPrefix.length);
      while (v.startsWith(slugPrefix)) v = v.slice(slugPrefix.length);
    }
    return v || "rsvp";
  };

  const basePath = "";

  const resolveInternalHref = (path: string) => {
    const raw = String(path || "").trim();
    if (!raw) return "/";
    if (/^https?:\/\//i.test(raw)) return raw;
    const normalized = normalizeCtaPath(raw);
    if (normalized === "home") return "/";
    if (normalized.startsWith("page:")) return `/page/${normalized.replace(/^page:/, "")}`;
    return `/${normalized}`;
  };

  const handleSaveText = async (key: string, value: string) => {
    if (!wedding) return;
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { texts: { [key]: value } } });
      toast({ title: "Modifications enregistrées ✓" });
    } catch {
      toast({ title: "Sauvegarde impossible", description: "Vos modifications n'ont pas pu être enregistrées. Veuillez réessayer.", variant: "destructive" });
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
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { countdownDate: value } } });
    } catch {
      toast({ title: "Sauvegarde impossible", description: "La date du compte à rebours n'a pas pu être enregistrée. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const updateMedia = async (key: "heroImage" | "couplePhoto", value: string) => {
    if (!wedding) return;
    setDraftMedia((prev) => ({ ...prev, [key]: value }));
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { media: { [key]: value } } });
    } catch {
      toast({ title: "Sauvegarde impossible", description: "L'image n'a pas pu être enregistrée. Veuillez réessayer.", variant: "destructive" });
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
      const msg = String(err?.message) === "too_large" ? "Cette image est trop volumineuse. Essayez avec une image plus légère (max 2 Mo recommandé)." : "L'image n'a pas pu être importée. Vérifiez le format (JPG, PNG) et réessayez.";
      toast({ title: "Import impossible", description: msg, variant: "destructive" });
    } finally {
      setIsUploading((prev) => ({ ...prev, [key]: false }));
      event.target.value = "";
    }
  };

  const updateLocationItem = async (index: number, patch: Partial<LocationItem>) => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : DEFAULT_LOCATION_ITEMS) as LocationItem[];
    const nextItems = currentItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { locationItems: nextItems } } });
    } catch {
      toast({ title: "Sauvegarde impossible", description: "Le lieu n'a pas pu être enregistré. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const deleteLocationItem = async (index: number) => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : DEFAULT_LOCATION_ITEMS) as LocationItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { locationItems: currentItems.filter((_, idx) => idx !== index) } } });
    } catch {
      toast({ title: "Suppression impossible", description: "Le lieu n'a pas pu être supprimé. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const addLocationItem = async () => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : DEFAULT_LOCATION_ITEMS) as LocationItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { locationItems: [...currentItems, { title: "Nouveau lieu", address: "", description: "" }] } } });
    } catch {
      toast({ title: "Ajout impossible", description: "Le lieu n'a pas pu être ajouté. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const updateProgramItem = async (index: number, patch: Partial<ProgramItem>) => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
    const nextItems = currentItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { programItems: nextItems } } });
    } catch {
      toast({ title: "Sauvegarde impossible", description: "Le programme n'a pas pu être enregistré. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const deleteProgramItem = async (index: number) => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { programItems: currentItems.filter((_, idx) => idx !== index) } } });
    } catch {
      toast({ title: "Suppression impossible", description: "L'étape n'a pas pu être supprimée. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const addProgramItem = async () => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { programItems: [...currentItems, { time: "12:00", title: "Nouvelle étape", description: "" }] } } });
    } catch {
      toast({ title: "Ajout impossible", description: "L'étape n'a pas pu être ajoutée. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const saveCtaPath = async (value: string) => {
    if (!wedding) return;
    const normalized = normalizeCtaPath(value);
    setCtaPath(normalized);
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { navigation: { heroCtaPath: normalized } as any } });
    } catch {
      toast({ title: "Sauvegarde impossible", description: "L'action du bouton n'a pas pu être enregistrée. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const saveGalleryImages = async (nextImages: string[]) => {
    if (!wedding) return;
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { galleryImages: nextImages.slice(0, MAX_GALLERY_IMAGES) } } });
    } catch {
      toast({ title: "Sauvegarde impossible", description: "La galerie n'a pas pu être enregistrée. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const onGalleryFilesSelected = async (files: FileList | null) => {
    if (!files || !wedding) return;
    const current = (wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : DEFAULT_GALLERY_IMAGES).slice(0, MAX_GALLERY_IMAGES);
    const remaining = Math.max(0, MAX_GALLERY_IMAGES - current.length);
    const batch = Array.from(files).slice(0, remaining);
    if (batch.length === 0) {
      toast({ title: "Galerie complète", description: "Vous avez atteint la limite de 10 photos. Supprimez une photo existante pour en ajouter une nouvelle.", variant: "destructive" });
      return;
    }
    const next: string[] = [...current];
    for (const file of batch) {
      try {
        const compressed = await compressImageFileToJpegDataUrl(file, { maxSize: 1200, quality: 0.82, maxDataUrlLength: MAX_GALLERY_IMAGE_DATA_URL_LENGTH });
        next.push(compressed);
      } catch (err: any) {
        const msg = String(err?.message) === "too_large" ? "Cette photo est trop volumineuse. Essayez avec une image plus légère." : "Cette photo n'a pas pu être importée. Vérifiez le format et réessayez.";
        toast({ title: "Import impossible", description: msg, variant: "destructive" });
      }
    }
    await saveGalleryImages(next);
  };

  const removeGalleryImage = async (index: number) => {
    if (!wedding) return;
    const current = (wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : DEFAULT_GALLERY_IMAGES).slice(0, MAX_GALLERY_IMAGES);
    await saveGalleryImages(current.filter((_img, idx) => idx !== index));
  };

  const resetGallery = async () => {
    await saveGalleryImages([...DEFAULT_GALLERY_IMAGES]);
  };

  const setMainGalleryImage = async (index: number) => {
    if (!wedding) return;
    const current = (wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : DEFAULT_GALLERY_IMAGES).slice(0, MAX_GALLERY_IMAGES);
    if (index <= 0 || index >= current.length) return;
    const next = [...current];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    await saveGalleryImages(next);
  };

  const handleHeroCtaClick = () => {
    if (!slug) return;
    if (canEdit && editMode) return;
    const target = ctaPath || "rsvp";
    if (/^https?:\/\//i.test(target)) {
      window.open(target, "_blank", "noopener");
      return;
    }
    const anchor = target.replace(/^#/, "");
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = anchor;
    }
  };

  const showGifts = (((wedding?.config?.navigation?.pages as any)?.gifts ?? true) as boolean) && (wedding?.config?.features?.giftsEnabled ?? true);
  const { data: giftsData } = usePublicGifts(showGifts);
  const gifts: GiftDb[] = (giftsData || []) as GiftDb[];

  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [giftDeleteOpen, setGiftDeleteOpen] = useState(false);
  const [giftEditing, setGiftEditing] = useState<any | null>(null);
  const [giftDeleting, setGiftDeleting] = useState<any | null>(null);
  const [giftForm, setGiftForm] = useState<{ name: string; description: string; price: string; imageUrl: string; sourceUrl: string }>({ name: "", description: "", price: "", imageUrl: "", sourceUrl: "" });
  const [giftScraping, setGiftScraping] = useState(false);

  const openCreateGift = () => {
    setGiftEditing(null);
    setGiftForm({ name: "", description: "", price: "", imageUrl: "", sourceUrl: "" });
    setGiftDialogOpen(true);
  };

  const openEditGift = (gift: any) => {
    setGiftEditing(gift);
    setGiftForm({ name: gift?.name || "", description: gift?.description || "", price: typeof gift?.price === "number" ? String(gift.price) : "", imageUrl: gift?.imageUrl || "", sourceUrl: gift?.sourceUrl || "" });
    setGiftDialogOpen(true);
  };

  const scrapeGiftUrl = async (url: string) => {
    if (!url.trim()) return;
    setGiftScraping(true);
    try {
      const response = await apiRequest("POST", "/api/gifts/scrape-url", { url: url.trim() });
      const data = await response.json();
      setGiftForm((prev) => ({
        ...prev,
        name: prev.name || data.title || "",
        imageUrl: data.image || prev.imageUrl || "",
        description: prev.description || data.description || "",
        price: prev.price || (data.price ? String(data.price) : ""),
      }));
      toast({ title: "Informations récupérées" });
    } catch {
      toast({ title: "Récupération impossible", description: "Les informations du lien n'ont pas pu être récupérées. Vous pouvez remplir les champs manuellement.", variant: "destructive" });
    } finally {
      setGiftScraping(false);
    }
  };

  const createGiftMutation = useMutation({
    mutationFn: async (payload: any) => { const res = await apiRequest("POST", "/api/gifts", payload); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gifts/public"] }); queryClient.invalidateQueries({ queryKey: ["/api/gifts"] }); toast({ title: "Cadeau ajouté avec succès ✓" }); setGiftDialogOpen(false); },
    onError: (error: Error) => { toast({ title: "Enregistrement impossible", description: error.message || "Le cadeau n'a pas pu être enregistré. Veuillez réessayer.", variant: "destructive" }); },
  });

  const updateGiftMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => { const res = await apiRequest("PATCH", `/api/gifts/${id}`, payload); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gifts/public"] }); queryClient.invalidateQueries({ queryKey: ["/api/gifts"] }); toast({ title: "Cadeau mis à jour ✓" }); setGiftDialogOpen(false); },
    onError: (error: Error) => { toast({ title: "Modification impossible", description: error.message || "Le cadeau n'a pas pu être modifié. Veuillez réessayer.", variant: "destructive" }); },
  });

  const deleteGiftMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("DELETE", `/api/gifts/${id}`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gifts/public"] }); queryClient.invalidateQueries({ queryKey: ["/api/gifts"] }); toast({ title: "Cadeau supprimé ✓" }); setGiftDeleteOpen(false); setGiftDeleting(null); },
    onError: (error: Error) => { toast({ title: "Suppression impossible", description: error.message || "Le cadeau n'a pas pu être supprimé. Veuillez réessayer.", variant: "destructive" }); },
  });

  const handleReserveGift = async (giftId: number, guestName: string) => {
    const res = await apiRequest("POST", `/api/gifts/${giftId}/reserve`, { guestName });
    if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.message || "La réservation n'a pas pu être effectuée. Veuillez réessayer."); }
    queryClient.invalidateQueries({ queryKey: ["/api/gifts/public"] });
    queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
    toast({ title: "Cadeau réservé ✓", description: `Merci ${guestName} ! Votre réservation a bien été enregistrée.` });
  };

  const submitGift = () => {
    const name = giftForm.name.trim();
    if (!name) { toast({ title: "Information manquante", description: "Veuillez saisir le nom du cadeau pour continuer.", variant: "destructive" }); return; }
    const price = giftForm.price.trim() ? Number(giftForm.price.trim()) : null;
    const payload = { name, description: giftForm.description.trim() || null, imageUrl: giftForm.imageUrl || null, sourceUrl: giftForm.sourceUrl.trim() || null, price: Number.isFinite(price as any) ? price : null };
    if (giftEditing?.id) updateGiftMutation.mutate({ id: giftEditing.id, payload });
    else createGiftMutation.mutate(payload);
  };

  const onGiftImageSelected = async (file: File) => {
    try {
      const compressed = await compressImageFileToJpegDataUrl(file, { maxSize: 1200, quality: 0.82, maxDataUrlLength: MAX_GIFT_IMAGE_DATA_URL_LENGTH });
      setGiftForm((prev) => ({ ...prev, imageUrl: compressed }));
    } catch (err: any) {
      const msg = String(err?.message) === "too_large" ? "Cette image est trop volumineuse. Essayez avec une image plus légère." : "L'image n'a pas pu être importée. Vérifiez le format et réessayez.";
      toast({ title: "Import impossible", description: msg, variant: "destructive" });
    }
  };

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
      theme: { primaryColor: "#8C7A6B", secondaryColor: "#FBF8F3", fontFamily: "serif", toneId: "daylora-signature", buttonStyle: "solid", buttonRadius: "pill" },
    },
  } as any;

  if (currentWedding.templateId === "heritage") {
    return <Redirect to={`/invitation/${currentWedding.id}`} />;
  }

  const showRsvp = currentWedding.config?.navigation?.pages?.rsvp ?? true;
  const showStory = currentWedding.config?.navigation?.pages?.story ?? true;
  const showGalleryPage = currentWedding.config?.navigation?.pages?.gallery ?? true;
  const showLocation = currentWedding.config?.navigation?.pages?.location ?? true;
  const showProgram = currentWedding.config?.navigation?.pages?.program ?? true;

  if (
    (requestedSection === "rsvp" && !showRsvp) ||
    (requestedSection === "story" && !showStory) ||
    (requestedSection === "gallery" && !showGalleryPage) ||
    (requestedSection === "gifts" && !showGifts) ||
    (requestedSection === "location" && !showLocation) ||
    (requestedSection === "program" && !showProgram)
  ) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground mb-2">Page désactivée</div>
          <p className="text-sm text-muted-foreground mb-6">Cette page a été masquée dans la configuration du site.</p>
          <Button onClick={() => setLocation(basePath)} variant="outline">Retour au site</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TemplateRenderer
        wedding={currentWedding}
        draftMedia={draftMedia}
        isUploading={isUploading}
        ctaPath={ctaPath}
        gifts={gifts}
        slug={slug}
        basePath={basePath}
        onSaveText={handleSaveText}
        onHeroCtaClick={handleHeroCtaClick}
        onMediaUpload={handleMediaUpload}
        onUpdateMedia={updateMedia}
        onSaveCountdownDate={saveCountdownDate}
        onSaveCtaPath={saveCtaPath}
        onUpdateLocationItem={updateLocationItem}
        onDeleteLocationItem={deleteLocationItem}
        onAddLocationItem={addLocationItem}
        onUpdateProgramItem={updateProgramItem}
        onDeleteProgramItem={deleteProgramItem}
        onAddProgramItem={addProgramItem}
        onGalleryFilesSelected={onGalleryFilesSelected}
        onRemoveGalleryImage={removeGalleryImage}
        onResetGallery={resetGallery}
        onSetMainGalleryImage={setMainGalleryImage}
        onCreateGift={openCreateGift}
        onEditGift={openEditGift}
        onDeleteGift={(gift) => { setGiftDeleting(gift); setGiftDeleteOpen(true); }}
        onReserveGift={handleReserveGift}
        toDateInputValue={toDateInputValue}
        fromDateInputValue={fromDateInputValue}
      />

      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-b from-amber-50/60 to-transparent">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                {giftEditing ? <Edit className="h-6 w-6 text-amber-600" /> : <Gift className="h-6 w-6 text-amber-600" />}
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">{giftEditing ? "Modifier le cadeau" : "Ajouter un cadeau"}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Lien du produit</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.amazon.fr/..."
                  value={giftForm.sourceUrl}
                  onChange={(e) => setGiftForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={!giftForm.sourceUrl.trim() || giftScraping}
                  onClick={() => scrapeGiftUrl(giftForm.sourceUrl)}
                >
                  {giftScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Collez un lien et le nom et l'image seront importés automatiquement</p>
            </div>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-muted-foreground">ou remplir manuellement</span></div>
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input placeholder="Ex : Voyage de noces à Bali" value={giftForm.name} onChange={(e) => setGiftForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prix (€)</Label>
              <Input placeholder="ex: 150" value={giftForm.price} onChange={(e) => setGiftForm((f) => ({ ...f, price: e.target.value }))} type="number" />
              <p className="text-[11px] text-muted-foreground">Laissez vide pour un montant libre</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Image</Label>
              {giftForm.imageUrl && <img src={giftForm.imageUrl} alt="" className="h-24 w-24 object-cover rounded-lg border mb-2" />}
              <input type="file" accept="image/*" className="text-sm" onChange={(e) => { const f = e.target.files?.[0]; if (f) onGiftImageSelected(f); e.target.value = ""; }} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="Décrivez ce cadeau pour vos invités..." value={giftForm.description} onChange={(e) => setGiftForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGiftDialogOpen(false)}>Annuler</Button>
            <Button onClick={submitGift} disabled={createGiftMutation.isPending || updateGiftMutation.isPending}>
              {(createGiftMutation.isPending || updateGiftMutation.isPending) ? "Enregistrement..." : (giftEditing ? "Enregistrer" : "Ajouter à ma liste")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={giftDeleteOpen} onOpenChange={setGiftDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le cadeau ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Le cadeau "{giftDeleting?.name}" sera supprimé définitivement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => giftDeleting?.id && deleteGiftMutation.mutate(giftDeleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteGiftMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
