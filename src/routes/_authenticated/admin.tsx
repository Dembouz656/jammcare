import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, BarChart3, CheckCircle2, Home, Settings, ShieldCheck, Stethoscope, Users, XCircle } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Console admin — MediRural" }] }),
  component: AdminDashboard,
});

interface PendingDoc { id: string; specialty: string; license_number: string; full_name: string; city: string | null; }

function AdminDashboard() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [pending, setPending] = useState<PendingDoc[]>([]);
  const [stats, setStats] = useState({ users: 0, doctors: 0, patients: 0, appointments: 0 });

  useEffect(() => { if (user) void load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    setProfileName(profile?.full_name ?? "");

    const { data: pendingDocs } = await supabase.from("doctors").select("id, specialty, license_number").eq("status", "pending");
    if (pendingDocs?.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, city").in("id", pendingDocs.map((d) => d.id));
      const m = new Map(profs?.map((p) => [p.id, p]) ?? []);
      setPending(pendingDocs.map((d) => {
        const p = m.get(d.id);
        return { id: d.id, specialty: d.specialty, license_number: d.license_number, full_name: p?.full_name ?? "—", city: p?.city ?? null };
      }));
    } else { setPending([]); }

    const [{ count: uCount }, { count: dCount }, { count: pCount }, { count: aCount }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("doctors").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
    ]);
    setStats({ users: uCount ?? 0, doctors: dCount ?? 0, patients: pCount ?? 0, appointments: aCount ?? 0 });
  };

  const decide = async (id: string, decision: "approved" | "rejected") => {
    const { error } = await supabase.from("doctors").update({
      status: decision,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
      approved_by: user?.id,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(decision === "approved" ? "Médecin validé" : "Médecin refusé");
    void load();
  };

  const nav = [
    { label: "Vue d'ensemble", icon: Home, active: true },
    { label: "Utilisateurs", icon: Users },
    { label: "Médecins", icon: Stethoscope },
    { label: "Statistiques", icon: BarChart3 },
    { label: "Sécurité", icon: ShieldCheck },
    { label: "Activité", icon: Activity },
    { label: "Paramètres", icon: Settings },
  ];

  const initials = profileName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";

  return (
    <DashboardShell role="Administrateur" name={profileName || "Admin"} initials={initials} nav={nav}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Console admin</p>
        <h1 className="text-display text-4xl">Supervision de la plateforme</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats.users} />
        <StatCard label="Médecins validés" value={stats.doctors} hint={`${pending.length} en attente`} accent="success" />
        <StatCard label="Patients" value={stats.patients} accent="accent" />
        <StatCard label="Rendez-vous" value={stats.appointments} accent="warning" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">Validation des médecins</h2>
          <span className="rounded-full bg-warning/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-warning-foreground">
            {pending.length} en attente
          </span>
        </div>
        {pending.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun médecin en attente de validation.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-semibold">
                    {d.full_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dr. {d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialty} · Licence {d.license_number}{d.city ? ` · ${d.city}` : ""}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => decide(d.id, "rejected")} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => decide(d.id, "approved")} className="h-8 bg-success px-3 text-success-foreground hover:bg-success/90">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Valider
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
