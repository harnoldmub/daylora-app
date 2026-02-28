import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Tag,
  ScrollText,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";

interface AdminInfo {
  id: number;
  email: string;
  mustChangePassword: boolean;
}

const navItems = [
  { path: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/admin/tenants", label: "Mariages", icon: Users },
  { path: "/admin/promos", label: "Codes promos", icon: Tag },
  { path: "/admin/audit", label: "Logs d'audit", icon: ScrollText },
  { path: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/super-admin/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          navigate("/admin/login");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setAdmin(data);
        if (data.mustChangePassword && !location.startsWith("/admin/settings")) {
          navigate("/admin/settings");
        }
        setLoading(false);
      })
      .catch(() => {
        navigate("/admin/login");
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/super-admin/logout", { method: "POST", credentials: "include" });
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
        <Shield className="h-4 w-4" />
        Mode Super Admin — {admin.email}
      </div>

      <div className="flex">
        <button
          className="lg:hidden fixed top-14 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <aside
          className={`
            fixed lg:sticky top-[40px] left-0 z-40 h-[calc(100vh-40px)] w-64 bg-white border-r border-slate-200
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-lg text-slate-900">Daylora Admin</h2>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      isActive
                        ? "bg-red-50 text-red-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-40px)]">
          {admin.mustChangePassword && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
              Vous devez changer votre mot de passe avant de continuer.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
