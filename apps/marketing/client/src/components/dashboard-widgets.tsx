import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, CheckCircle, XCircle, Table2, Palette, ArrowRight } from "lucide-react";
import { Link, useParams } from "wouter";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RsvpResponse } from "@shared/schema";
interface DashboardWidgetsProps {
  responses: RsvpResponse[];
  onFilterChange?: (filter: string) => void;
}

export function DashboardWidgets({ responses, onFilterChange }: DashboardWidgetsProps) {
  const { weddingId } = useParams();
  const stats = {
    total: responses.length,
    confirmed: responses.filter((r) => r.availability === "confirmed").length,
    declined: responses.filter((r) => r.availability === "declined").length,
    pending: responses.filter((r) => r.availability === "pending").length,
    assigned: responses.filter((r) => r.tableNumber !== null).length,
    totalGuests: responses.reduce((sum, r) => sum + r.partySize, 0),
    solo: responses.filter((r) => r.partySize === 1).length,
    couple: responses.filter((r) => r.partySize === 2).length,
    confirmedGuests: responses
      .filter((r) => r.availability === "confirmed")
      .reduce((sum, r) => sum + r.partySize, 0),
  };

  const availabilityData = [
    { name: "Présents", value: stats.confirmed, color: "hsl(var(--chart-2))" },
    { name: "Absents", value: stats.declined, color: "hsl(var(--chart-5))" },
    { name: "En attente", value: stats.pending, color: "hsl(var(--chart-4))" },
  ];

  const partySizeData = [
    { name: "Solo (1)", value: stats.solo, fill: "hsl(var(--chart-1))" },
    { name: "Couple (2)", value: stats.couple, fill: "hsl(var(--chart-2))" },
  ];

  const tableAssignmentData = [
    {
      name: "Attribués",
      value: stats.assigned,
      fill: "hsl(var(--chart-2))",
    },
    {
      name: "Non attribués",
      value: stats.total - stats.assigned,
      fill: "hsl(var(--muted))",
    },
  ];

  const confirmationRate = stats.total > 0
    ? Math.round((stats.confirmed / stats.total) * 100)
    : 0;

  const statCards = [
    {
      title: "Total Invités",
      value: stats.totalGuests,
      description: `${stats.total} réponses`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "stat-total-guests",
      filter: "all",
      clickable: true,
    },
    {
      title: "Absents",
      value: stats.declined,
      description: "Invités indisponibles",
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      testId: "stat-declined",
      filter: "declined",
      clickable: true,
    },
    {
      title: "Confirmés",
      value: stats.confirmed,
      description: `${stats.confirmedGuests} personnes totales`,
      icon: CheckCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      testId: "stat-confirmed",
      filter: "confirmed",
      clickable: true,
    },
    {
      title: "Site & Design",
      value: "Custom",
      description: "Personnalisez votre site",
      icon: Palette,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: `/app/:weddingId/templates`,
      clickable: true,
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const isClickable = stat.clickable && onFilterChange;
          return (
            <Card
              key={idx}
              className={`p-6 transition-all duration-300 ${(isClickable || stat.href) ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:shadow-lg' : ''}`}
              onClick={() => {
                if (stat.href) {
                  window.location.href = stat.href.replace(':weddingId', weddingId || '');
                  return;
                }
                if (isClickable && stat.filter) {
                  onFilterChange(stat.filter);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-sans text-muted-foreground mb-1">
                    {stat.title}
                    {isClickable && (
                      <span className="ml-2 text-[10px] text-primary opacity-70">(cliquer pour filtrer)</span>
                    )}
                  </p>
                  <p
                    className="text-3xl font-bold font-serif text-foreground mb-1"
                    data-testid={stat.testId}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-serif font-semibold text-lg">Répartition Disponibilité</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={availabilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {availabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-chart-4/10">
              <Users className="h-5 w-5 text-chart-4" />
            </div>
            <h3 className="font-serif font-semibold text-lg">Taille des groupes</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partySizeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {partySizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <Table2 className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="font-serif font-semibold text-lg">Plan de table</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tableAssignmentData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tableAssignmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
