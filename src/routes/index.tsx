import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Stethoscope, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediRural — Télémédecine" },
      { name: "description", content: "Connectez-vous à votre espace de télémédecine." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: role === "admin" ? "/admin" : role === "doctor" ? "/medecin" : "/patient" });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero px-6">
      <div className="absolute inset-0 bg-mesh opacity-60" aria-hidden />
      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Stethoscope className="h-8 w-8 text-primary-foreground" strokeWidth={2.25} />
        </div>
        <h1 className="mt-8 text-display text-5xl text-foreground sm:text-6xl">MediRural</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Télémédecine rurale
        </p>
        <p className="mx-auto mt-6 max-w-sm text-base text-muted-foreground">
          Accédez à votre espace sécurisé pour gérer vos consultations.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
            <Link to="/auth">
              Connexion <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-border bg-card/60 backdrop-blur">
            <Link to="/auth" search={{ mode: "signup" }}>Créer un compte</Link>
          </Button>
        </div>

        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Authentification chiffrée · JWT · RLS
        </div>
      </div>
    </div>
  );
}
