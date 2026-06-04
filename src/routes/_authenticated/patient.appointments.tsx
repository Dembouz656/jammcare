import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Video, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { AppointmentsCalendar, type ApptEvent } from "@/components/AppointmentsCalendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { usePatientNav } from "@/lib/dashboard-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/appointments")({
  component: PatientAppointments,
});

interface ApptRow { id: string; scheduled_at: string; reason: string | null; status: string; doctor_id: string; doctor_name?: string; specialty?: string; }
interface DoctorRow { id: string; specialty: string; full_name: string; }
interface AvailRow { weekday: number; start_time: string; end_time: string; slot_minutes: number; }

function PatientAppointments() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = usePatientNav();
  const [profileName, setProfileName] = useState("");
  const [appointments, setAppointments] = useState<ApptRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
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
    const { data: appts } = await supabase.from("appointments").select("id, scheduled_at, reason, status, doctor_id").eq("patient_id", user.id).order("scheduled_at");
    if (appts?.length) {
      const ids = [...new Set(appts.map((a) => a.doctor_id))];
      const [{ data: profs }, { data: docs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", ids),
        supabase.from("doctors").select("id, specialty").in("id", ids),
      ]);
      const pm = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
      const dm = new Map(docs?.map((d) => [d.id, d.specialty]) ?? []);
      setAppointments(appts.map((a) => ({ ...a, doctor_name: pm.get(a.doctor_id) ?? "Médecin", specialty: dm.get(a.doctor_id) ?? "" })));
    } else setAppointments([]);
    const { data: approved } = await supabase.from("doctors").select("id, specialty").eq("status", "approved");
    if (approved?.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", approved.map((d) => d.id));
      const pm = new Map(profs?.map((p) => [p.id, p.full_name]) ?? []);
      setDoctors(approved.map((d) => ({ id: d.id, specialty: d.specialty, full_name: pm.get(d.id) ?? "Médecin" })));
    } else setDoctors([]);
  };

  useEffect(() => {
    if (!doctorId || !date) { setAvailSlots([]); return; }
    (async () => {
      const weekday = new Date(date + "T00:00:00").getDay();
      const { data: avails } = await supabase.from("doctor_availability").select("weekday, start_time, end_time, slot_minutes").eq("doctor_id", doctorId).eq("weekday", weekday) as { data: AvailRow[] | null };
      if (!avails?.length) { setAvailSlots([]); return; }
      const dayStart = new Date(date + "T00:00:00"); const dayEnd = new Date(date + "T23:59:59");
      const { data: booked } = await supabase.from("appointments").select("scheduled_at").eq("doctor_id", doctorId).gte("scheduled_at", dayStart.toISOString()).lte("scheduled_at", dayEnd.toISOString()).neq("status", "cancelled");
      const bset = new Set((booked ?? []).map((b) => new Date(b.scheduled_at).getTime()));
      const slots: string[] = [];
      for (const a of avails) {
        const [sh, sm] = a.start_time.split(":").map(Number);
        const [eh, em] = a.end_time.split(":").map(Number);
        const s = new Date(date + "T00:00:00"); s.setHours(sh, sm, 0, 0);
        const e = new Date(date + "T00:00:00"); e.setHours(eh, em, 0, 0);
        for (let t = s.getTime(); t + a.slot_minutes * 60000 <= e.getTime(); t += a.slot_minutes * 60000) {
          if (t < Date.now() || bset.has(t)) continue;
          slots.push(new Date(t).toISOString());
        }
      }
      setAvailSlots(slots);
    })();
  }, [doctorId, date]);

  const book = async () => {
    if (!user || !doctorId || !slot) { toast.error(t("select_doctor_date")); return; }
    const { error } = await supabase.from("appointments").insert({ patient_id: user.id, doctor_id: doctorId, scheduled_at: slot, reason: reason || null, status: "pending" });
    if (error) { toast.error(error.message); return; }
    toast.success(t("appointment_requested"));
    setOpen(false); setDoctorId(""); setDate(""); setSlot(""); setReason("");
    void load();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rendez-vous annulé");
    void load();
  };

  const events = useMemo<ApptEvent[]>(
    () =>
      appointments
        .filter((a) => a.status !== "cancelled")
        .map((a) => {
          const start = new Date(a.scheduled_at);
          const end = new Date(start.getTime() + 30 * 60000);
          return { id: a.id, title: `${a.doctor_name ?? "Médecin"} — ${a.reason ?? "Consultation"}`, start, end, status: a.status };
        }),
    [appointments],
  );

  const initials = profileName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "P";

  return (
    <DashboardShell role={t("patient")} name={profileName || t("patient")} initials={initials} nav={nav}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display text-3xl">{t("appointments")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> {t("new_appointment")}</Button>
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
                    {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name} — {d.specialty}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("date")}</Label><Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => { setDate(e.target.value); setSlot(""); }} /></div>
              {doctorId && date && (
                <div className="space-y-2">
                  <Label>{t("available_slot")}</Label>
                  {availSlots.length === 0 ? <p className="text-sm text-muted-foreground">{t("no_slot")}</p> : (
                    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                      {availSlots.map((s) => (
                        <button key={s} type="button" onClick={() => setSlot(s)} className={`rounded-lg border px-3 py-1.5 text-sm transition ${slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}>
                          {new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2"><Label>{t("reason")}</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></div>
            </div>
            <DialogFooter><Button onClick={book} className="bg-gradient-primary text-primary-foreground" disabled={!slot}>{t("confirm")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-6">
        <AppointmentsCalendar events={events} />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {appointments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("no_upcoming")}</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
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
                      <Link to="/call/$id" params={{ id: a.id }}><Video className="mr-1 h-3.5 w-3.5" /> {t("join_call")}</Link>
                    </Button>
                  )}
                  {(a.status === "pending" || a.status === "confirmed") && (
                    <Button size="sm" variant="ghost" onClick={() => cancel(a.id)} className="h-8 text-destructive">
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Annuler
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
