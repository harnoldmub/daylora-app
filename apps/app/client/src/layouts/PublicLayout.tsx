import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Wedding } from "@shared/schema";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Loader2, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateWedding } from "@/hooks/use-api";
import { PublicEditProvider } from "@/contexts/public-edit";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import { compressImageFileToJpegDataUrl } from "@/lib/image";
import { useToast } from "@/hooks/use-toast";
import { GuidedTour, useShouldShowTour } from "@/components/guided-tour";
import { getLogoTextClassName, getLogoTextWrapperClassName } from "@/lib/logo-styles";
import { getSiteLanguagePack } from "@/lib/site-language";

function EditModeTooltip() {
    const [visible, setVisible] = useState(() => {
        if (typeof window === "undefined") return false;
        return !window.localStorage.getItem("daylora_edit_tooltip_seen");
    });

    useEffect(() => {
        if (!visible) return;
        const handleClick = () => {
            setVisible(false);
            window.localStorage.setItem("daylora_edit_tooltip_seen", "1");
        };
        window.addEventListener("click", handleClick, { once: true });
        const timer = setTimeout(() => {
            setVisible(false);
            window.localStorage.setItem("daylora_edit_tooltip_seen", "1");
        }, 8000);
        return () => { window.removeEventListener("click", handleClick); clearTimeout(timer); };
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="bg-foreground/90 text-white text-[11px] px-3 py-1.5 rounded-full shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap">
            Cliquez pour modifier
        </div>
    );
}

export function PublicLayout({ children, slug: slugProp, isPreview: isPreviewProp }: { children: ReactNode; slug?: string; isPreview?: boolean }) {
    const params = useParams();
    const [routePath] = useLocation();
    const slug = slugProp || (params as any).slug || (params as any).weddingId || "";
    const isUuid = !!slug && /^[0-9a-fA-F-]{36}$/.test(slug);
    const isPreviewRoute = isPreviewProp ?? false;
    const [marketingBaseUrl, setMarketingBaseUrl] = useState<string>("");

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
            if (isPreviewRoute) {
                headers["x-preview-mode"] = "true";
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
    const [draftBranding, setDraftBranding] = useState<{ logoUrl: string; logoText: string; logoTextStyle?: string }>({ logoUrl: "", logoText: "", logoTextStyle: "elegant" });
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const storedRaw =
            window.localStorage.getItem("daylora_edit_mode") ??
            window.localStorage.getItem("libala_edit_mode");
        const stored = storedRaw === "1";
        setEditModeState(stored);
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/site-config")
            .then((r) => (r.ok ? r.json() : null))
            .then((cfg) => {
                if (cancelled) return;
                const next = String(cfg?.marketingBaseUrl || "").trim();
                if (next) setMarketingBaseUrl(next);
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!wedding) return;
        setDraftBranding({
            logoUrl: wedding.config?.branding?.logoUrl || "",
            logoText: wedding.config?.branding?.logoText || wedding.title,
            logoTextStyle: (wedding.config?.branding as any)?.logoTextStyle || "elegant",
        });
        const weddingTitle = wedding.config?.texts?.heroTitle || wedding.title;
        document.title = weddingTitle ? `${weddingTitle} — Daylora` : "Daylora";
        return () => { document.title = "Daylora — Créez votre site de mariage"; };
    }, [wedding?.id, (wedding as any)?.updatedAt]);

    const setEditMode = useCallback((value: boolean) => {
        setEditModeState(value);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("daylora_edit_mode", value ? "1" : "0");
            window.localStorage.removeItem("libala_edit_mode");
        }
    }, []);

    // Edits must happen in preview mode only (prevents accidental edits on the live public URL).
    const canEdit = !!(isPreviewRoute && user && wedding && user.id === wedding.ownerId);
    const editValue = useMemo(() => ({ canEdit, editMode, setEditMode }), [canEdit, editMode, setEditMode]);


    const navigation = wedding?.config?.navigation;
    const basePath = useMemo(() => {
        if (!slug) return "/";
        const previewPrefix = `/preview/${slug}`;
        return routePath.startsWith(previewPrefix) ? previewPrefix : `/${slug}`;
    }, [routePath, slug]);

    const shouldShowHeader = useMemo(() => {
        if (wedding?.templateId === "avantgarde" || wedding?.templateId === "modern") return false;
        // Header is only for the one-page landing (sections).
        const withoutBase = routePath.startsWith(basePath) ? routePath.slice(basePath.length) : routePath;
        const sub = (withoutBase || "").replace(/^\//, "");
        if (!sub) return true;
        const onePageSections = new Set(["rsvp", "gifts", "cagnotte", "story", "gallery", "accommodation", "location", "program"]);
        return onePageSections.has(sub);
    }, [routePath, basePath, wedding?.templateId]);

    const shouldShowFooter = useMemo(() => {
        if (wedding?.templateId === "avantgarde" || wedding?.templateId === "modern") return false;
        // Footer is part of the one-page experience: show it on home and section routes.
        const withoutBase = routePath.startsWith(basePath) ? routePath.slice(basePath.length) : routePath;
        const sub = (withoutBase || "").replace(/^\//, "");
        if (!sub) return true;
        const onePageSections = new Set(["rsvp", "gifts", "cagnotte", "story", "gallery", "accommodation", "location", "program"]);
        return onePageSections.has(sub);
    }, [routePath, basePath, wedding?.templateId]);
    const isHome = shouldShowFooter;
    const languagePack = getSiteLanguagePack((wedding?.config as any)?.language);
    const pageVisibility = useMemo(() => ({
        rsvp: navigation?.pages?.rsvp ?? true,
        cagnotte: navigation?.pages?.cagnotte ?? true,
        gifts: (navigation?.pages as any)?.gifts ?? true,
        story: navigation?.pages?.story ?? true,
        gallery: navigation?.pages?.gallery ?? true,
        accommodation: (navigation?.pages as any)?.accommodation ?? true,
        location: navigation?.pages?.location ?? true,
        program: navigation?.pages?.program ?? true,
    }), [navigation?.pages]);

    const defaultMenuItems = useMemo(() => [
        { id: "home", label: languagePack.menuLabels.home, path: "home", enabled: true, linkType: "anchor", anchorId: "hero", externalUrl: "" },
        { id: "rsvp", label: wedding?.config?.texts?.navRsvp || languagePack.texts.navRsvp, path: "rsvp", enabled: true, linkType: "anchor", anchorId: "rsvp", externalUrl: "" },
        { id: "cagnotte", label: wedding?.config?.texts?.navCagnotte || languagePack.texts.navCagnotte, path: "cagnotte", enabled: true, linkType: "anchor", anchorId: "cagnotte", externalUrl: "" },
        { id: "gifts", label: languagePack.menuLabels.gifts, path: "gifts", enabled: true, linkType: "anchor", anchorId: "gifts", externalUrl: "" },
        { id: "story", label: languagePack.menuLabels.story, path: "story", enabled: true, linkType: "anchor", anchorId: "story", externalUrl: "" },
        { id: "gallery", label: languagePack.menuLabels.gallery, path: "gallery", enabled: true, linkType: "anchor", anchorId: "gallery", externalUrl: "" },
        { id: "accommodation", label: languagePack.menuLabels.accommodation, path: "accommodation", enabled: true, linkType: "anchor", anchorId: "accommodation", externalUrl: "" },
        { id: "location", label: languagePack.menuLabels.location, path: "location", enabled: true, linkType: "anchor", anchorId: "location", externalUrl: "" },
        { id: "program", label: languagePack.menuLabels.program, path: "program", enabled: true, linkType: "anchor", anchorId: "program", externalUrl: "" },
    ], [wedding?.config?.texts, languagePack]);

    const mergedMenuItems = useMemo(() => {
        const incoming = (navigation?.menuItems || []) as Array<{ id: string } & Record<string, any>>;
        const baseById = new Map(defaultMenuItems.map((m) => [m.id, m]));

        // Preserve incoming order (user-controlled) and append missing defaults.
        const merged = incoming.filter((item) => item.id !== "live").map((item) => {
            const base = baseById.get(item.id);
            return base ? { ...base, ...item } : item;
        });

        const mergedIds = new Set(merged.map((m) => m.id));
        defaultMenuItems.forEach((base) => {
            if (!mergedIds.has(base.id)) merged.push(base);
        });

        // "Accueil" must always be first.
        const home = merged.find((m) => m.id === "home");
        const withoutHome = merged.filter((m) => m.id !== "home");
        return home ? [home, ...withoutHome] : merged;
    }, [navigation?.menuItems, defaultMenuItems]);

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

    const isOwner = !!(user && wedding && user.id === wedding.ownerId);
    const showNotFound = !wedding || (!wedding.isPublished && !isPreviewRoute && !isOwner);

    if (showNotFound) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F2ED]">
                <h1 className="text-2xl font-bold mb-2 text-[#2b2320]">Mariage introuvable</h1>
                <p className="text-sm text-[#7A6B5E] mb-6">Ce site n'existe pas ou n'est pas encore publié.</p>
                <a href="https://daylora.app" className="text-primary hover:underline text-sm">
                    Découvrir Daylora
                </a>
            </div>
        );
    }

    const resolveMenuHref = (item: any) => {
        const linkType = item?.linkType || "anchor";
        const path = String(item?.path || "");
        if (linkType === "external") {
            const url = String(item?.externalUrl || "").trim();
            return url || `${basePath}#hero`;
        }
        const anchor = String(item?.anchorId || (path === "home" ? "hero" : path)).trim() || "hero";
        return `${basePath}#${anchor}`;
    };

    const internalMenu = (mergedMenuItems.length ? mergedMenuItems : defaultMenuItems)
        .filter((item) => item.enabled)
        .filter((item) => {
            if (item.path === "home") return true;
            if (item.path === "rsvp") return pageVisibility.rsvp;
            if (item.path === "cagnotte") return pageVisibility.cagnotte;
            if (item.path === "gifts") return pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true);
            if (item.path === "story") return pageVisibility.story;
            if (item.path === "gallery") return pageVisibility.gallery;
            if (item.path === "accommodation") return pageVisibility.accommodation && (((wedding.config?.sections as any)?.accommodationItems?.length ?? 0) > 0);
            if (item.path === "location") return pageVisibility.location;
            if (item.path === "program") return pageVisibility.program;
            return true;
        })
        .map((item) => ({
            id: item.id,
            label: item.label,
            path: item.path,
            linkType: item.linkType || "anchor",
            externalUrl: item.externalUrl || "",
            anchorId: item.anchorId || (item.path === "home" ? "hero" : item.path),
            href: resolveMenuHref(item),
        }));

    const customMenu = (navigation?.customPages || [])
        .filter((page) => page.enabled && page.showInMenu && page.slug)
        .map((page) => ({
            id: page.id,
            label: page.title,
            href: `${basePath}/page/${page.slug}`,
        }));

    const primaryHeaderMenuIds = new Set(["home", "rsvp", "location", "program", "cagnotte"]);
    const sectionMenuItems = internalMenu.filter((item) => item.path !== "live");
    const headerMenuItems = sectionMenuItems.filter((item) => primaryHeaderMenuIds.has(item.id));
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
    const headerLogoTextStyle = draftBranding.logoTextStyle || (wedding.config?.branding as any)?.logoTextStyle || "elegant";

    const saveBranding = async (patch: Partial<{ logoUrl: string; logoText: string; logoTextStyle?: string }>) => {
        const nextBranding = {
            logoUrl: patch.logoUrl ?? draftBranding.logoUrl,
            logoText: patch.logoText ?? draftBranding.logoText,
            logoTextStyle: patch.logoTextStyle ?? draftBranding.logoTextStyle ?? "elegant",
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

    const footerTitle = (wedding.config?.texts as any)?.footerTitle || "On a hâte de vous voir";
    const footerSubtitle = (wedding.config?.texts as any)?.footerSubtitle || "Merci de faire partie de cette aventure.";
    const footerEmail = (wedding.config?.texts as any)?.footerEmail || "";
    const footerPhone = (wedding.config?.texts as any)?.footerPhone || "";
    const footerAddress =
        (wedding.config?.texts as any)?.footerAddress ||
        (wedding.config?.sections?.locationItems?.[0]?.address || "");
    const footerCopyright = (wedding.config?.texts as any)?.footerCopyright || "© 2026. Tous droits réservés.";

    const saveFooterField = async (key: string, value: string) => {
        await updateWedding.mutateAsync({
            id: wedding.id,
            config: {
                ...wedding.config,
                texts: {
                    ...(wedding.config?.texts || {}),
                    [key]: value,
                },
            },
        });
    };

    const footerLinks = [
        { id: "mentions-legales", label: "Mentions légales", href: `${basePath}/legal/mentions-legales` },
        { id: "confidentialite", label: "Confidentialité", href: `${basePath}/legal/confidentialite` },
        { id: "cgu", label: "CGU", href: `${basePath}/legal/cgu` },
        { id: "cookies", label: "Cookies", href: `${basePath}/legal/cookies` },
    ];
    const dayloraHref = marketingBaseUrl || "https://daylora.app";
    return (
        <ThemeProvider wedding={wedding}>
            <PublicEditProvider value={editValue}>
                <div className="flex flex-col min-h-screen">
                    {shouldShowHeader ? (
                        <header className={headerClass}>
                            <div className="container mx-auto flex h-16 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/"
                                        className="flex items-center space-x-2"
                                        onClick={(e) => {
                                            if (canEdit && editMode) e.preventDefault();
                                        }}
                                    >
                                        {headerLogoUrl && (
                                            <img
                                                src={headerLogoUrl}
                                                alt={headerLogoText || wedding.title}
                                                className="h-10 w-auto object-contain"
                                            />
                                        )}
                                        {headerLogoUrl ? (
                                            <span className="text-xl font-bold tracking-tight">
                                                <InlineEditor
                                                    value={siteTitle}
                                                    onSave={saveSiteTitle}
                                                    canEdit={canEdit && editMode}
                                                    placeholder={wedding.title}
                                                />
                                            </span>
                                        ) : (
                                            <div
                                                className={getLogoTextWrapperClassName(headerLogoTextStyle)}
                                                style={{ color: "var(--wedding-text-dark)" }}
                                            >
                                                <span className={getLogoTextClassName(headerLogoTextStyle)}>
                                                    <InlineEditor
                                                        value={headerLogoText}
                                                        onSave={(val) => saveBranding({ logoText: val })}
                                                        canEdit={canEdit && editMode}
                                                        placeholder={wedding.title}
                                                    />
                                                </span>
                                            </div>
                                        )}
                                    </Link>

                                    {canEdit && editMode ? (
                                        <div className="flex items-center gap-1.5">
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
                                            <button
                                                type="button"
                                                className="h-7 px-2.5 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm border border-primary/15 text-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
                                                onClick={() => logoInputRef.current?.click()}
                                                disabled={isUploadingLogo}
                                            >
                                                {isUploadingLogo ? "Import..." : "Logo"}
                                            </button>
                                            {headerLogoUrl && (
                                                <button
                                                    type="button"
                                                    className="h-7 px-2.5 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm border border-muted-foreground/15 text-muted-foreground hover:text-destructive hover:border-destructive/20 transition-all duration-200 disabled:opacity-50"
                                                    onClick={() => saveBranding({ logoUrl: "" })}
                                                    disabled={isUploadingLogo}
                                                >
                                                    Supprimer
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-3">
                                    <nav className={navClass}>
                                        {/* On homepage: show all menus. On section routes: show only sections. */}
                                        {headerMenuItems.map((item) => {
                                            const isExternal = item.linkType === "external";
                                            const cls =
                                                item.id === "cagnotte"
                                                    ? "rounded-full px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
                                                    : "hover:text-primary transition-colors";

                                            const content = (
                                                <InlineEditor
                                                    value={item.label}
                                                    onSave={(val) => saveMenuLabel(item.id, val)}
                                                    canEdit={canEdit && editMode}
                                                    placeholder={item.label}
                                                />
                                            );

                                            if (isExternal) {
                                                return (
                                                    <a
                                                        key={item.id}
                                                        href={item.href}
                                                        className={cls}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => {
                                                            if (canEdit && editMode) e.preventDefault();
                                                        }}
                                                    >
                                                        {content}
                                                    </a>
                                                );
                                            }

                                            return (
                                                <a
                                                    key={item.id}
                                                    href={item.href}
                                                    className={cls}
                                                    onClick={(e) => {
                                                        if (canEdit && editMode) e.preventDefault();
                                                    }}
                                                >
                                                    {content}
                                                </a>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </div>
                        </header>
                    ) : null}
                    <main className="flex-1">{children}</main>
                    {shouldShowFooter ? (
                    <footer className="border-t bg-background">
                        <div className="container mx-auto px-6 py-12">
                            <div className="flex flex-col items-center gap-8 text-center">
                                <div className="max-w-xl">
                                    <div className="text-2xl font-serif font-bold tracking-tight text-foreground">
                                        {wedding.config?.texts?.siteTitle || wedding.title}
                                    </div>

                                    <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                        <div className="font-medium text-foreground">
                                            <InlineEditor
                                                value={footerTitle}
                                                onSave={(v) => saveFooterField("footerTitle", v)}
                                                canEdit={canEdit && editMode}
                                                placeholder="On a hâte de vous voir"
                                            />
                                        </div>
                                        <div className="mt-1">
                                            <InlineEditor
                                                value={footerSubtitle}
                                                onSave={(v) => saveFooterField("footerSubtitle", v)}
                                                canEdit={canEdit && editMode}
                                                placeholder="Merci de faire partie de cette aventure."
                                                isTextArea
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-2 text-sm">
                                        {footerAddress ? (
                                            <div className="text-muted-foreground">
                                                <span className="text-foreground font-medium">Adresse:</span>{" "}
                                                {canEdit && editMode ? (
                                                    <InlineEditor
                                                        value={footerAddress}
                                                        onSave={(v) => saveFooterField("footerAddress", v)}
                                                        canEdit={canEdit && editMode}
                                                        placeholder="Adresse"
                                                    />
                                                ) : (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(footerAddress)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        {footerAddress}
                                                    </a>
                                                )}
                                            </div>
                                        ) : null}
                                        {footerEmail || (canEdit && editMode) ? (
                                            <div className="text-muted-foreground">
                                                <span className="text-foreground font-medium">Email:</span>{" "}
                                                {canEdit && editMode ? (
                                                    <InlineEditor
                                                        value={footerEmail}
                                                        onSave={(v) => saveFooterField("footerEmail", v)}
                                                        canEdit={canEdit && editMode}
                                                        placeholder="contact@email.com"
                                                    />
                                                ) : (
                                                    <a className="hover:underline" href={`mailto:${footerEmail}`}>
                                                        {footerEmail}
                                                    </a>
                                                )}
                                            </div>
                                        ) : null}
                                        {footerPhone || (canEdit && editMode) ? (
                                            <div className="text-muted-foreground">
                                                <span className="text-foreground font-medium">Téléphone:</span>{" "}
                                                {canEdit && editMode ? (
                                                    <InlineEditor
                                                        value={footerPhone}
                                                        onSave={(v) => saveFooterField("footerPhone", v)}
                                                        canEdit={canEdit && editMode}
                                                        placeholder="+33..."
                                                    />
                                                ) : (
                                                    <a className="hover:underline" href={`tel:${footerPhone}`}>
                                                        {footerPhone}
                                                    </a>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    <InlineEditor
                                        value={footerCopyright}
                                        onSave={(v) => saveFooterField("footerCopyright", v)}
                                        canEdit={canEdit && editMode}
                                        placeholder="© 2026. Tous droits réservés."
                                    />
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    Fait avec amour sur{" "}
                                    <a
                                        href={dayloraHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-foreground hover:underline"
                                    >
                                        Daylora
                                    </a>
                                </div>
                            </div>
                        </div>
                    </footer>
                    ) : null}

                    {
                        canEdit ? (
                            <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
                                {editMode ? (
                                    <div className="flex flex-col items-end gap-2">
                                        <EditModeTooltip />
                                        <div className="bg-white/88 backdrop-blur-xl border border-white/50 shadow-xl px-3 py-2 rounded-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300">
                                            <span className="flex items-center gap-1.5">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                </span>
                                                <span className="text-xs font-medium text-foreground/80">Édition</span>
                                            </span>
                                            <div className="w-px h-4 bg-border" />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2.5 rounded-full text-[11px] text-muted-foreground hover:text-foreground transition-all duration-200"
                                                onClick={() => setEditMode(false)}
                                            >
                                                Aperçu
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-7 px-3 rounded-full text-[11px] transition-all duration-200"
                                                onClick={() => setEditMode(false)}
                                            >
                                                Terminer
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="rounded-full shadow-lg h-10 px-4 bg-primary/92 hover:bg-primary backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
                                        onClick={() => setEditMode(true)}
                                        data-tour="preview-edit-button"
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                        Modifier le site
                                    </Button>
                                )}
                            </div>
                        ) : null
                    }
                    {canEdit && !editMode && (
                        <PreviewTour />
                    )}
                </div >
            </PublicEditProvider >
        </ThemeProvider >
    );
}

function PreviewTour() {
    const showTour = useShouldShowTour("preview-edit");

    if (!showTour) return null;

    return (
        <GuidedTour
            tourId="preview-edit"
            steps={[
                {
                    target: "preview-edit-button",
                    title: "Modifier votre site",
                    description: "Cliquez sur ce bouton pour passer en mode édition. Vous pourrez modifier les textes et images directement sur la page.",
                    position: "top",
                },
                {
                    target: "",
                    title: "Mode édition",
                    description: "En mode édition, cliquez sur n'importe quel texte pour le modifier. Cliquez sur les images pour les changer. Les modifications sont enregistrées automatiquement.",
                    position: "center",
                },
                {
                    target: "",
                    title: "Aperçu et Terminer",
                    description: "Utilisez « Aperçu » pour voir le résultat final, et « Terminer » pour quitter le mode édition. Vos modifications sont sauvegardées en temps réel.",
                    position: "center",
                },
            ]}
        />
    );
}
