import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ExternalLink,
  Crown,
  Globe,
  Link2,
  Loader2,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TenantDetail {
  wedding: any;
  owner: any;
  rsvpCount: number;
  contributionTotal: number;
  contributionCount: number;
  subscription: any;
}

export default function SuperAdminTenantDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [slugDialogOpen, setSlugDialogOpen] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/super-admin/tenants/${params.id}`, { credentials: "include" });
      if (!res.ok) {
        setData(null);
        return;
      }
      const d = await res.json();
      if (!d || !d.wedding) {
        setData(null);
        return;
      }
      setData(d);
      setNewSlug(d.wedding?.slug || "");
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const handleAction = async (url: string, body: any, successMsg: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
        return;
      }
      toast({ title: "Succès", description: successMsg });
      await fetchDetail();
    } catch {
      toast({ title: "Erreur", description: "Erreur réseau.", variant: "destructive" });
    } finally {
      setActionLoading(false);
      setPlanDialogOpen(false);
      setSlugDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return <p className="text-center text-muted-foreground py-12">Mariage introuvable.</p>;

  const { wedding, owner, rsvpCount, contributionTotal, contributionCount, subscription } = data;
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://daylora.app";

  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/tenants")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{wedding.title}</h1>
        <Badge variant={wedding.currentPlan === "premium" ? "default" : "secondary"} className={wedding.currentPlan === "premium" ? "bg-amber-100 text-amber-800" : ""}>
          {wedding.currentPlan}
        </Badge>
        <Badge variant={wedding.isPublished ? "default" : "outline"} className={wedding.isPublished ? "bg-green-100 text-green-800" : ""}>
          {wedding.isPublished ? "Publié" : "Brouillon"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{wedding.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span className="font-mono">{wedding.slug}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Template</span><span>{wedding.templateId}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date mariage</span><span>{wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString("fr-FR") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Créé le</span><span>{wedding.createdAt ? new Date(wedding.createdAt).toLocaleDateString("fr-FR") : "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Propriétaire</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span>{owner?.firstName} {owner?.lastName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{owner?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Inscrit le</span><span>{owner?.createdAt ? new Date(owner.createdAt).toLocaleDateString("fr-FR") : "—"}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><UserCheck className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-sm text-muted-foreground">RSVPs</p><p className="text-xl font-bold">{rsvpCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50"><Wallet className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-sm text-muted-foreground">Contributions</p><p className="text-xl font-bold">{(contributionTotal / 100).toFixed(0)} €</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50"><Crown className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Abonnement</p>
              <p className="text-xl font-bold">{subscription?.status || "Aucun"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setPlanDialogOpen(true)}>
            <Crown className="mr-2 h-4 w-4" />
            Changer le plan
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              handleAction(
                `/api/super-admin/tenants/${wedding.id}/status`,
                { isPublished: !wedding.isPublished, status: !wedding.isPublished ? "published" : "draft" },
                wedding.isPublished ? "Site dépublié." : "Site publié."
              )
            }
            disabled={actionLoading}
          >
            <Globe className="mr-2 h-4 w-4" />
            {wedding.isPublished ? "Dépublier" : "Publier"}
          </Button>
          <Button variant="outline" onClick={() => setSlugDialogOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            Modifier le slug
          </Button>
          <a href={`${appOrigin}/${wedding.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir le site
            </Button>
          </a>
        </CardContent>
      </Card>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Changer le plan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Plan actuel : <Badge>{wedding.currentPlan}</Badge>
          </p>
          <DialogFooter className="flex gap-3">
            <Button
              variant={wedding.currentPlan === "free" ? "default" : "outline"}
              onClick={() =>
                handleAction(
                  `/api/super-admin/tenants/${wedding.id}/plan`,
                  { plan: "free" },
                  "Plan changé en Free."
                )
              }
              disabled={actionLoading || wedding.currentPlan === "free"}
            >
              Free
            </Button>
            <Button
              variant={wedding.currentPlan === "premium" ? "default" : "outline"}
              className={wedding.currentPlan !== "premium" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
              onClick={() =>
                handleAction(
                  `/api/super-admin/tenants/${wedding.id}/plan`,
                  { plan: "premium" },
                  "Plan changé en Premium."
                )
              }
              disabled={actionLoading || wedding.currentPlan === "premium"}
            >
              Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={slugDialogOpen} onOpenChange={setSlugDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le slug</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Nouveau slug</Label>
            <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="mon-mariage" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={() =>
                handleAction(
                  `/api/super-admin/tenants/${wedding.id}/slug`,
                  { slug: newSlug },
                  "Slug modifié."
                )
              }
              disabled={actionLoading || !newSlug || newSlug.length < 3}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
