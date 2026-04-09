import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Layout, Sparkles, CheckCircle2, Eye, EyeOff, FileEdit } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { getAppNls } from "@/lib/nls";

type SiteConfig = {
    appBaseUrl: string;
    marketingBaseUrl: string;
};

export default function WelcomePage() {
    const { weddingId } = useParams();
    const { data: wedding, isLoading } = useWedding(weddingId);
    const updateWedding = useUpdateWedding();
    const { toast } = useToast();
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

    useEffect(() => {
        fetch("/api/site-config")
            .then((r) => r.json())
            .then(setSiteConfig)
            .catch(() => null);
    }, []);

    if (isLoading || !wedding) return <div className="animate-pulse h-screen bg-muted" />;
    const language = wedding.config?.language === "en" ? "en" : "fr";
    const nls = getAppNls(language);

    const appOrigin = typeof window !== "undefined" ? window.location.origin : (siteConfig?.appBaseUrl || "https://daylora.app");
    const publicUrl = `${appOrigin}/${wedding.slug || wedding.id}`;
    const previewUrl = `${appOrigin}/preview/${wedding.slug || wedding.id}`;

    const handlePublishToggle = async () => {
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                isPublished: !wedding.isPublished
            });
            toast({
                title: wedding.isPublished ? nls.welcome.unpublishedTitle : nls.welcome.publishedTitle,
                description: wedding.isPublished
                    ? nls.welcome.unpublishedDesc
                    : nls.welcome.publishedDesc,
            });
        } catch (error) {
            toast({
                title: nls.welcome.publishErrorTitle,
                description: nls.welcome.publishErrorDesc,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title={nls.welcome.title.replace("{title}", wedding.title)}
                description={nls.welcome.description}
                actions={
                    wedding.isPublished ? (
                        <Button onClick={handlePublishToggle} variant="outline">
                            <EyeOff className="h-4 w-4 mr-2" />
                            {nls.welcome.unpublish}
                        </Button>
                    ) : (
                        <Button onClick={handlePublishToggle}>
                            <Eye className="h-4 w-4 mr-2" />
                            {nls.welcome.publish}
                        </Button>
                    )
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                    label={nls.welcome.status}
                    value={wedding.isPublished ? nls.welcome.online : nls.welcome.draft}
                    hint={wedding.isPublished ? nls.welcome.publiclyVisible : nls.welcome.previewOnly}
                    icon={wedding.isPublished ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                />
                <KpiCard
                    label={nls.welcome.template}
                    value={wedding.templateId || "classic"}
                    hint={nls.welcome.currentStyle}
                    icon={<Sparkles className="h-5 w-5" />}
                />
                <KpiCard
                    label={nls.welcome.plan}
                    value={wedding.currentPlan === "premium" ? "Premium" : "Free"}
                    hint={nls.welcome.activeBilling}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                />
            </div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif">{nls.welcome.preview}</CardTitle>
                        <CardDescription>{nls.welcome.previewDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 rounded-lg border bg-muted/30 text-xs font-mono break-all">{previewUrl}</div>
                        <Button asChild className="w-full">
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer">{nls.welcome.openPreview}</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif">{nls.welcome.publicSite}</CardTitle>
                        <CardDescription>{wedding.isPublished ? nls.welcome.online : nls.welcome.publishToActivate}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 rounded-lg border bg-muted/30 text-xs font-mono break-all">{publicUrl}</div>
                        <Button asChild className="w-full" disabled={!wedding.isPublished}>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer">{nls.welcome.viewSite}</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif">{nls.welcome.administration}</CardTitle>
                        <CardDescription>{nls.welcome.administrationDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/dashboard">
                                <Layout className="h-4 w-4 mr-2" />
                                {nls.welcome.dashboard}
                            </Link>
                        </Button>
                        <Button asChild className="w-full">
                            <Link href="/design">
                                <FileEdit className="h-4 w-4 mr-2" />
                                {nls.welcome.editInvitation}
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/templates">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {nls.welcome.templatesAndDesign}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
