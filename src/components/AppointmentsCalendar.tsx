import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, type View, type SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { fr } as const;
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export interface ApptEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled" | string;
  raw?: unknown;
}

interface Props {
  events: ApptEvent[];
  onSelectEvent?: (e: ApptEvent) => void;
  onSelectSlot?: (s: SlotInfo) => void;
  selectable?: boolean;
  height?: number;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; fg: string }> = {
  pending: { bg: "hsl(var(--warning) / 0.18)", border: "hsl(var(--warning))", fg: "hsl(var(--foreground))" },
  confirmed: { bg: "hsl(var(--primary) / 0.18)", border: "hsl(var(--primary))", fg: "hsl(var(--primary))" },
  completed: { bg: "hsl(var(--success) / 0.18)", border: "hsl(var(--success))", fg: "hsl(var(--foreground))" },
  cancelled: { bg: "hsl(var(--destructive) / 0.15)", border: "hsl(var(--destructive))", fg: "hsl(var(--destructive))" },
};

export function AppointmentsCalendar({ events, onSelectEvent, onSelectSlot, selectable, height = 620 }: Props) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState<Date>(new Date());

  const eventPropGetter = useMemo(
    () => (event: ApptEvent) => {
      const c = STATUS_COLORS[event.status] ?? STATUS_COLORS.pending;
      return {
        style: {
          backgroundColor: c.bg,
          borderLeft: `3px solid ${c.border}`,
          color: c.fg,
          borderRadius: 6,
          padding: "2px 6px",
          fontSize: 12,
        },
      };
    },
    [],
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-soft" style={{ height }}>
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        defaultView={Views.WEEK}
        selectable={selectable}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent as (e: object) => void}
        eventPropGetter={eventPropGetter}
        culture="fr"
        messages={{
          month: "Mois", week: "Semaine", day: "Jour", today: "Aujourd'hui",
          previous: "Précédent", next: "Suivant", agenda: "Agenda",
          date: "Date", time: "Heure", event: "Événement", noEventsInRange: "Aucun rendez-vous",
          showMore: (n) => `+${n} de plus`,
        }}
        style={{ height: "100%" }}
      />
    </div>
  );
}
