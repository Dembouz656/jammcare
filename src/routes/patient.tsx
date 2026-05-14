import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, FileText, Home, MessageSquare, Pill, Settings, Video, Clock, ChevronRight } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Espace patient — MediRural" }] }),
  component: PatientDashboard,
});

function PatientDashboard() {
  const nav = [
    { label: "Tableau de bord", icon: Home, active: true },
    { label: "Mes rendez-vous", icon: CalendarCheck2 },
    { label: "Téléconsultation", icon: Video },
    { label: "Messagerie", icon: MessageSquare },
    { label: "Mon dossier", icon: FileText },
    { label: "Ordonnances", icon: Pill },
    { label: "Paramètres", icon: Settings },
  ];

  return (
    <DashboardShell role="Patient" name="Awa Diop" initials="AD" nav={nav}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Bonjour</p>
          <h1 className="text-display text-4xl">Awa, votre prochaine consultation est demain.</h1>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-soft">
          <Video className="mr-2 h-4 w-4" /> Démarrer une consultation
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rendez-vous" value="3" hint="cette semaine" />
        <StatCard label="Consultations" value="12" hint="cette année" accent="success" />
        <StatCard label="Ordonnances" value="5" hint="actives" accent="accent" />
        <StatCard label="Messages" value="2" hint="non lus" accent="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl">Prochains rendez-vous</h2>
            <button className="text-sm text-primary hover:underline">Tout voir</button>
          </div>
          <div className="space-y-3">
            {[
              { d: "Dr. Mariam Touré", s: "Médecine générale", date: "Demain · 10:30", mode: "Vidéo" },
              { d: "Dr. Ibrahim Cissé", s: "Cardiologie", date: "Ven. 16 mai · 14:00", mode: "Vidéo" },
              { d: "Dr. Sophie Dubois", s: "Dermatologie", date: "Lun. 19 mai · 09:15", mode: "Chat" },
            ].map((a) => (
              <div key={a.d} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 transition hover:bg-secondary">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary font-semibold">
                    {a.d.split(" ")[1][0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.d}</p>
                    <p className="text-xs text-muted-foreground">{a.s}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{a.date}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                      {a.mode}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-xl">Activité récente</h2>
          <div className="mt-5 space-y-5">
            {[
              { i: Pill, t: "Nouvelle ordonnance", d: "Dr. Touré · il y a 2 j" },
              { i: FileText, t: "Résultats d'analyses", d: "Laboratoire · il y a 4 j" },
              { i: MessageSquare, t: "Message du Dr. Cissé", d: "il y a 5 j" },
              { i: Clock, t: "Rendez-vous confirmé", d: "il y a 1 sem." },
            ].map((e) => (
              <div key={e.t} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <e.i className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm">{e.t}</p>
                  <p className="text-xs text-muted-foreground">{e.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
