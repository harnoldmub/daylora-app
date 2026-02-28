import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: number;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  adminEmail: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionLabels: Record<string, string> = {
  login: "Connexion",
  logout: "Déconnexion",
  change_password: "Changement MDP",
  update_status: "Changement statut",
  update_plan: "Changement plan",
  update_slug: "Changement slug",
  create_promo: "Création promo",
  update_promo: "Modification promo",
  deactivate_promo: "Désactivation promo",
};

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
      const res = await fetch(`/api/super-admin/audit-logs?${params}`, { credentials: "include" });
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, fetchLogs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Logs d'audit</h1>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            <SelectItem value="login">Connexion</SelectItem>
            <SelectItem value="logout">Déconnexion</SelectItem>
            <SelectItem value="change_password">Changement MDP</SelectItem>
            <SelectItem value="update_status">Changement statut</SelectItem>
            <SelectItem value="update_plan">Changement plan</SelectItem>
            <SelectItem value="update_slug">Changement slug</SelectItem>
            <SelectItem value="create_promo">Création promo</SelectItem>
            <SelectItem value="update_promo">Modification promo</SelectItem>
            <SelectItem value="deactivate_promo">Désactivation promo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-medium text-slate-600">Date</th>
                <th className="text-left p-3 font-medium text-slate-600">Admin</th>
                <th className="text-left p-3 font-medium text-slate-600">Action</th>
                <th className="text-left p-3 font-medium text-slate-600">Cible</th>
                <th className="text-left p-3 font-medium text-slate-600">Détails</th>
                <th className="text-left p-3 font-medium text-slate-600">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={6} className="p-3"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun log.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="p-3 text-xs">{log.adminEmail}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs font-mono">
                      {log.targetType && <span className="text-muted-foreground">{log.targetType}:</span>}
                      {log.targetId ? log.targetId.substring(0, 12) : "—"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{log.ipAddress || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              {pagination.total} entrée{pagination.total > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchLogs(pagination.page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-2 text-sm">{pagination.page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchLogs(pagination.page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
