import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface NavItem { label: string; icon: LucideIcon; active?: boolean }

interface Props {
  role: string;
  name: string;
  initials: string;
  nav: NavItem[];
  children: ReactNode;
}

export function DashboardShell({ role, name, initials, nav, children }: Props) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <Link to="/" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour au site
            </Link>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      item.active
                        ? "bg-primary-soft text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, accent = "primary" }: { label: string; value: string; hint?: string; accent?: "primary" | "success" | "warning" | "accent" }) {
  const accentClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning-foreground",
    accent: "text-accent-foreground",
  }[accent];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-display text-4xl ${accentClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
