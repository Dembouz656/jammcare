import { Activity, BarChart3, CalendarCheck2, CalendarDays, Clock, FileText, Home, MapPin, MessageSquare, Pill, Settings, ShieldCheck, Stethoscope, Users, Video } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

export function usePatientNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const a = (to: string) => path === to;
  return [
    { label: "Vue d'ensemble", icon: Home, to: "/patient", active: a("/patient") },
    { label: "Rendez-vous", icon: CalendarCheck2, to: "/patient/appointments", active: a("/patient/appointments") },
    { label: "Téléconsultation vidéo", icon: Video, to: "/patient/video", active: a("/patient/video") },
    { label: "Messages", icon: MessageSquare, to: "/patient/messages", active: a("/patient/messages") },
    { label: "Mon dossier", icon: FileText, to: "/patient/record", active: a("/patient/record") },
    { label: "Ordonnances", icon: Pill, to: "/patient/prescriptions", active: a("/patient/prescriptions") },
    { label: "Carte de santé", icon: MapPin, to: "/sante-map", active: a("/sante-map") },
    { label: "Paramètres", icon: Settings, to: "/patient/settings", active: a("/patient/settings") },
  ];
}

export function useDoctorNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const a = (to: string) => path === to;
  return [
    { label: "Vue d'ensemble", icon: Home, to: "/medecin", active: a("/medecin") },
    { label: "Agenda", icon: CalendarDays, to: "/medecin/agenda", active: a("/medecin/agenda") },
    { label: "Disponibilités", icon: Clock, to: "/medecin/availability", active: a("/medecin/availability") },
    { label: "Patients", icon: Users, to: "/medecin/patients", active: a("/medecin/patients") },
    { label: "Téléconsultation vidéo", icon: Video, to: "/medecin/video", active: a("/medecin/video") },
    { label: "Messages", icon: MessageSquare, to: "/medecin/messages", active: a("/medecin/messages") },
    { label: "Diagnostics", icon: Stethoscope, to: "/medecin/diagnostics", active: a("/medecin/diagnostics") },
    { label: "Ordonnances", icon: Pill, to: "/medecin/prescriptions", active: a("/medecin/prescriptions") },
    { label: "Dossiers", icon: FileText, to: "/medecin/records", active: a("/medecin/records") },
  ];
}

export function useAdminNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const a = (to: string) => path === to;
  return [
    { label: "Vue d'ensemble", icon: Home, to: "/admin", active: a("/admin") },
    { label: "Utilisateurs", icon: Users, to: "/admin/users", active: a("/admin/users") },
    { label: "Médecins", icon: Stethoscope, to: "/admin/validation", active: a("/admin/validation") },
    { label: "Statistiques", icon: BarChart3, to: "/admin/stats", active: a("/admin/stats") },
    { label: "Sécurité", icon: ShieldCheck, to: "/admin/security", active: a("/admin/security") },
    { label: "Activité", icon: Activity, to: "/admin/activity", active: a("/admin/activity") },
    { label: "Paramètres", icon: Settings, to: "/admin/settings", active: a("/admin/settings") },
  ];
}
