import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, FileText, Home, MessageSquare, Pill, Stethoscope, Users, Video, CheckCircle2, XCircle } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/medecin")({
  head: () => ({ meta: [{ title: "Espace médecin — MediRural" }] }),
  component: DoctorDashboard,
});

interface ApptRow { id: string; scheduled_at: string; reason: string | null; status: string; patient_id: string; patient_name?: string; }

function DoctorDashboard() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [appts, setAppts] = useState<ApptRow[]>([]);
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => { if (user) void load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const [{ data: profile }, { data: doc }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("doctors").select("specialty, status").eq("id", user.id).maybeSingle(),
    ]);
    setProfileName(profile?.full_name ?? "");
    setSpecialty(doc?.specialty ?? "");
    setStatus(doc?.status ?? "pending");

    const { data: a } = await supabase
      .from("appointments")
      .select("id, scheduled_at, reason, status, patient_id")
      .eq("doctor_id", user.id)
      .order("scheduled_at", { ascending: true });
    if (a?.length) {
      const ids = [...new Set(a.map((x) => x.patient_id))];
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const m = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
      setAppts(a.map((x) => ({ ...x, patient_name: m.get(x.patient_id) ?? "Patient" })));
      setPatientCount(ids.length);
    } else {
      setAppts([]); setPatientCount(0);
    }
  };

  const updateStatus = async (id: string, newStatus: "confirmed" | "cancelled" | "completed") => {
    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rendez-vous mis à jour");
    void load();
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayAppts = appts.filter((a) => { const d = new Date(a.scheduled_at); return d >= today && d < tomorrow; });
  const upcoming = appts.filter((a) => new Date(a.scheduled_at) >= today && a.status !== "cancelled");
  const completed = appts.filter((a) => a.status === "completed").length;

  const nav = [
    { label: "Tableau de bord", icon: Home, active: true },
    { label: "Agenda", icon: CalendarDays },
    { label: "Patients", icon: Users },
    { label: "Téléconsultations", icon: Video },
    { label: "Messagerie", icon: MessageSquare },
    { label: "Diagnostics", icon: Stethoscope },
    { label: "Prescriptions", icon: Pill },
    { label: "Dossiers", icon: FileText },
  ];

  const initials = profileName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";

  return (
    <DashboardShell role={`Médecin · ${specialty}`} name={profileName || "Médecin"} initials={initials} nav={nav}>
      {status !== "approved" && (
        <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/10 p-5 text-sm">
          <p className="font-medium text-foreground">Compte en attente de validation</p>
          <p className="mt-1 text-muted-foreground">Un administrateur doit valider votre profil avant que les patients puissent vous contacter.</p>
        </div>
      )}

      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Aujourd'hui</p>
        <h1 className="text-display text-4xl">Dr. {profileName}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Consultations du jour" value={todayAppts.length} />
        <StatCard label="Patients" value={patientCount} hint="suivis" accent="success" />
        <StatCard label="Terminées" value={completed} hint="historique" accent="accent" />
        <StatCard label="À venir" value={upcoming.length} accent="warning" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">Agenda</h2>
          <span className="text-xs text-muted-foreground">{appts.length} rendez-vous</span>
        </div>
        {appts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun rendez-vous pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {appts.map((a) => (
              <div key={a.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="w-32 text-sm text-primary">{new Date(a.scheduled_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.patient_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.reason ?? "Consultation"}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] uppercase tracking-wider">{a.status}</span>
                {a.status === "pending" && (
                  <Button size="sm" onClick={() => updateStatus(a.id, "confirmed")} className="h-8 bg-success text-success-foreground hover:bg-success/90">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmer
                  </Button>
                )}
                {(a.status === "pending" || a.status === "confirmed") && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "completed")} className="h-8">Terminer</Button>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "cancelled")} className="h-8 text-destructive">
                      <XCircle className="h-4 w-4" />
                    </Button>
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
