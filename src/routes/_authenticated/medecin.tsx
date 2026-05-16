import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, FileText, Home, MessageSquare, Pill, Stethoscope, Users, Video, CheckCircle2, XCircle, Plus, Trash2, Clock, Pencil } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/medecin")({
  head: () => ({ meta: [{ title: "Espace médecin — MediRural" }] }),
  component: DoctorDashboard,
});

interface ApptRow { id: string; scheduled_at: string; reason: string | null; status: string; patient_id: string; patient_name?: string; }
interface AvailRow { id: string; weekday: number; start_time: string; end_time: string; slot_minutes: number; }

function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profileName, setProfileName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [appts, setAppts] = useState<ApptRow[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [avails, setAvails] = useState<AvailRow[]>([]);

  const [availOpen, setAvailOpen] = useState(false);
  const [editAvail, setEditAvail] = useState<AvailRow | null>(null);
  const [newWeekdays, setNewWeekdays] = useState<number[]>([1]);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");
  const [newSlot, setNewSlot] = useState("30");

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

    const { data: av } = await supabase
      .from("doctor_availability")
      .select("id, weekday, start_time, end_time, slot_minutes")
      .eq("doctor_id", user.id)
      .order("weekday", { ascending: true });
    setAvails((av ?? []) as AvailRow[]);
  };

  const updateStatus = async (id: string, newStatus: "confirmed" | "cancelled" | "completed") => {
    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rendez-vous mis à jour");
    void load();
  };

  const addAvail = async () => {
    if (!user || newWeekdays.length === 0) {
      toast.error("Sélectionnez au moins un jour");
      return;
    }
    const rows = newWeekdays.map((d) => ({
      doctor_id: user.id,
      weekday: d,
      start_time: newStart,
      end_time: newEnd,
      slot_minutes: Number(newSlot),
    }));
    const { error } = await supabase.from("doctor_availability").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} créneau(x) ajouté(s)`);
    setAvailOpen(false);
    void load();
  };

  const toggleDay = (d: number) =>
    setNewWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  const allDays = () => setNewWeekdays([1, 2, 3, 4, 5, 6, 0]);
  const clearDays = () => setNewWeekdays([]);

  const delAvail = async (id: string) => {
    const { error } = await supabase.from("doctor_availability").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void load();
  };

  const saveEdit = async () => {
    if (!editAvail) return;
    const { error } = await supabase.from("doctor_availability").update({
      start_time: editAvail.start_time,
      end_time: editAvail.end_time,
      slot_minutes: editAvail.slot_minutes,
      weekday: editAvail.weekday,
    }).eq("id", editAvail.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Disponibilité mise à jour");
    setEditAvail(null);
    void load();
  };

  // Preview slots that would be generated by current form values
  const previewSlots = (() => {
    const [sh, sm] = newStart.split(":").map(Number);
    const [eh, em] = newEnd.split(":").map(Number);
    const step = Number(newSlot) || 30;
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin || step <= 0) return [];
    const times: string[] = [];
    for (let t = startMin; t + step <= endMin; t += step) {
      times.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    }
    return times;
  })();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayAppts = appts.filter((a) => { const d = new Date(a.scheduled_at); return d >= today && d < tomorrow; });
  const upcoming = appts.filter((a) => new Date(a.scheduled_at) >= today && a.status !== "cancelled");
  const completed = appts.filter((a) => a.status === "completed").length;

  const nav = [
    { label: t("overview"), icon: Home, sectionId: "overview", active: true },
    { label: t("agenda"), icon: CalendarDays, sectionId: "agenda" },
    { label: t("availability"), icon: Clock, sectionId: "availability" },
    { label: t("patients"), icon: Users, sectionId: "agenda" },
    { label: t("video_consultation"), icon: Video, sectionId: "agenda" },
    { label: t("messages"), icon: MessageSquare, sectionId: "agenda" },
    { label: "Diagnostics", icon: Stethoscope, sectionId: "agenda" },
    { label: t("prescriptions"), icon: Pill, sectionId: "agenda" },
    { label: "Dossiers", icon: FileText, sectionId: "agenda" },
  ];

  const initials = profileName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";

  return (
    <DashboardShell role={`${t("doctor")} · ${specialty}`} name={profileName || t("doctor")} initials={initials} nav={nav}>
      {status !== "approved" && (
        <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/10 p-5 text-sm">
          <p className="font-medium text-foreground">{t("pending_validation")}</p>
          <p className="mt-1 text-muted-foreground">{t("pending_validation_desc")}</p>
        </div>
      )}

      <div id="overview" className="mb-8 scroll-mt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("today")}</p>
        <h1 className="text-display text-4xl">Dr. {profileName}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("consultations_today")} value={todayAppts.length} />
        <StatCard label={t("patients")} value={patientCount} hint={t("followed")} accent="success" />
        <StatCard label={t("completed")} value={completed} accent="accent" />
        <StatCard label={t("to_come")} value={upcoming.length} accent="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div id="agenda" className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl">{t("agenda")}</h2>
            <span className="text-xs text-muted-foreground">{appts.length} {t("appointments").toLowerCase()}</span>
          </div>
          {appts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("no_appointments")}</p>
          ) : (
            <div className="space-y-2">
              {appts.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="w-32 text-sm text-primary">{new Date(a.scheduled_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.patient_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.reason ?? "Consultation"}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] uppercase tracking-wider">{a.status}</span>
                  {a.status === "pending" && (
                    <Button size="sm" onClick={() => updateStatus(a.id, "confirmed")} className="h-8 bg-success text-success-foreground hover:bg-success/90">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {t("confirm")}
                    </Button>
                  )}
                  {a.status === "confirmed" && (
                    <Button asChild size="sm" className="h-8 bg-gradient-primary text-primary-foreground">
                      <Link to="/call/$id" params={{ id: a.id }}>
                        <Video className="mr-1 h-3.5 w-3.5" /> {t("join_call")}
                      </Link>
                    </Button>
                  )}
                  {(a.status === "pending" || a.status === "confirmed") && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "completed")} className="h-8">{t("finish")}</Button>
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

        <div id="availability" className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl"><Clock className="h-5 w-5 text-primary" /> {t("manage_availability")}</h2>
            <Dialog open={availOpen} onOpenChange={setAvailOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("add_slot")}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("weekday")}</Label>
                      <div className="flex gap-2 text-xs">
                        <button type="button" onClick={allDays} className="text-primary hover:underline">Tous</button>
                        <button type="button" onClick={clearDays} className="text-muted-foreground hover:underline">Aucun</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <label key={d} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm cursor-pointer hover:bg-secondary">
                          <Checkbox checked={newWeekdays.includes(d)} onCheckedChange={() => toggleDay(d)} />
                          <span>{t(`d${d}` as "d0")}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2"><Label>{t("start")}</Label><Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} /></div>
                    <div className="space-y-2"><Label>{t("end")}</Label><Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} /></div>
                    <div className="space-y-2"><Label>min</Label><Input type="number" min={10} max={120} value={newSlot} onChange={(e) => setNewSlot(e.target.value)} /></div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      {t("generated_slots")} · {previewSlots.length * Math.max(newWeekdays.length, 1)} {t("slots_count")}
                    </p>
                    {previewSlots.length === 0 ? (
                      <p className="text-xs text-destructive">⚠ {t("no_slot")}</p>
                    ) : (
                      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                        {previewSlots.map((s) => (
                          <span key={s} className="rounded-md bg-primary-soft px-2 py-0.5 text-xs text-primary">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter><Button onClick={addAvail} className="bg-gradient-primary text-primary-foreground">{t("confirm")}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {avails.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("no_availability")}</p>
          ) : (
            <ul className="space-y-2">
              {avails.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{t(`d${a.weekday}` as "d0")}</p>
                    <p className="text-xs text-muted-foreground">{a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)} · {a.slot_minutes}min</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditAvail(a)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" title={t("edit")}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => delAvail(a.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title={t("delete")}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={!!editAvail} onOpenChange={(o) => !o && setEditAvail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("edit")} · {editAvail && t(`d${editAvail.weekday}` as "d0")}</DialogTitle></DialogHeader>
          {editAvail && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t("weekday")}</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditAvail({ ...editAvail, weekday: d })}
                      className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                        editAvail.weekday === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"
                      }`}
                    >{t(`d${d}` as "d0").slice(0, 3)}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2"><Label>{t("start")}</Label><Input type="time" value={editAvail.start_time.slice(0, 5)} onChange={(e) => setEditAvail({ ...editAvail, start_time: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("end")}</Label><Input type="time" value={editAvail.end_time.slice(0, 5)} onChange={(e) => setEditAvail({ ...editAvail, end_time: e.target.value })} /></div>
                <div className="space-y-2"><Label>min</Label><Input type="number" min={10} max={120} value={editAvail.slot_minutes} onChange={(e) => setEditAvail({ ...editAvail, slot_minutes: Number(e.target.value) })} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditAvail(null)}>{t("cancel")}</Button>
            <Button onClick={saveEdit} className="bg-gradient-primary text-primary-foreground">{t("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
