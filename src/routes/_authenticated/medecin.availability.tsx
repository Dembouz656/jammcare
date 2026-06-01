import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useDoctorNav } from "@/lib/dashboard-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/medecin/availability")({ component: Page });

interface AvailRow { id: string; weekday: number; start_time: string; end_time: string; slot_minutes: number; }

function Page() {
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = useDoctorNav();
  const [name, setName] = useState("");
  const [avails, setAvails] = useState<AvailRow[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AvailRow | null>(null);
  const [days, setDays] = useState<number[]>([1]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [slot, setSlot] = useState("30");

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    setName(p?.full_name ?? "");
    const { data: av } = await supabase.from("doctor_availability").select("id, weekday, start_time, end_time, slot_minutes").eq("doctor_id", user.id).order("weekday");
    setAvails((av ?? []) as AvailRow[]);
  };
  useEffect(() => { void load(); }, [user]);

  const preview = (() => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const step = Number(slot) || 30;
    const sMin = sh * 60 + sm, eMin = eh * 60 + em;
    if (eMin <= sMin || step <= 0) return [];
    const out: string[] = [];
    for (let t = sMin; t + step <= eMin; t += step) out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    return out;
  })();

  const add = async () => {
    if (!user || days.length === 0) { toast.error("Sélectionnez au moins un jour"); return; }
    const rows = days.map((d) => ({ doctor_id: user.id, weekday: d, start_time: start, end_time: end, slot_minutes: Number(slot) }));
    const { error } = await supabase.from("doctor_availability").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} créneau(x) ajouté(s)`);
    setOpen(false); void load();
  };
  const del = async (id: string) => { await supabase.from("doctor_availability").delete().eq("id", id); void load(); };
  const save = async () => {
    if (!edit) return;
    const { error } = await supabase.from("doctor_availability").update({ start_time: edit.start_time, end_time: edit.end_time, slot_minutes: edit.slot_minutes, weekday: edit.weekday }).eq("id", edit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mis à jour"); setEdit(null); void load();
  };

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "Dr";
  return (
    <DashboardShell role={t("doctor")} name={name || t("doctor")} initials={initials} nav={nav}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-display text-3xl"><Clock className="h-7 w-7 text-primary" /> {t("manage_availability")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> {t("add_slot")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("add_slot")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label>{t("weekday")}</Label>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => setDays([1, 2, 3, 4, 5, 6, 0])} className="text-primary hover:underline">Tous</button>
                    <button type="button" onClick={() => setDays([])} className="text-muted-foreground hover:underline">Aucun</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <label key={d} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-secondary">
                      <Checkbox checked={days.includes(d)} onCheckedChange={() => setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort())} />
                      <span>{t(`d${d}` as "d0")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2"><Label>{t("start")}</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
                <div className="space-y-2"><Label>{t("end")}</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
                <div className="space-y-2"><Label>min</Label><Input type="number" min={10} max={120} value={slot} onChange={(e) => setSlot(e.target.value)} /></div>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="mb-2 text-xs text-muted-foreground">{t("generated_slots")} · {preview.length * Math.max(days.length, 1)} {t("slots_count")}</p>
                {preview.length === 0 ? <p className="text-xs text-destructive">⚠ {t("no_slot")}</p> : (
                  <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                    {preview.map((s) => <span key={s} className="rounded-md bg-primary-soft px-2 py-0.5 text-xs text-primary">{s}</span>)}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter><Button onClick={add} className="bg-gradient-primary text-primary-foreground">{t("confirm")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        {avails.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t("no_availability")}</p> : (
          <ul className="space-y-2">
            {avails.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <div><p className="font-medium">{t(`d${a.weekday}` as "d0")}</p><p className="text-xs text-muted-foreground">{a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)} · {a.slot_minutes}min</p></div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEdit(a)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(a.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("edit")}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <button key={d} type="button" onClick={() => setEdit({ ...edit, weekday: d })} className={`rounded-lg border px-2 py-1.5 text-xs ${edit.weekday === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}>{t(`d${d}` as "d0").slice(0, 3)}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2"><Label>{t("start")}</Label><Input type="time" value={edit.start_time.slice(0, 5)} onChange={(e) => setEdit({ ...edit, start_time: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("end")}</Label><Input type="time" value={edit.end_time.slice(0, 5)} onChange={(e) => setEdit({ ...edit, end_time: e.target.value })} /></div>
                <div className="space-y-2"><Label>min</Label><Input type="number" min={10} max={120} value={edit.slot_minutes} onChange={(e) => setEdit({ ...edit, slot_minutes: Number(e.target.value) })} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)}>{t("cancel")}</Button>
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">{t("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
