import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useDoctorNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/medecin/diagnostics")({ component: Page });

interface Row { id: string; diagnosis: string | null; notes: string | null; started_at: string | null; patient_id: string; patient_name?: string; }

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = useDoctorNav();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const { data: c } = await supabase.from("consultations").select("id, diagnosis, notes, started_at, patient_id").eq("doctor_id", user.id).order("started_at", { ascending: false });
      if (c?.length) {
        const ids = [...new Set(c.map((x) => x.patient_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const m = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
        setRows(c.map((x) => ({ ...x, patient_name: m.get(x.patient_id) ?? "Patient" })));
      } else setRows([]);
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";
  return (
    <DashboardShell role={t("doctor")} name={name || t("doctor")} initials={initials} nav={nav}>
      <h1 className="mb-6 flex items-center gap-3 text-display text-3xl"><Stethoscope className="h-7 w-7 text-primary" /> Diagnostics</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucune consultation enregistrée.</p> : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{r.patient_name}</p>
                  <span className="text-xs text-muted-foreground">{r.started_at ? new Date(r.started_at).toLocaleDateString("fr-FR") : "—"}</span>
                </div>
                {r.diagnosis && <p className="mt-1 text-sm"><span className="font-medium">Diagnostic :</span> {r.diagnosis}</p>}
                {r.notes && <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
