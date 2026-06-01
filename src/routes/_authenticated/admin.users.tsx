import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: Page });

interface Row { id: string; full_name: string; city: string | null; created_at: string; role?: string; }

function Page() {
  const { user } = useAuth();
  const nav = useAdminNav();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, city, created_at").order("created_at", { ascending: false }).limit(200);
      if (profiles?.length) {
        const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", profiles.map((p) => p.id));
        const rmap = new Map<string, string[]>();
        for (const r of roles ?? []) {
          const arr = rmap.get(r.user_id) ?? [];
          arr.push(r.role as string);
          rmap.set(r.user_id, arr);
        }
        setRows(profiles.map((p) => ({ ...p, role: (rmap.get(p.id) ?? ["—"]).join(", ") })));
      } else setRows([]);
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
  return (
    <DashboardShell role="Administrateur" name={name || "Admin"} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">Utilisateurs</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun utilisateur.</p> : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <div><p className="text-sm font-medium">{r.full_name}</p><p className="text-xs text-muted-foreground">{r.city ?? "—"} · {r.role}</p></div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
