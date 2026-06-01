import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/admin/security")({ component: Page });

function Page() {
  const { user } = useAuth();
  const nav = useAdminNav();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => setName(data?.full_name ?? ""));
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
  const items = [
    { ok: true, label: "Row Level Security activée sur toutes les tables sensibles." },
    { ok: true, label: "Rôles stockés dans user_roles séparément des profils (anti-élévation de privilèges)." },
    { ok: true, label: "Validation médecin obligatoire avant publication." },
    { ok: true, label: "Authentification chiffrée (Supabase Auth) avec sessions persistées." },
  ];
  return (
    <DashboardShell role="Administrateur" name={name || "Admin"} initials={initials} nav={nav}>
      <h1 className="mb-6 flex items-center gap-3 text-display text-3xl"><ShieldCheck className="h-7 w-7 text-primary" /> Sécurité</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${it.ok ? "bg-success" : "bg-destructive"}`} />
              <span className="text-sm">{it.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
