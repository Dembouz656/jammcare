import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminNav } from "@/lib/dashboard-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Page });

function Page() {
  const { user } = useAuth();
  const nav = useAdminNav();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, city").eq("id", user.id).maybeSingle().then(({ data }) => { setName(data?.full_name ?? ""); setCity(data?.city ?? ""); });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, city }).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Profil mis à jour");
  };

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
  return (
    <DashboardShell role="Administrateur" name={name || "Admin"} initials={initials} nav={nav}>
      <h1 className="mb-6 flex items-center gap-3 text-display text-3xl"><Settings className="h-7 w-7 text-primary" /> Paramètres</h1>
      <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="space-y-2"><Label>Nom complet</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Ville</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Enregistrer</Button>
      </div>
    </DashboardShell>
  );
}
