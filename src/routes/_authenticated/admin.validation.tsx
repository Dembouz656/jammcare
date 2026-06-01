import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminNav } from "@/lib/dashboard-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/validation")({ component: Page });

interface Doc { id: string; specialty: string; license_number: string; full_name: string; city: string | null; status: string; }

function Page() {
  const { user } = useAuth();
  const nav = useAdminNav();
  const [name, setName] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    setName(p?.full_name ?? "");
    const { data: all } = await supabase.from("doctors").select("id, specialty, license_number, status").order("status");
    if (all?.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, city").in("id", all.map((d) => d.id));
      const m = new Map(profs?.map((p) => [p.id, p]) ?? []);
      setDocs(all.map((d) => ({ ...d, full_name: m.get(d.id)?.full_name ?? "—", city: m.get(d.id)?.city ?? null })));
    } else setDocs([]);
  };
  useEffect(() => { void load(); }, [user]);

  const decide = async (id: string, s: "approved" | "rejected") => {
    const { error } = await supabase.from("doctors").update({ status: s, approved_at: s === "approved" ? new Date().toISOString() : null, approved_by: user?.id }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(s === "approved" ? "Médecin validé" : "Refusé"); void load();
  };

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
  return (
    <DashboardShell role="Administrateur" name={name || "Admin"} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">Validation des médecins</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {docs.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun médecin enregistré.</p> : (
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft font-semibold text-primary">{d.full_name[0]?.toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium">Dr. {d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialty} · Licence {d.license_number}{d.city ? ` · ${d.city}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${d.status === "approved" ? "bg-success/20 text-success" : d.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning-foreground"}`}>{d.status}</span>
                  {d.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => decide(d.id, "rejected")} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"><XCircle className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => decide(d.id, "approved")} className="h-8 bg-success px-3 text-success-foreground hover:bg-success/90"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Valider</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
