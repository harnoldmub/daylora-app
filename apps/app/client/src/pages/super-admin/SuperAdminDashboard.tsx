import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown, UserCheck, Heart, Wallet } from "lucide-react";

interface Stats {
  totalWeddings: number;
  premiumWeddings: number;
  totalUsers: number;
  totalRsvps: number;
  totalContributions: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const kpis = stats
    ? [
        { label: "Mariages", value: stats.totalWeddings, icon: Heart, color: "text-pink-600 bg-pink-50" },
        { label: "Premium", value: stats.premiumWeddings, icon: Crown, color: "text-amber-600 bg-amber-50" },
        { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
        { label: "RSVPs", value: stats.totalRsvps, icon: UserCheck, color: "text-green-600 bg-green-50" },
        { label: "Contributions", value: `${(stats.totalContributions / 100).toFixed(0)} €`, icon: Wallet, color: "text-purple-600 bg-purple-50" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tableau de bord</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-16 bg-slate-100 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${kpi.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
