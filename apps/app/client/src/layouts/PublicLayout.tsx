import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Wedding } from "@shared/schema";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateWedding } from "@/hooks/use-api";
import { PublicEditProvider } from "@/contexts/public-edit";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import { compressImageFileToJpegDataUrl } from "@/lib/image";
import { useToast } from "@/hooks/use-toast";

export function PublicLayout({ children, slug: slugProp }: { children: ReactNode; slug?: string }) {
    const params = useParams<{ slug: string }>();
    const slug = slugProp || params.slug;
    const isUuid = !!slug && /^[0-9a-fA-F-]{36}$/.test(slug);

    const { data: wedding, isLoading } = useQuery<Wedding>({
        queryKey: [`/api/weddings`, slug],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (slug) {
                if (isUuid) {
                    headers["x-wedding-id"] = slug;
                } else {
                    headers["x-wedding-slug"] = slug;
                }
            }
            const res = await fetch("/api/weddings", {
                headers,
                credentials: "include"
            });
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error("Failed to fetch wedding");
            }
            const weddings = await res.json();
            return Array.isArray(weddings) ? weddings[0] : weddings;
        },
        enabled: !!slug,
    });

    const updateWedding = useUpdateWedding();
    const { user } = useAuth();
    const { toast } = useToast();
    const [editMode, setEditModeState] = useState(false);
    const [draftBranding, setDraftBranding] = useState<{ logoUrl: string; logoText: string }>({ logoUrl: "", logoText: "" });
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem("libala_edit_mode") === "1";
        setEditModeState(stored);
    }, []);

    useEffect(() => {
        if (!wedding) return;
        setDraftBranding({
            logoUrl: wedding.config?.branding?.logoUrl || "",
            logoText: wedding.config?.branding?.logoText || wedding.title,
        });
    }, [wedding?.id, (wedding as any)?.updatedAt]);

    const setEditMode = useCallback((value: boolean) => {
        setEditModeState(value);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("libala_edit_mode", value ? "1" : "0");
        }
    }, []);

    const canEdit = !!(user && wedding && user.id === wedding.ownerId);
    const editValue = useMemo(() => ({ canEdit, editMode, setEditMode }), [canEdit, editMode, setEditMode]);

    if (typeof window !== "undefined" && slug && !isUuid) {
        window.localStorage.setItem("last_wedding_slug", slug);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!wedding) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Mariage introuvable</h1>
                <Link href="/" className="text-primary hover:underline">
                    Retour à l'accueil
                </Link>
            </div>
        );
    }

    const navigation = wedding.config?.navigation;
    const pageVisibility = {
        rsvp: navigation?.pages?.rsvp ?? true,
        cagnotte: navigation?.pages?.cagnotte ?? true,
        gifts: (navigation?.pages as any)?.gifts ?? true,
        live: (navigation?.pages?.live ?? true) && (wedding.config?.features?.liveEnabled ?? true),
        story: navigation?.pages?.story ?? true,
        gallery: navigation?.pages?.gallery ?? true,
        location: navigation?.pages?.location ?? true,
        program: navigation?.pages?.program ?? true,
    };

    const defaultMenuItems = [
        { id: "rsvp", label: wedding.config?.texts?.navRsvp || "RSVP", path: "rsvp", enabled: true },
        { id: "cagnotte", label: wedding.config?.texts?.navCagnotte || "Cagnotte", path: "cagnotte", enabled: true },
        { id: "gifts", label: "Cadeaux", path: "gifts", enabled: true },
        { id: "live", label: wedding.config?.texts?.navLive || "Live", path: "live", enabled: true },
        { id: "story", label: "Histoire", path: "story", enabled: true },
        { id: "gallery", label: "Photos", path: "gallery", enabled: true },
        { id: "location", label: "Lieux", path: "location", enabled: true },
        { id: "program", label: "Programme", path: "program", enabled: true },
    ];

    const resolveMenuHref = (path: string) => {
        if (path === "home") return `/`;
        return `/${path}`;
    };

    const mergedMenuItems = useMemo(() => {
        const incoming = (navigation?.menuItems || []) as Array<{ id: string } & Record<string, any>>;
        const mergedDefaults = defaultMenuItems.map((base) => {
            const found = incoming.find((item) => item.id === base.id);
            return found ? { ...base, ...found } : base;
        });
        const customIncoming = incoming.filter((item) => !defaultMenuItems.some((base) => base.id === item.id));
        return [...mergedDefaults, ...customIncoming];
    }, [navigation?.menuItems, defaultMenuItems]);

    const canonicalOrder = useMemo(
        () => ["rsvp", "gifts", "story", "gallery", "location", "program", "cagnotte", "live"] as const,
        []
    );

    const internalMenu = (mergedMenuItems.length ? mergedMenuItems : defaultMenuItems)
        .filter((item) => item.enabled)
        .filter((item) => {
            if (item.path === "rsvp") return pageVisibility.rsvp;
            if (item.path === "cagnotte") return pageVisibility.cagnotte;
            if (item.path === "gifts") return pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true);
            if (item.path === "live") return pageVisibility.live;
            if (item.path === "story") return pageVisibility.story;
            if (item.path === "gallery") return pageVisibility.gallery;
            if (item.path === "location") return pageVisibility.location;
            if (item.path === "program") return pageVisibility.program;
            return true;
        })
        .sort((a, b) => canonicalOrder.indexOf(a.path as any) - canonicalOrder.indexOf(b.path as any))
        .map((item) => ({
            id: item.id,
            label: item.label,
            path: item.path,
            href: resolveMenuHref(item.path),
        }));

    const customMenu = (navigation?.customPages || [])
        .filter((page) => page.enabled && page.showInMenu && page.slug)
        .map((page) => ({
            id: page.id,
            label: page.title,
            href: `/page/${page.slug}`,
        }));

    const sectionMenuItems = internalMenu.filter((item) => item.path !== "cagnotte" && item.path !== "live");
    const cagnotteItem = internalMenu.find((item) => item.path === "cagnotte");
    const liveItem = internalMenu.find((item) => item.path === "live");
    const templateId = wedding.templateId || "classic";
    const headerClass =
        templateId === "modern"
            ? "sticky top-0 z-50 w-full border-b border-[#CAD9F8] bg-[#F7FAFF]/95 backdrop-blur"
            : templateId === "minimal"
              ? "sticky top-0 z-50 w-full border-b border-[#D5DCE8] bg-[#F8FAFC]/96 backdrop-blur"
              : "sticky top-0 z-50 w-full border-b border-[#DCC9AB] bg-[#FFF9F1]/92 backdrop-blur";
    const navClass =
        templateId === "modern"
            ? "flex items-center space-x-6 text-sm font-semibold text-[#113366]"
            : templateId === "minimal"
              ? "flex items-center space-x-6 text-sm font-semibold uppercase tracking-[0.18em]"
              : "flex items-center space-x-6 text-sm font-medium";

    const siteTitle = wedding.config?.texts?.siteTitle || wedding.title;
    const headerLogoUrl = draftBranding.logoUrl || wedding.config?.branding?.logoUrl || "";
    const headerLogoText = draftBranding.logoText || wedding.config?.branding?.logoText || wedding.title;

    const saveBranding = async (patch: Partial<{ logoUrl: string; logoText: string }>) => {
        const nextBranding = {
            logoUrl: patch.logoUrl ?? draftBranding.logoUrl,
            logoText: patch.logoText ?? draftBranding.logoText,
        };
        setDraftBranding(nextBranding);
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    branding: {
                        ...(wedding.config?.branding || {}),
                        ...nextBranding,
                    },
                },
            });
        } catch {
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer le logo.",
                variant: "destructive",
            });
        }
    };

    const onLogoFileSelected = async (file: File) => {
        setIsUploadingLogo(true);
        try {
            const compressed = await compressImageFileToJpegDataUrl(file, {
                maxSize: 240,
                quality: 0.78,
                maxDataUrlLength: 220_000,
            });
            await saveBranding({ logoUrl: compressed });
        } catch (err: any) {
            const msg =
                String(err?.message) === "too_large"
                    ? "Logo trop lourd. Importez une image plus légère."
                    : "Impossible d'importer le logo.";
            toast({ title: "Erreur", description: msg, variant: "destructive" });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const saveSiteTitle = async (value: string) => {
        await updateWedding.mutateAsync({
            id: wedding.id,
            config: {
                ...wedding.config,
                texts: {
                    ...(wedding.config?.texts || {}),
                    siteTitle: value,
                },
            },
        });
    };

    const saveMenuLabel = async (menuId: string, value: string) => {
        const nextMenuItems = (wedding.config?.navigation?.menuItems || defaultMenuItems).map((item: any) =>
            item.id === menuId ? { ...item, label: value } : item
        );
        const nextTexts = { ...(wedding.config?.texts || {}) } as any;
        if (menuId === "rsvp") nextTexts.navRsvp = value;
        if (menuId === "cagnotte") nextTexts.navCagnotte = value;
        if (menuId === "live") nextTexts.navLive = value;

        await updateWedding.mutateAsync({
            id: wedding.id,
            config: {
                ...wedding.config,
                texts: nextTexts,
                navigation: {
                    ...(wedding.config?.navigation || {}),
                    menuItems: nextMenuItems,
                },
            },
        });
    };

    const saveCustomPageTitle = async (pageId: string, value: string) => {
        const nextCustomPages = (wedding.config?.navigation?.customPages || []).map((page: any) =>
            page.id === pageId ? { ...page, title: value } : page
        );
        await updateWedding.mutateAsync({
            id: wedding.id,
            config: {
                ...wedding.config,
                navigation: {
                    ...(wedding.config?.navigation || {}),
                    customPages: nextCustomPages,
                },
            },
        });
    };

    return (
        <ThemeProvider wedding={wedding}>
            <PublicEditProvider value={editValue}>
            <div className="flex flex-col min-h-screen">
                <header className={headerClass}>
                    <div className="container flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="flex items-center space-x-2"
                                onClick={(e) => {
                                    if (canEdit && editMode) e.preventDefault();
                                }}
                            >
                                {headerLogoUrl ? (
                                    <img
                                        src={headerLogoUrl}
                                        alt={headerLogoText || wedding.title}
                                        className="h-10 w-auto object-contain"
                                    />
                                ) : (
                                    <span className="text-xl font-bold tracking-tight">
                                        <InlineEditor
                                            value={siteTitle}
                                            onSave={saveSiteTitle}
                                            canEdit={canEdit && editMode}
                                            placeholder={wedding.title}
                                        />
                                    </span>
                                )}
                            </Link>

                            {canEdit && editMode ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            await onLogoFileSelected(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={isUploadingLogo}
                                    >
                                        {isUploadingLogo ? "Import..." : "Logo"}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => saveBranding({ logoUrl: "" })}
                                        disabled={!headerLogoUrl || isUploadingLogo}
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            ) : null}
                        </div>
	                        <div className="flex items-center gap-3">
	                            <nav className={navClass}>
	                                {[...sectionMenuItems, ...customMenu].map((item) => (
	                                    <Link
	                                        key={item.id}
	                                        href={item.href}
	                                        className="hover:text-primary transition-colors"
	                                        onClick={(e) => {
	                                            if (canEdit && editMode) e.preventDefault();
	                                        }}
	                                    >
	                                        {"path" in item ? (
	                                            <InlineEditor
	                                                value={item.label}
	                                                onSave={(val) => saveMenuLabel(item.id, val)}
	                                                canEdit={canEdit && editMode}
	                                                placeholder={item.label}
	                                            />
	                                        ) : (
	                                            <InlineEditor
	                                                value={item.label}
	                                                onSave={(val) => saveCustomPageTitle(item.id, val)}
	                                                canEdit={canEdit && editMode}
	                                                placeholder={item.label}
	                                            />
	                                        )}
	                                    </Link>
	                                ))}
	                            </nav>

	                            {/* One-page menu + primary CTA to open the donation flow */}
	                            {cagnotteItem ? (
	                                <Link href={cagnotteItem.href} onClick={(e) => (canEdit && editMode ? e.preventDefault() : undefined)}>
	                                    <Button size="sm" className="rounded-full px-5">
	                                        <InlineEditor
	                                            value={cagnotteItem.label}
	                                            onSave={(val) => saveMenuLabel(cagnotteItem.id, val)}
	                                            canEdit={canEdit && editMode}
	                                            placeholder={cagnotteItem.label}
	                                        />
	                                    </Button>
	                                </Link>
	                            ) : null}
	                            {liveItem ? (
	                                <Link href={liveItem.href} onClick={(e) => (canEdit && editMode ? e.preventDefault() : undefined)}>
	                                    <Button size="sm" variant="outline" className="rounded-full px-5">
	                                        <InlineEditor
	                                            value={liveItem.label}
	                                            onSave={(val) => saveMenuLabel(liveItem.id, val)}
	                                            canEdit={canEdit && editMode}
	                                            placeholder={liveItem.label}
	                                        />
	                                    </Button>
	                                </Link>
	                            ) : null}
	                        </div>
	                    </div>
	                </header>
                <main className="flex-1">{children}</main>
                <footer className="py-6 md:px-8 md:py-0 border-t">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            Fait avec amour sur <span className="font-bold">Libala</span>
                        </p>
                    </div>
                </footer>

                {canEdit ? (
                    <div className="fixed bottom-6 right-6 z-50 flex gap-2">
                        {editMode ? (
                            <div className="bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
                                <span className="text-sm font-medium">Mode Edition</span>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-2 rounded-full text-xs"
                                    onClick={() => setEditMode(false)}
                                >
                                    Terminer
                                </Button>
                            </div>
                        ) : (
                            <Button
                                className="rounded-full shadow-lg h-12 px-6 bg-primary/90 hover:bg-primary backdrop-blur-sm"
                                onClick={() => setEditMode(true)}
                            >
                                Modifier le site
                            </Button>
                        )}
                    </div>
                ) : null}
            </div>
            </PublicEditProvider>
        </ThemeProvider>
    );
}
