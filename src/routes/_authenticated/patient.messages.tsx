import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { usePatientNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/patient/messages")({ component: Page });

interface Msg { id: string; content: string; created_at: string; sender_id: string; read_at: string | null; sender_name?: string; }

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = usePatientNav();
  const [name, setName] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(p?.full_name ?? "");
      const { data: m } = await supabase.from("messages").select("id, content, created_at, sender_id, read_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (m?.length) {
        const ids = [...new Set(m.map((x) => x.sender_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const sm = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
        setMsgs(m.map((x) => ({ ...x, sender_name: sm.get(x.sender_id) ?? "—" })));
      } else setMsgs([]);
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";
  return (
    <DashboardShell role={t("patient")} name={name || t("patient")} initials={initials} nav={nav}>
      <h1 className="mb-6 text-display text-3xl">{t("messages")}</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {msgs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("no_messages")}</p>
        ) : (
          <ul className="space-y-2">
            {msgs.map((m) => (
              <li key={m.id} className={`rounded-lg border px-4 py-3 ${m.read_at ? "border-border bg-surface" : "border-primary/40 bg-primary-soft"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{m.sender_name}</p>
                  <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <p className="mt-1 text-sm">{m.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
