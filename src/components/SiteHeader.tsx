import { Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
            <Stethoscope className="h-5 w-5 text-primary-foreground" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-display text-lg">MediRural</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Télémédecine</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#fonctionnalites" className="text-sm text-muted-foreground transition hover:text-foreground">Fonctionnalités</a>
          <a href="#parcours" className="text-sm text-muted-foreground transition hover:text-foreground">Parcours</a>
          <Link to="/patient" className="text-sm text-muted-foreground transition hover:text-foreground">Patient</Link>
          <Link to="/medecin" className="text-sm text-muted-foreground transition hover:text-foreground">Médecin</Link>
          <Link to="/admin" className="text-sm text-muted-foreground transition hover:text-foreground">Admin</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Connexion</Button>
          <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95">
            Créer un compte
          </Button>
        </div>
      </div>
    </header>
  );
}
