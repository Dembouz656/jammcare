import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Video, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { AppointmentsCalendar, type ApptEvent } from "@/components/AppointmentsCalendar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useDoctorNav } from "@/lib/dashboard-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/medecin/agenda")({ component: Page });

interface ApptRow { id: string; scheduled_at: string; reason: string | null; status: string; patient_id: string; patient_name?: string; }

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = useDoctorNav();
  const [name, setName] = useState("");
  const [appts, setAppts] = useState<ApptRow[]>([]);

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    setName(p?.full_name ?? "");
    const { data: a } = await supabase.from("appointments").select("id, scheduled_at, reason, status, patient_id").eq("doctor_id", user.id).order("scheduled_at");
    if (a?.length) {
      const ids = [...new Set(a.map((x) => x.patient_id))];
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const m = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
      setAppts(a.map((x) => ({ ...x, patient_name: m.get(x.patient_id) ?? "Patient" })));
    } else setAppts([]);
  };
  useEffect(() => { void load(); }, [user]);

  const update = async (id: string, s: "confirmed" | "cancelled" | "completed") => {
    const { error } = await supabase.from("appointments").update({ status: s }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mis à jour"); void load();
  };

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";
  return (
    <DashboardShell role={t("doctor")} name={name || t("doctor")} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">{t("agenda")}</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {appts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("no_appointments")}</p>
        ) : (
          <div className="space-y-2">
            {appts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="w-32 text-sm text-primary">{new Date(a.scheduled_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.patient_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.reason ?? "Consultation"}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] uppercase tracking-wider">{a.status}</span>
                {a.status === "pending" && <Button size="sm" onClick={() => update(a.id, "confirmed")} className="h-8 bg-success text-success-foreground hover:bg-success/90"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {t("confirm")}</Button>}
                {a.status === "confirmed" && <Button asChild size="sm" className="h-8 bg-gradient-primary text-primary-foreground"><Link to="/call/$id" params={{ id: a.id }}><Video className="mr-1 h-3.5 w-3.5" /> {t("join_call")}</Link></Button>}
                {(a.status === "pending" || a.status === "confirmed") && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => update(a.id, "completed")} className="h-8">{t("finish")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => update(a.id, "cancelled")} className="h-8 text-destructive"><XCircle className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
