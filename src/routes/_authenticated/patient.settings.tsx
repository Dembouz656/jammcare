import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { usePatientNav } from "@/lib/dashboard-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/settings")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = usePatientNav();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone, city").eq("id", user.id).maybeSingle();
      setName(data?.full_name ?? ""); setPhone(data?.phone ?? ""); setCity(data?.city ?? "");
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, phone, city }).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Profil mis à jour");
  };

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";
  return (
    <DashboardShell role={t("patient")} name={name || t("patient")} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">{t("settings")}</h1>
      <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="space-y-2"><Label>{t("full_name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>{t("phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="space-y-2"><Label>{t("city")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <Button onClick={save} className="bg-gradient-primary text-primary-foreground">{t("confirm")}</Button>
      </div>
    </DashboardShell>
  );
}
