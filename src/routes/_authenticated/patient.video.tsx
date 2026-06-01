import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { usePatientNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/patient/video")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = usePatientNav();
  const [name, setName] = useState("");
  const [appts, setAppts] = useState<{ id: string; scheduled_at: string; doctor_id: string; doctor_name?: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const { data: a } = await supabase.from("appointments").select("id, scheduled_at, doctor_id").eq("patient_id", user.id).eq("status", "confirmed").gte("scheduled_at", new Date(Date.now() - 3600000).toISOString()).order("scheduled_at");
      if (a?.length) {
        const ids = [...new Set(a.map((x) => x.doctor_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const m = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
        setAppts(a.map((x) => ({ ...x, doctor_name: m.get(x.doctor_id) ?? "Médecin" })));
      } else setAppts([]);
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";
  return (
    <DashboardShell role={t("patient")} name={name || t("patient")} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">{t("video_consultation")}</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {appts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("no_upcoming")}</p>
        ) : (
          <ul className="space-y-2">
            {appts.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{a.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground">
                  <Link to="/call/$id" params={{ id: a.id }}><Video className="mr-1 h-3.5 w-3.5" /> {t("join_call")}</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
