import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useDoctorNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/medecin/records")({ component: Page });

interface Row { id: string; title: string; description: string | null; record_type: string | null; created_at: string; patient_id: string; patient_name?: string; document_url: string | null; }

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
      const { data: r } = await supabase.from("medical_records").select("id, title, description, record_type, created_at, patient_id, document_url").eq("doctor_id", user.id).order("created_at", { ascending: false });
      if (r?.length) {
        const ids = [...new Set(r.map((x) => x.patient_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const m = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
        setRows(r.map((x) => ({ ...x, patient_name: m.get(x.patient_id) ?? "Patient" })));
      } else setRows([]);
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";
  return (
    <DashboardShell role={t("doctor")} name={name || t("doctor")} initials={initials} nav={nav}>
      <h1 className="mb-6 flex items-center gap-3 text-display text-3xl"><FileText className="h-7 w-7 text-primary" /> Dossiers patients</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun dossier enregistré.</p> : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{r.title}</p>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.patient_name} · {r.record_type ?? "—"}</p>
                {r.description && <p className="mt-1 text-sm">{r.description}</p>}
                {r.document_url && <a href={r.document_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">Ouvrir le document</a>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
