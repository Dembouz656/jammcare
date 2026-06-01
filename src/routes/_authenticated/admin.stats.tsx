import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/admin/stats")({ component: Page });

function Page() {
  const { user } = useAuth();
  const nav = useAdminNav();
  const [name, setName] = useState("");
  const [s, setS] = useState({ appts: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, rx: 0, consult: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const [a, pe, co, cd, ca, rx, cs] = await Promise.all([
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
        supabase.from("prescriptions").select("*", { count: "exact", head: true }),
        supabase.from("consultations").select("*", { count: "exact", head: true }),
      ]);
      setS({ appts: a.count ?? 0, pending: pe.count ?? 0, confirmed: co.count ?? 0, completed: cd.count ?? 0, cancelled: ca.count ?? 0, rx: rx.count ?? 0, consult: cs.count ?? 0 });
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
  return (
    <DashboardShell role="Administrateur" name={name || "Admin"} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">Statistiques</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="RDV totaux" value={s.appts} />
        <StatCard label="En attente" value={s.pending} accent="warning" />
        <StatCard label="Confirmés" value={s.confirmed} accent="accent" />
        <StatCard label="Terminés" value={s.completed} accent="success" />
        <StatCard label="Annulés" value={s.cancelled} />
        <StatCard label="Consultations" value={s.consult} accent="accent" />
        <StatCard label="Ordonnances" value={s.rx} accent="success" />
      </div>
    </DashboardShell>
  );
}
