import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CalendarCheck2, FileLock2, MessageSquare, ShieldCheck, Stethoscope, Video, Wifi, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroImage from "@/assets/hero-telemedicine.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediRural — Télémédecine pour les zones rurales" },
      { name: "description", content: "Plateforme de téléconsultation, prise de rendez-vous et dossier médical électronique conçue pour les zones rurales." },
      { property: "og:title", content: "MediRural — Télémédecine rurale" },
      { property: "og:description", content: "Soins spécialisés à distance, où que vous soyez." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <TrustBar />
      <Features />
      <Journey />
      <Roles />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 bg-mesh" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-12 lg:gap-8 lg:pt-24">
        <div className="lg:col-span-6 lg:pt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Pensé pour les zones rurales et les connexions faibles
          </div>
          <h1 className="mt-6 text-display text-5xl text-foreground sm:text-6xl lg:text-7xl">
            Le médecin,<br />
            <span className="italic text-primary">à portée de village.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            MediRural rapproche les patients ruraux des professionnels de santé grâce à la téléconsultation vidéo,
            au chat sécurisé et au dossier médical électronique — sur mobile, même avec une faible bande passante.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
              <Link to="/patient">
                Espace patient <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border bg-card/60 backdrop-blur">
              <Link to="/medecin">Espace médecin</Link>
            </Button>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Médecins</dt>
              <dd className="mt-1 text-display text-3xl text-foreground">280+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Communes</dt>
              <dd className="mt-1 text-display text-3xl text-foreground">1 200</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Disponibilité</dt>
              <dd className="mt-1 text-display text-3xl text-foreground">24/7</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-6">
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-primary/20 blur-2xl" aria-hidden />
            <img
              src={heroImage}
              alt="Téléconsultation entre un médecin et une patiente avec un paysage rural en arrière-plan"
              width={1536}
              height={1152}
              className="relative rounded-3xl border border-border shadow-elevated"
            />
            <div className="absolute -bottom-6 -left-6 hidden w-64 rounded-2xl border border-border bg-card p-4 shadow-elevated md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Connexion sécurisée</p>
                  <p className="text-xs text-muted-foreground">Chiffrement de bout en bout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: "JWT + bcrypt" },
    { icon: FileLock2, label: "Dossiers chiffrés" },
    { icon: Wifi, label: "Mode faible débit" },
    { icon: Activity, label: "Audit & traçabilité" },
  ];
  return (
    <div className="border-y border-border bg-surface/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-6">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const features = [
    { icon: Video, title: "Téléconsultation vidéo", desc: "Appels WebRTC haute qualité avec basculement automatique vers le chat en cas de connexion instable." },
    { icon: CalendarCheck2, title: "Rendez-vous intelligents", desc: "Recherche par spécialité, disponibilité en temps réel et rappels automatiques." },
    { icon: FileLock2, title: "Dossier médical électronique", desc: "Antécédents, ordonnances et examens centralisés, accessibles uniquement aux soignants autorisés." },
    { icon: MessageSquare, title: "Messagerie temps réel", desc: "Chat Socket.io chiffré entre patient et médecin, avec notifications instantanées." },
    { icon: Stethoscope, title: "Diagnostic & prescription", desc: "Le médecin rédige son diagnostic et délivre une ordonnance numérique signée." },
    { icon: ShieldCheck, title: "Sécurité par défaut", desc: "Authentification JWT, hachage bcrypt, RBAC et journalisation complète des accès." },
  ];
  return (
    <section id="fonctionnalites" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Fonctionnalités</p>
          <h2 className="mt-3 text-display text-4xl sm:text-5xl">Tout ce qu'il faut pour soigner à distance.</h2>
          <p className="mt-4 text-muted-foreground">
            Une suite complète pensée pour patients, médecins et administrateurs — sans compromis sur la sécurité ni sur l'accessibilité.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elevated">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Journey() {
  const steps = [
    { n: "01", t: "Créez votre compte", d: "Inscription simple en 2 minutes, validation par e-mail." },
    { n: "02", t: "Choisissez un médecin", d: "Filtrez par spécialité, langue et disponibilité." },
    { n: "03", t: "Consultez en vidéo", d: "Lancez votre téléconsultation depuis n'importe quel appareil." },
    { n: "04", t: "Recevez votre ordonnance", d: "Diagnostic, prescription et historique archivés dans votre dossier." },
  ];
  return (
    <section id="parcours" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Parcours patient</p>
            <h2 className="mt-3 text-display text-4xl sm:text-5xl">De la prise de rendez-vous à l'ordonnance.</h2>
          </div>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="bg-card p-7">
              <p className="text-display text-5xl text-primary/70">{s.n}</p>
              <h3 className="mt-6 text-lg">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roles() {
  const roles = [
    { t: "Patient", d: "Rendez-vous, téléconsultation, historique, messagerie.", to: "/patient" as const },
    { t: "Médecin", d: "Agenda, dossiers, diagnostics, prescriptions.", to: "/medecin" as const },
    { t: "Administrateur", d: "Utilisateurs, validation, statistiques, supervision.", to: "/admin" as const },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((r) => (
            <Link
              key={r.t}
              to={r.to}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft transition hover:shadow-elevated"
            >
              <div className="absolute right-6 top-6 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary">
                <ArrowRight className="h-5 w-5" />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espace</p>
              <h3 className="mt-3 text-display text-3xl">{r.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{r.d}</p>
              <div className="mt-8 h-px bg-gradient-to-r from-primary/40 to-transparent" />
              <p className="mt-3 text-xs text-primary">Voir la maquette →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-6 pb-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-primary p-12 text-primary-foreground sm:p-16">
        <div className="absolute inset-0 bg-mesh opacity-30" aria-hidden />
        <div className="relative max-w-2xl">
          <h2 className="text-display text-4xl sm:text-5xl">Lancez votre première téléconsultation aujourd'hui.</h2>
          <p className="mt-4 text-primary-foreground/80">
            Rejoignez la plateforme conçue pour rapprocher les villages des soins spécialisés.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" className="bg-card text-foreground hover:bg-card/90">
              Créer mon compte patient
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              Je suis médecin
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
