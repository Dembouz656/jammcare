import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { usePatientNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/patient/record")({ component: Page });

interface Row { id: string; scheduled_at: string; reason: string | null; status: string; doctor_id: string; doctor_name?: string; }

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = usePatientNav();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const { data: a } = await supabase.from("appointments").select("id, scheduled_at, reason, status, doctor_id").eq("patient_id", user.id).eq("status", "completed").order("scheduled_at", { ascending: false });
      if (a?.length) {
        const ids = [...new Set(a.map((x) => x.doctor_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const m = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
        setRows(a.map((x) => ({ ...x, doctor_name: m.get(x.doctor_id) ?? "Médecin" })));
      } else setRows([]);
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";
  return (
    <DashboardShell role={t("patient")} name={name || t("patient")} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">{t("my_record")}</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune consultation terminée.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">{r.reason ?? "Consultation"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.scheduled_at).toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
