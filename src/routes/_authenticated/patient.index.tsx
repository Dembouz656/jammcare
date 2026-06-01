import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck2, MessageSquare, Pill, Video } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { usePatientNav } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/_authenticated/patient/")({
  component: PatientOverview,
});

function PatientOverview() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = usePatientNav();
  const [profileName, setProfileName] = useState("");
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, prescriptions: 0, unread: 0 });

  useEffect(() => { if (user) void load(); }, [user]);
  const load = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    setProfileName(profile?.full_name ?? "");
    const { data: appts } = await supabase.from("appointments").select("status, scheduled_at").eq("patient_id", user.id);
    const upcoming = (appts ?? []).filter((a) => new Date(a.scheduled_at) >= new Date(Date.now() - 3600000) && a.status !== "cancelled").length;
    const completed = (appts ?? []).filter((a) => a.status === "completed").length;
    const { count: pCount } = await supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("patient_id", user.id);
    const { count: mCount } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null);
    setStats({ upcoming, completed, prescriptions: pCount ?? 0, unread: mCount ?? 0 });
  };

  const initials = profileName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";

  return (
    <DashboardShell role={t("patient")} name={profileName || t("patient")} initials={initials} nav={nav}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("hello")}</p>
          <h1 className="text-display text-4xl">{profileName || t("welcome")}</h1>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-soft">
          <Link to="/patient/appointments">{t("new_appointment")}</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("appointments")} value={stats.upcoming} hint={t("upcoming")} />
        <StatCard label={t("total_consultations")} value={stats.completed} hint={t("completed")} accent="success" />
        <StatCard label={t("prescriptions")} value={stats.prescriptions} hint={t("received")} accent="accent" />
        <StatCard label={t("messages")} value={stats.unread} hint={t("unread")} accent="warning" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/patient/appointments" icon={CalendarCheck2} label={t("appointments")} />
        <QuickLink to="/patient/video" icon={Video} label={t("video_consultation")} />
        <QuickLink to="/patient/messages" icon={MessageSquare} label={t("messages")} />
        <QuickLink to="/patient/prescriptions" icon={Pill} label={t("prescriptions")} />
      </div>
    </DashboardShell>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/40 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
