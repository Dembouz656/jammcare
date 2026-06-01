import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, FileText, MessageSquare, Pill, Stethoscope, Users, Video } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useDoctorNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/medecin/")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = useDoctorNav();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [status, setStatus] = useState("pending");
  const [stats, setStats] = useState({ today: 0, patients: 0, completed: 0, upcoming: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: d }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("doctors").select("specialty, status").eq("id", user.id).maybeSingle(),
      ]);
      setName(p?.full_name ?? ""); setSpecialty(d?.specialty ?? ""); setStatus(d?.status ?? "pending");
      const { data: a } = await supabase.from("appointments").select("status, scheduled_at, patient_id").eq("doctor_id", user.id);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tom = new Date(today); tom.setDate(tom.getDate() + 1);
      const todayCount = (a ?? []).filter((x) => { const dt = new Date(x.scheduled_at); return dt >= today && dt < tom; }).length;
      const completed = (a ?? []).filter((x) => x.status === "completed").length;
      const upcoming = (a ?? []).filter((x) => new Date(x.scheduled_at) >= today && x.status !== "cancelled").length;
      const patientIds = new Set((a ?? []).map((x) => x.patient_id));
      setStats({ today: todayCount, patients: patientIds.size, completed, upcoming });
    })();
  }, [user]);

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";
  return (
    <DashboardShell role={`${t("doctor")} · ${specialty}`} name={name || t("doctor")} initials={initials} nav={nav}>
      {status !== "approved" && (
        <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/10 p-5 text-sm">
          <p className="font-medium text-foreground">{t("pending_validation")}</p>
          <p className="mt-1 text-muted-foreground">{t("pending_validation_desc")}</p>
        </div>
      )}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("today")}</p>
        <h1 className="text-display text-4xl">Dr. {name}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("consultations_today")} value={stats.today} />
        <StatCard label={t("patients")} value={stats.patients} hint={t("followed")} accent="success" />
        <StatCard label={t("completed")} value={stats.completed} accent="accent" />
        <StatCard label={t("to_come")} value={stats.upcoming} accent="warning" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/medecin/agenda", icon: CalendarDays, label: t("agenda") },
          { to: "/medecin/availability", icon: Clock, label: t("availability") },
          { to: "/medecin/patients", icon: Users, label: t("patients") },
          { to: "/medecin/video", icon: Video, label: t("video_consultation") },
          { to: "/medecin/messages", icon: MessageSquare, label: t("messages") },
          { to: "/medecin/diagnostics", icon: Stethoscope, label: "Diagnostics" },
          { to: "/medecin/prescriptions", icon: Pill, label: t("prescriptions") },
          { to: "/medecin/records", icon: FileText, label: "Dossiers" },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/40 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><l.icon className="h-5 w-5" /></div>
            <span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
