import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarDays, FileText, Home, MessageSquare, Pill, Stethoscope, Users, Video, Clock } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/medecin")({
  head: () => ({ meta: [{ title: "Espace médecin — MediRural" }] }),
  component: DoctorDashboard,
});

function DoctorDashboard() {
  const nav = [
    { label: "Tableau de bord", icon: Home, active: true },
    { label: "Agenda", icon: CalendarDays },
    { label: "Patients", icon: Users },
    { label: "Téléconsultations", icon: Video },
    { label: "Messagerie", icon: MessageSquare },
    { label: "Diagnostics", icon: Stethoscope },
    { label: "Prescriptions", icon: Pill },
    { label: "Dossiers", icon: FileText },
  ];

  return (
    <DashboardShell role="Médecin · Médecine générale" name="Dr. Mariam Touré" initials="MT" nav={nav}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Aujourd'hui</p>
          <h1 className="text-display text-4xl">Bonjour Dr. Touré, 8 patients vous attendent.</h1>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-soft">
          <Video className="mr-2 h-4 w-4" /> Lancer la prochaine consultation
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Consultations du jour" value="8" hint="2 terminées" />
        <StatCard label="Patients suivis" value="142" hint="actifs" accent="success" />
        <StatCard label="Ordonnances" value="24" hint="ce mois" accent="accent" />
        <StatCard label="Note moyenne" value="4.9" hint="sur 5" accent="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl">Agenda du jour</h2>
            <span className="text-xs text-muted-foreground">Jeudi 14 mai</span>
          </div>
          <div className="space-y-2">
            {[
              { h: "09:00", p: "Awa Diop", r: "Suivi tension", s: "terminé" },
              { h: "09:45", p: "Moussa Bâ", r: "Toux persistante", s: "terminé" },
              { h: "10:30", p: "Fatou Ndiaye", r: "Renouvellement ordonnance", s: "encours" },
              { h: "11:15", p: "Jean-Marie Lemaire", r: "Première consultation", s: "à venir" },
              { h: "14:00", p: "Aïcha Konaté", r: "Résultats analyses", s: "à venir" },
              { h: "15:30", p: "Pierre Sow", r: "Téléconsultation chat", s: "à venir" },
            ].map((c) => (
              <div key={c.h} className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="w-14 text-display text-lg text-primary">{c.h}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.p}</p>
                  <p className="text-xs text-muted-foreground">{c.r}</p>
                </div>
                <StatusBadge status={c.s} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl">Activité de la semaine</h2>
            <div className="mt-5 flex h-32 items-end gap-2">
              {[60, 80, 45, 90, 70, 100, 55].map((h, i) => (
                <div key={i} className="group flex-1 rounded-t-md bg-primary/20 transition hover:bg-primary" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl">Notifications</h2>
            <div className="mt-4 space-y-4">
              {[
                { i: Activity, t: "Résultats reçus", d: "Patient Sow · maintenant" },
                { i: MessageSquare, t: "Nouveau message", d: "Mme Konaté · 12 min" },
                { i: Clock, t: "Demande de RDV", d: "M. Diallo · 1 h" },
              ].map((n) => (
                <div key={n.t} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <n.i className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm">{n.t}</p>
                    <p className="text-xs text-muted-foreground">{n.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    terminé: "bg-success/15 text-success",
    encours: "bg-primary text-primary-foreground",
    "à venir": "bg-secondary text-secondary-foreground",
  };
  const label = status === "encours" ? "en cours" : status;
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${map[status]}`}>
      {label}
    </span>
  );
}
