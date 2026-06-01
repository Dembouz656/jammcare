import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, BarChart3, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Page });

function Page() {
  const { user } = useAuth();
  const nav = useAdminNav();
  const [name, setName] = useState("");
  const [stats, setStats] = useState({ users: 0, doctors: 0, patients: 0, appointments: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const [{ count: u }, { count: d }, { count: pa }, { count: a }, { count: pe }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({ users: u ?? 0, doctors: d ?? 0, patients: pa ?? 0, appointments: a ?? 0, pending: pe ?? 0 });
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
  return (
    <DashboardShell role="Administrateur" name={name || "Admin"} initials={initials} nav={nav}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Console admin</p>
        <h1 className="text-display text-4xl">Supervision de la plateforme</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats.users} />
        <StatCard label="Médecins validés" value={stats.doctors} hint={`${stats.pending} en attente`} accent="success" />
        <StatCard label="Patients" value={stats.patients} accent="accent" />
        <StatCard label="Rendez-vous" value={stats.appointments} accent="warning" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/admin/users", icon: Users, label: "Utilisateurs" },
          { to: "/admin/validation", icon: Stethoscope, label: "Médecins" },
          { to: "/admin/stats", icon: BarChart3, label: "Statistiques" },
          { to: "/admin/security", icon: ShieldCheck, label: "Sécurité" },
          { to: "/admin/activity", icon: Activity, label: "Activité" },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/40 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><l.icon className="h-5 w-5" /></div>
            <span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
