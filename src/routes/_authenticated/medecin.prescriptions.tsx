import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pill } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useDoctorNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/medecin/prescriptions")({ component: Page });

interface Med { name?: string; dosage?: string; frequency?: string; duration?: string; }
interface Rx { id: string; issued_at: string; instructions: string | null; medications: Med[] | null; patient_id: string; patient_name?: string; }

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = useDoctorNav();
  const [name, setName] = useState("");
  const [rxs, setRxs] = useState<Rx[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const { data: r } = await supabase.from("prescriptions").select("id, issued_at, instructions, medications, patient_id").eq("doctor_id", user.id).order("issued_at", { ascending: false });
      if (r?.length) {
        const ids = [...new Set(r.map((x) => x.patient_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const m = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
        setRxs(r.map((x) => ({ ...x, medications: x.medications as Med[] | null, patient_name: m.get(x.patient_id) ?? "Patient" })));
      } else setRxs([]);
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";
  return (
    <DashboardShell role={t("doctor")} name={name || t("doctor")} initials={initials} nav={nav}>
      <h1 className="mb-6 flex items-center gap-3 text-display text-3xl"><Pill className="h-7 w-7 text-primary" /> {t("prescriptions")}</h1>
      <div className="space-y-4">
        {rxs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">Aucune ordonnance émise. Créez-en depuis la consultation terminée.</p>
          </div>
        ) : rxs.map((rx) => (
          <article key={rx.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <header className="mb-4 flex items-center justify-between">
              <div><p className="text-sm font-medium">{rx.patient_name}</p><p className="text-xs text-muted-foreground">{new Date(rx.issued_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p></div>
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary">Ordonnance</span>
            </header>
            {rx.medications && rx.medications.length > 0 && (
              <ul className="space-y-2">
                {rx.medications.map((m, i) => (
                  <li key={i} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                    <p className="font-medium">{m.name ?? "Médicament"}</p>
                    <p className="text-xs text-muted-foreground">{[m.dosage, m.frequency, m.duration].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            )}
            {rx.instructions && <p className="mt-4 rounded-lg bg-secondary px-4 py-3 text-sm">{rx.instructions}</p>}
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
