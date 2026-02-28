import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Tenant {
  id: string;
  slug: string;
  title: string;
  currentPlan: string;
  status: string;
  isPublished: boolean;
  createdAt: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  rsvpCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SuperAdminTenants() {
  const [, navigate] = useLocation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTenants = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/super-admin/tenants?${params}`, { credentials: "include" });
      const data = await res.json();
      setTenants(data.tenants);
      setPagination(data.pagination);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTenants(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTenants(1, search);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mariages</h1>

      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par slug, titre ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">Rechercher</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-medium text-slate-600">Slug</th>
                <th className="text-left p-3 font-medium text-slate-600">Titre</th>
                <th className="text-left p-3 font-medium text-slate-600">Propriétaire</th>
                <th className="text-left p-3 font-medium text-slate-600">Plan</th>
                <th className="text-left p-3 font-medium text-slate-600">Statut</th>
                <th className="text-left p-3 font-medium text-slate-600">RSVPs</th>
                <th className="text-left p-3 font-medium text-slate-600">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={7} className="p-3"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun mariage trouvé.</td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/tenants/${t.id}`)}
                  >
                    <td className="p-3 font-mono text-xs">{t.slug}</td>
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3 text-muted-foreground">{t.ownerEmail}</td>
                    <td className="p-3">
                      <Badge variant={t.currentPlan === "premium" ? "default" : "secondary"} className={t.currentPlan === "premium" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}>
                        {t.currentPlan}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={t.isPublished ? "default" : "outline"} className={t.isPublished ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {t.isPublished ? "Publié" : "Brouillon"}
                      </Badge>
                    </td>
                    <td className="p-3">{t.rsvpCount}</td>
                    <td className="p-3 text-muted-foreground">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              {pagination.total} résultat{pagination.total > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchTenants(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-2 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTenants(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
