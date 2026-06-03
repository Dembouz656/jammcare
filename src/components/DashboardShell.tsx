import { Link } from "@tanstack/react-router";
import { LogOut, type LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/NotificationsBell";

interface NavItem { label: string; icon: LucideIcon; active?: boolean; onClick?: () => void; sectionId?: string; to?: string }

interface Props {
  role: string;
  name: string;
  initials: string;
  nav: NavItem[];
  children: ReactNode;
}

export function DashboardShell({ role, name, initials, nav, children }: Props) {
  const { signOut } = useAuth();
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <Link to="/" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground">
              MediRural
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
              {nav.map((item, idx) => {
                const Icon = item.icon;
                const baseCls = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  item.active
                    ? "bg-primary-soft text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`;
                if (item.to) {
                  return (
                    <Link key={`${item.label}-${idx}`} to={item.to} className={baseCls}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                }
                const handleClick = () => {
                  if (item.onClick) return item.onClick();
                  if (item.sectionId && typeof document !== "undefined") {
                    const el = document.getElementById(item.sectionId);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                };
                return (
                  <button
                    key={`${item.label}-${idx}`}
                    onClick={handleClick}
                    className={baseCls}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 space-y-2">
              <NotificationsBell />
              <LangSwitcher className="w-full justify-center" />
              <Button
                onClick={() => signOut()}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-display text-lg">MediRural</p>
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <LangSwitcher />
              <Button onClick={() => signOut()} variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, accent = "primary" }: { label: string; value: string | number; hint?: string; accent?: "primary" | "success" | "warning" | "accent" }) {
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
