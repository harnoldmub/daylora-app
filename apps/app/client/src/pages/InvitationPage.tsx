import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Redirect, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type Gift as GiftDb } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { usePublicGifts, useWedding, useUpdateWedding } from "@/hooks/use-api";
import { usePublicEdit } from "@/contexts/public-edit";
import { compressImageFileToJpegDataUrl } from "@/lib/image";
import { TemplateRenderer } from "@/features/public-site/templates/TemplateRenderer";
import {
  Dialog,
  DialogContent,
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
  const params = useParams<{ slug: string }>();
  const [routePath, setLocation] = useLocation();
  const search = useSearch();
  const slug = params.slug || "";

  const { data: wedding, isLoading } = useWedding(slug || undefined);
  const updateWedding = useUpdateWedding();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canEdit, editMode } = usePublicEdit();
  const [ctaPath, setCtaPath] = useState("rsvp");
  const [draftMedia, setDraftMedia] = useState<{ heroImage: string; couplePhoto: string }>({ heroImage: "", couplePhoto: "" });
  const [isUploading, setIsUploading] = useState<{ heroImage: boolean; couplePhoto: boolean }>({ heroImage: false, couplePhoto: false });
  const [draftCagnotteExternalUrl, setDraftCagnotteExternalUrl] = useState("");

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

  const basePath = useMemo(() => {
    if (!slug) return "/";
    if (typeof window === "undefined") return `/${slug}`;
    const pathname = window.location.pathname || "";
    const previewPrefix = `/preview/${slug}`;
    return pathname.startsWith(previewPrefix) ? previewPrefix : `/${slug}`;
  }, [slug]);

  const resolveInternalHref = (path: string) => {
    const raw = String(path || "").trim();
    if (!raw) return basePath;
    if (/^https?:\/\//i.test(raw)) return raw;
    const normalized = normalizeCtaPath(raw);
    if (normalized === "home") return basePath;
    if (normalized.startsWith("page:")) return `${basePath}/page/${normalized.replace(/^page:/, "")}`;
    return `${basePath}/${normalized}`.replace(/\/+$/, "") || basePath;
  };

  const handleSaveText = async (key: string, value: string) => {
    if (!wedding) return;
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { texts: { [key]: value } } });
      toast({ title: "Modifications enregistrées" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
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
      toast({ title: "Erreur", description: "Impossible d'enregistrer le countdown.", variant: "destructive" });
    }
  };

  const updateMedia = async (key: "heroImage" | "couplePhoto", value: string) => {
    if (!wedding) return;
    setDraftMedia((prev) => ({ ...prev, [key]: value }));
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { media: { [key]: value } } });
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
      const msg = String(err?.message) === "too_large" ? "Image trop lourde. Importez une image plus légère." : "Impossible d'importer l'image.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
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
      toast({ title: "Erreur", description: "Impossible d'enregistrer le lieu.", variant: "destructive" });
    }
  };

  const deleteLocationItem = async (index: number) => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : DEFAULT_LOCATION_ITEMS) as LocationItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { locationItems: currentItems.filter((_, idx) => idx !== index) } } });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer le lieu.", variant: "destructive" });
    }
  };

  const addLocationItem = async () => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : DEFAULT_LOCATION_ITEMS) as LocationItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { locationItems: [...currentItems, { title: "Nouveau lieu", address: "", description: "" }] } } });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'ajouter le lieu.", variant: "destructive" });
    }
  };

  const updateProgramItem = async (index: number, patch: Partial<ProgramItem>) => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
    const nextItems = currentItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { programItems: nextItems } } });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer le déroulé.", variant: "destructive" });
    }
  };

  const deleteProgramItem = async (index: number) => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { programItems: currentItems.filter((_, idx) => idx !== index) } } });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer l'étape.", variant: "destructive" });
    }
  };

  const addProgramItem = async () => {
    if (!wedding) return;
    const currentItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { programItems: [...currentItems, { time: "12:00", title: "Nouvelle étape", description: "" }] } } });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'ajouter l'étape.", variant: "destructive" });
    }
  };

  const saveCtaPath = async (value: string) => {
    if (!wedding) return;
    const normalized = normalizeCtaPath(value);
    setCtaPath(normalized);
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { navigation: { heroCtaPath: normalized } as any } });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer l'action du bouton.", variant: "destructive" });
    }
  };

  const saveCagnotteExternalUrl = async (value: string) => {
    if (!wedding) return;
    const next = value.trim();
    setDraftCagnotteExternalUrl(next);
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { cagnotteExternalUrl: next } as any } });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer le lien de cagnotte.", variant: "destructive" });
    }
  };

  const saveGalleryImages = async (nextImages: string[]) => {
    if (!wedding) return;
    try {
      await updateWedding.mutateAsync({ id: wedding.id, config: { sections: { galleryImages: nextImages.slice(0, MAX_GALLERY_IMAGES) } } });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer la galerie.", variant: "destructive" });
    }
  };

  const onGalleryFilesSelected = async (files: FileList | null) => {
    if (!files || !wedding) return;
    const current = (wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : DEFAULT_GALLERY_IMAGES).slice(0, MAX_GALLERY_IMAGES);
    const remaining = Math.max(0, MAX_GALLERY_IMAGES - current.length);
    const batch = Array.from(files).slice(0, remaining);
    if (batch.length === 0) {
      toast({ title: "Galerie pleine", description: "Maximum 10 photos.", variant: "destructive" });
      return;
    }
    const next: string[] = [...current];
    for (const file of batch) {
      try {
        const compressed = await compressImageFileToJpegDataUrl(file, { maxSize: 1200, quality: 0.82, maxDataUrlLength: MAX_GALLERY_IMAGE_DATA_URL_LENGTH });
        next.push(compressed);
      } catch (err: any) {
        const msg = String(err?.message) === "too_large" ? "Une photo est trop lourde." : "Impossible d'importer une photo.";
        toast({ title: "Erreur", description: msg, variant: "destructive" });
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

  const handleHeroCtaClick = () => {
    if (!slug) return;
    if (canEdit && editMode) return;
    setLocation(resolveInternalHref(ctaPath || "rsvp"));
  };

  const showGifts = (((wedding?.config?.navigation?.pages as any)?.gifts ?? true) as boolean) && (wedding?.config?.features?.giftsEnabled ?? true);
  const { data: giftsData } = usePublicGifts(showGifts);
  const gifts: GiftDb[] = (giftsData || []) as GiftDb[];

  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [giftDeleteOpen, setGiftDeleteOpen] = useState(false);
  const [giftEditing, setGiftEditing] = useState<any | null>(null);
  const [giftDeleting, setGiftDeleting] = useState<any | null>(null);
  const [giftForm, setGiftForm] = useState<{ name: string; description: string; price: string; imageUrl: string }>({ name: "", description: "", price: "", imageUrl: "" });

  const openCreateGift = () => {
    setGiftEditing(null);
    setGiftForm({ name: "", description: "", price: "", imageUrl: "" });
    setGiftDialogOpen(true);
  };

  const openEditGift = (gift: any) => {
    setGiftEditing(gift);
    setGiftForm({ name: gift?.name || "", description: gift?.description || "", price: typeof gift?.price === "number" ? String(gift.price) : "", imageUrl: gift?.imageUrl || "" });
    setGiftDialogOpen(true);
  };

  const createGiftMutation = useMutation({
    mutationFn: async (payload: any) => { const res = await apiRequest("POST", "/api/gifts", payload); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gifts/public"] }); queryClient.invalidateQueries({ queryKey: ["/api/gifts"] }); toast({ title: "Cadeau enregistré" }); setGiftDialogOpen(false); },
    onError: (error: Error) => { toast({ title: "Erreur", description: error.message || "Impossible d'enregistrer le cadeau.", variant: "destructive" }); },
  });

  const updateGiftMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => { const res = await apiRequest("PATCH", `/api/gifts/${id}`, payload); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gifts/public"] }); queryClient.invalidateQueries({ queryKey: ["/api/gifts"] }); toast({ title: "Cadeau mis à jour" }); setGiftDialogOpen(false); },
    onError: (error: Error) => { toast({ title: "Erreur", description: error.message || "Impossible de modifier le cadeau.", variant: "destructive" }); },
  });

  const deleteGiftMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("DELETE", `/api/gifts/${id}`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gifts/public"] }); queryClient.invalidateQueries({ queryKey: ["/api/gifts"] }); toast({ title: "Cadeau supprimé" }); setGiftDeleteOpen(false); setGiftDeleting(null); },
    onError: (error: Error) => { toast({ title: "Erreur", description: error.message || "Impossible de supprimer le cadeau.", variant: "destructive" }); },
  });

  const submitGift = () => {
    const name = giftForm.name.trim();
    if (!name) { toast({ title: "Champ requis", description: "Le nom du cadeau est requis.", variant: "destructive" }); return; }
    const price = giftForm.price.trim() ? Number(giftForm.price.trim()) : null;
    const payload = { name, description: giftForm.description.trim() || null, imageUrl: giftForm.imageUrl || null, price: Number.isFinite(price as any) ? price : null };
    if (giftEditing?.id) updateGiftMutation.mutate({ id: giftEditing.id, payload });
    else createGiftMutation.mutate(payload);
  };

  const onGiftImageSelected = async (file: File) => {
    try {
      const compressed = await compressImageFileToJpegDataUrl(file, { maxSize: 1200, quality: 0.82, maxDataUrlLength: MAX_GIFT_IMAGE_DATA_URL_LENGTH });
      setGiftForm((prev) => ({ ...prev, imageUrl: compressed }));
    } catch (err: any) {
      const msg = String(err?.message) === "too_large" ? "Image trop lourde." : "Impossible d'importer l'image.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
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
      theme: { primaryColor: "#8C7A6B", secondaryColor: "#FBF8F3", fontFamily: "serif", toneId: "nocely-signature", buttonStyle: "solid", buttonRadius: "pill" },
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
        draftCagnotteExternalUrl={draftCagnotteExternalUrl}
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
        onCreateGift={openCreateGift}
        onEditGift={openEditGift}
        onDeleteGift={(gift) => { setGiftDeleting(gift); setGiftDeleteOpen(true); }}
        onSaveCagnotteExternalUrl={saveCagnotteExternalUrl}
        onSetDraftCagnotteExternalUrl={setDraftCagnotteExternalUrl}
        toDateInputValue={toDateInputValue}
        fromDateInputValue={fromDateInputValue}
      />

      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{giftEditing ? "Modifier le cadeau" : "Ajouter un cadeau"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nom *</label>
              <Input value={giftForm.name} onChange={(e) => setGiftForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom du cadeau" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
              <Input value={giftForm.description} onChange={(e) => setGiftForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optionnel)" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prix (€)</label>
              <Input value={giftForm.price} onChange={(e) => setGiftForm((f) => ({ ...f, price: e.target.value }))} placeholder="ex: 150" type="number" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Image</label>
              {giftForm.imageUrl && <img src={giftForm.imageUrl} alt="" className="h-24 w-full object-cover rounded-xl mb-2" />}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onGiftImageSelected(f); e.target.value = ""; }} />
            </div>
            <Button className="w-full" onClick={submitGift} disabled={createGiftMutation.isPending || updateGiftMutation.isPending}>
              {(createGiftMutation.isPending || updateGiftMutation.isPending) ? "Enregistrement..." : (giftEditing ? "Modifier" : "Ajouter")}
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
