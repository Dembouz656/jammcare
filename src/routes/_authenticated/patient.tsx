import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useI18n } from "@/lib/i18n";
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
interface AvailRow { weekday: number; start_time: string; end_time: string; slot_minutes: number; }

function PatientDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profileName, setProfileName] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [availSlots, setAvailSlots] = useState<string[]>([]);

  useEffect(() => { if (user) void load(); }, [user]);

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
      .from("doctors").select("id, specialty").eq("status", "approved");
    if (approvedDocs?.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", approvedDocs.map((d) => d.id));
      const profMap = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
      setDoctors(approvedDocs.map((d) => ({ id: d.id, specialty: d.specialty, full_name: profMap.get(d.id) ?? "Médecin" })));
    } else {
      setDoctors([]);
    }

    const { count: pCount } = await supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("patient_id", user.id);
    setPrescriptionCount(pCount ?? 0);
    const { count: mCount } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null);
    setUnreadMsgs(mCount ?? 0);
  };

  // Compute slots when doctor + date change
  useEffect(() => {
    if (!doctorId || !date) { setAvailSlots([]); return; }
    (async () => {
      const d = new Date(date + "T00:00:00");
      const weekday = d.getDay();
      const { data: avails } = await supabase
        .from("doctor_availability")
        .select("weekday, start_time, end_time, slot_minutes")
        .eq("doctor_id", doctorId)
        .eq("weekday", weekday) as { data: AvailRow[] | null };
      if (!avails || !avails.length) { setAvailSlots([]); return; }

      const dayStart = new Date(date + "T00:00:00");
      const dayEnd = new Date(date + "T23:59:59");
      const { data: booked } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("doctor_id", doctorId)
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString())
        .neq("status", "cancelled");
      const bookedSet = new Set((booked ?? []).map((b) => new Date(b.scheduled_at).getTime()));

      const slots: string[] = [];
      for (const a of avails) {
        const [sh, sm] = a.start_time.split(":").map(Number);
        const [eh, em] = a.end_time.split(":").map(Number);
        const start = new Date(date + "T00:00:00"); start.setHours(sh, sm, 0, 0);
        const end = new Date(date + "T00:00:00"); end.setHours(eh, em, 0, 0);
        for (let t = start.getTime(); t + a.slot_minutes * 60000 <= end.getTime(); t += a.slot_minutes * 60000) {
          if (t < Date.now()) continue;
          if (bookedSet.has(t)) continue;
          slots.push(new Date(t).toISOString());
        }
      }
      setAvailSlots(slots);
    })();
  }, [doctorId, date]);

  const bookAppointment = async () => {
    if (!user || !doctorId || !slot) {
      toast.error(t("select_doctor_date"));
      return;
    }
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctorId,
      scheduled_at: slot,
      reason: reason || null,
      status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t("appointment_requested"));
    setOpen(false); setDoctorId(""); setDate(""); setSlot(""); setReason("");
    void load();
  };

  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= new Date(Date.now() - 3600000) && a.status !== "cancelled");

  const nav = [
    { label: t("overview"), icon: Home, sectionId: "overview", active: true },
    { label: t("appointments"), icon: CalendarCheck2, sectionId: "appointments" },
    { label: t("video_consultation"), icon: Video, sectionId: "video" },
    { label: t("messages"), icon: MessageSquare, sectionId: "messages" },
    { label: t("my_record"), icon: FileText, sectionId: "record" },
    { label: t("prescriptions"), icon: Pill, sectionId: "prescriptions" },
    { label: t("settings"), icon: Settings, sectionId: "settings" },
  ];

  const initials = profileName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";

  return (
    <DashboardShell role={t("patient")} name={profileName || t("patient")} initials={initials} nav={nav}>
      <div id="overview" className="mb-8 flex flex-wrap items-end justify-between gap-4 scroll-mt-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("hello")}</p>
          <h1 className="text-display text-4xl">{profileName || t("welcome")}</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-soft">
              <Plus className="mr-2 h-4 w-4" /> {t("new_appointment")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("request_appointment")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("doctor")}</Label>
                <Select value={doctorId} onValueChange={(v) => { setDoctorId(v); setSlot(""); }}>
                  <SelectTrigger><SelectValue placeholder={t("choose_doctor")} /></SelectTrigger>
                  <SelectContent>
                    {doctors.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">{t("no_doctor_available")}</div>}
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name} — {d.specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("date")}</Label>
                <Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => { setDate(e.target.value); setSlot(""); }} />
              </div>
              {doctorId && date && (
                <div className="space-y-2">
                  <Label>{t("available_slot")}</Label>
                  {availSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("no_slot")}</p>
                  ) : (
                    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                      {availSlots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlot(s)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                            slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          {new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("reason")}</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={bookAppointment} className="bg-gradient-primary text-primary-foreground" disabled={!slot}>{t("confirm")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("appointments")} value={upcoming.length} hint={t("upcoming")} />
        <StatCard label={t("total_consultations")} value={appointments.filter((a) => a.status === "completed").length} hint={t("completed")} accent="success" />
        <StatCard label={t("prescriptions")} value={prescriptionCount} hint={t("received")} accent="accent" />
        <StatCard label={t("messages")} value={unreadMsgs} hint={t("unread")} accent="warning" />
      </div>

      <div id="appointments" className="mt-6 scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-5 text-xl">{t("next_appointments")}</h2>
        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("no_upcoming")}</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">{a.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">{a.specialty} · {a.reason ?? "Consultation"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(a.scheduled_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                    <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">{a.status}</span>
                  </div>
                  {a.status === "confirmed" && (
                    <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground">
                      <Link to="/call/$id" params={{ id: a.id }}>
                        <Video className="mr-1 h-3.5 w-3.5" /> {t("join_call")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
