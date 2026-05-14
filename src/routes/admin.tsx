import { createFileRoute } from "@tanstack/react-router";
import { Activity, BarChart3, CheckCircle2, Home, Settings, ShieldCheck, Stethoscope, Users, XCircle } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Console admin — MediRural" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const nav = [
    { label: "Vue d'ensemble", icon: Home, active: true },
    { label: "Utilisateurs", icon: Users },
    { label: "Médecins", icon: Stethoscope },
    { label: "Statistiques", icon: BarChart3 },
    { label: "Sécurité", icon: ShieldCheck },
    { label: "Activité", icon: Activity },
    { label: "Paramètres", icon: Settings },
  ];

  return (
    <DashboardShell role="Administrateur" name="Sami Bencherif" initials="SB" nav={nav}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Console admin</p>
        <h1 className="text-display text-4xl">Supervision de la plateforme.</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value="12 480" hint="+312 ce mois" />
        <StatCard label="Médecins actifs" value="284" hint="6 en attente" accent="success" />
        <StatCard label="Consultations" value="3 942" hint="ce mois" accent="accent" />
        <StatCard label="Disponibilité" value="99.9%" hint="30 derniers jours" accent="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl">Validation des médecins</h2>
            <span className="rounded-full bg-warning/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-warning-foreground">
              6 en attente
            </span>
          </div>
          <div className="space-y-3">
            {[
              { n: "Dr. Léa Marchand", s: "Pédiatrie", l: "Lyon, FR" },
              { n: "Dr. Omar Sy", s: "Cardiologie", l: "Dakar, SN" },
              { n: "Dr. Hannah Müller", s: "Dermatologie", l: "Berlin, DE" },
              { n: "Dr. Karim Belkacem", s: "Médecine générale", l: "Alger, DZ" },
            ].map((d) => (
              <div key={d.n} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-semibold">
                    {d.n.split(" ")[1][0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{d.n}</p>
                    <p className="text-xs text-muted-foreground">{d.s} · {d.l}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="h-8 bg-success px-3 text-success-foreground hover:bg-success/90">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Valider
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl">Consultations / mois</h2>
            <div className="mt-5 flex h-40 items-end gap-1.5">
              {[40, 55, 48, 70, 65, 85, 78, 95, 88, 100, 92, 110].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary to-primary/40" style={{ height: `${h * 0.7}%` }} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">12 derniers mois · +28% YoY</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl">Sécurité</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { l: "Connexions JWT valides", v: "99.97%" },
                { l: "Tentatives suspectes (24 h)", v: "3" },
                { l: "Sessions actives", v: "1 284" },
                { l: "Dernier audit", v: "Hier" },
              ].map((s) => (
                <li key={s.l} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="font-medium">{s.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
