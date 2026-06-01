import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/admin/activity")({ component: Page });

interface Event { kind: string; label: string; at: string; }

function Page() {
  const { user } = useAuth();
  const nav = useAdminNav();
  const [name, setName] = useState("");
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const [{ data: profiles }, { data: docs }, { data: appts }] = await Promise.all([
        supabase.from("profiles").select("full_name, created_at").order("created_at", { ascending: false }).limit(15),
        supabase.from("doctors").select("id, status, approved_at").order("approved_at", { ascending: false, nullsFirst: false }).limit(15),
        supabase.from("appointments").select("id, status, created_at").order("created_at", { ascending: false }).limit(15),
      ]);
      const all: Event[] = [];
      for (const x of profiles ?? []) all.push({ kind: "Inscription", label: x.full_name, at: x.created_at });
      for (const x of docs ?? []) if (x.approved_at) all.push({ kind: "Médecin validé", label: x.id.slice(0, 8), at: x.approved_at });
      for (const x of appts ?? []) all.push({ kind: `RDV ${x.status}`, label: x.id.slice(0, 8), at: x.created_at });
      all.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setEvents(all.slice(0, 30));
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
  return (
    <DashboardShell role="Administrateur" name={name || "Admin"} initials={initials} nav={nav}>
      <h1 className="mb-6 flex items-center gap-3 text-display text-3xl"><Activity className="h-7 w-7 text-primary" /> Activité</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {events.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité récente.</p> : (
          <ul className="space-y-2">
            {events.map((e, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                <div><span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">{e.kind}</span> <span className="ml-2">{e.label}</span></div>
                <span className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
