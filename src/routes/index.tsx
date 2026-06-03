import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, Lock, HeartPulse, CalendarCheck2, Video, MessageSquare, FileText, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import heroImg from "@/assets/jammcare-hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JammCare — Télémédecine pour tous" },
      { name: "description", content: "JammCare connecte patients et médecins partout au Sénégal, en toute sécurité." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, role, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: role === "admin" ? "/admin" : role === "doctor" ? "/medecin" : "/patient" });
    }
  }, [user, role, loading, navigate]);

  const features = [
    { icon: CalendarCheck2, label: t("feature_book") },
    { icon: Video, label: t("feature_consult") },
    { icon: MessageSquare, label: t("feature_chat") },
    { icon: FileText, label: t("feature_records") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
            <HeartPulse className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-display text-xl">JammCare</span>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">{t("login")}</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground shadow-soft">
            <Link to="/auth" search={{ mode: "signup" }}>
              {t("get_started")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-mesh opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-32 sm:px-10 lg:grid-cols-2 lg:items-center lg:pt-36">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("app_tagline")}</p>
            <h1 className="mt-4 text-display text-5xl leading-[1.05] sm:text-6xl">
              {t("landing_title")}
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
              {t("landing_lead")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
                <Link to="/auth" search={{ mode: "signup" }}>
                  {t("get_started")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-card/60 backdrop-blur">
                <Link to="/auth">
                  {t("already_member")} {t("login")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-foreground">
                <Link to="/sante-map">
                  <MapPin className="mr-1 h-4 w-4" /> Carte de santé
                </Link>
              </Button>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              {t("secure_auth")} · JWT · RLS
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-primary/20 blur-2xl" aria-hidden />
            <img
              src={heroImg}
              alt="JammCare — La télémédecine au service de tous"
              className="relative w-full rounded-3xl border border-border shadow-elevated"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-medium leading-snug">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <footer className="bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-wider opacity-90">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {t("trust_secure")}</span>
            <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> {t("trust_private")}</span>
            <span className="inline-flex items-center gap-2"><HeartPulse className="h-4 w-4" /> {t("trust_human")}</span>
          </div>
          <p className="text-xs opacity-70">© {new Date().getFullYear()} JammCare</p>
        </div>
      </footer>
    </div>
  );
}
