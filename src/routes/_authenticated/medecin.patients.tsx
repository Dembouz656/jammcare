import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useDoctorNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/medecin/patients")({ component: Page });

interface Row { patient_id: string; full_name: string; city: string | null; count: number; last: string; }

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
      const { data: a } = await supabase.from("appointments").select("patient_id, scheduled_at").eq("doctor_id", user.id);
      if (!a?.length) { setRows([]); return; }
      const agg = new Map<string, { count: number; last: string }>();
      for (const x of a) {
        const cur = agg.get(x.patient_id) ?? { count: 0, last: x.scheduled_at };
        cur.count += 1;
        if (new Date(x.scheduled_at) > new Date(cur.last)) cur.last = x.scheduled_at;
        agg.set(x.patient_id, cur);
      }
      const ids = [...agg.keys()];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, city").in("id", ids);
      const m = new Map(profs?.map((p) => [p.id, p]) ?? []);
      setRows(ids.map((id) => ({ patient_id: id, full_name: m.get(id)?.full_name ?? "Patient", city: m.get(id)?.city ?? null, ...agg.get(id)! })));
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";
  return (
    <DashboardShell role={t("doctor")} name={name || t("doctor")} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">{t("patients")}</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun patient suivi.</p> : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.patient_id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">{r.city ?? "—"} · {r.count} RDV</p>
                </div>
                <span className="text-xs text-muted-foreground">Dernier : {new Date(r.last).toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
