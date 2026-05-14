import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck2, FileText, Home, MessageSquare, Pill, Settings, Video, Plus } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient")({
  head: () => ({ meta: [{ title: "Espace patient — MediRural" }] }),
  component: PatientDashboard,
});

interface AppointmentRow {
  id: string;
  scheduled_at: string;
  reason: string | null;
  status: string;
  doctor_id: string;
  doctor_name?: string;
  specialty?: string;
}

interface DoctorRow { id: string; specialty: string; full_name: string; }

function PatientDashboard() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    setProfileName(profile?.full_name ?? "");

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, reason, status, doctor_id")
      .eq("patient_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (appts && appts.length) {
      const docIds = [...new Set(appts.map((a) => a.doctor_id))];
      const [{ data: profs }, { data: docs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", docIds),
        supabase.from("doctors").select("id, specialty").in("id", docIds),
      ]);
      const profMap = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
      const docMap = new Map(docs?.map((d) => [d.id, d.specialty]) ?? []);
      setAppointments(appts.map((a) => ({ ...a, doctor_name: profMap.get(a.doctor_id) ?? "Médecin", specialty: docMap.get(a.doctor_id) ?? "" })));
    } else {
      setAppointments([]);
    }

    const { data: approvedDocs } = await supabase
      .from("doctors")
      .select("id, specialty")
      .eq("status", "approved");
    if (approvedDocs?.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", approvedDocs.map((d) => d.id));
      const profMap = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
      setDoctors(approvedDocs.map((d) => ({ id: d.id, specialty: d.specialty, full_name: profMap.get(d.id) ?? "Médecin" })));
    }

    const { count: pCount } = await supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("patient_id", user.id);
    setPrescriptionCount(pCount ?? 0);
    const { count: mCount } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null);
    setUnreadMsgs(mCount ?? 0);
  };

  const bookAppointment = async () => {
    if (!user || !doctorId || !scheduledAt) {
      toast.error("Sélectionnez un médecin et une date");
      return;
    }
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctorId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      reason: reason || null,
      status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Rendez-vous demandé");
    setOpen(false); setDoctorId(""); setScheduledAt(""); setReason("");
    void load();
  };

  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= new Date() && a.status !== "cancelled");

  const nav = [
    { label: "Tableau de bord", icon: Home, active: true },
    { label: "Mes rendez-vous", icon: CalendarCheck2 },
    { label: "Téléconsultation", icon: Video },
    { label: "Messagerie", icon: MessageSquare },
    { label: "Mon dossier", icon: FileText },
    { label: "Ordonnances", icon: Pill },
    { label: "Paramètres", icon: Settings },
  ];

  const initials = profileName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";

  return (
    <DashboardShell role="Patient" name={profileName || "Patient"} initials={initials} nav={nav}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Bonjour</p>
          <h1 className="text-display text-4xl">{profileName || "Bienvenue"}</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-soft">
              <Plus className="mr-2 h-4 w-4" /> Nouveau rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Demander un rendez-vous</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Médecin</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un médecin" /></SelectTrigger>
                  <SelectContent>
                    {doctors.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Aucun médecin disponible</div>}
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name} — {d.specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date & heure</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Motif</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={bookAppointment} className="bg-gradient-primary text-primary-foreground">Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rendez-vous" value={upcoming.length} hint="à venir" />
        <StatCard label="Total consultations" value={appointments.filter((a) => a.status === "completed").length} hint="terminées" accent="success" />
        <StatCard label="Ordonnances" value={prescriptionCount} hint="reçues" accent="accent" />
        <StatCard label="Messages" value={unreadMsgs} hint="non lus" accent="warning" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-5 text-xl">Prochains rendez-vous</h2>
        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun rendez-vous à venir. Cliquez sur « Nouveau rendez-vous » pour en planifier un.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">{a.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">{a.specialty} · {a.reason ?? "Consultation"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{new Date(a.scheduled_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                  <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
