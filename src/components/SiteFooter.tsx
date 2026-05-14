import { Stethoscope } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                <Stethoscope className="h-5 w-5 text-primary-foreground" strokeWidth={2.25} />
              </div>
              <span className="text-display text-lg">MediRural</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Plateforme de télémédecine conçue pour rapprocher les patients ruraux des soins spécialisés, avec une exigence absolue de sécurité et de simplicité.
            </p>
          </div>
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-foreground">Plateforme</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Téléconsultation</li>
              <li>Dossier médical</li>
              <li>Prescriptions</li>
              <li>Messagerie sécurisée</li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-foreground">Conformité</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Données chiffrées</li>
              <li>Hébergement santé</li>
              <li>Authentification forte</li>
              <li>Audit & traçabilité</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} MediRural — Mémoire de fin d'études.</p>
          <p>Conçu pour les zones rurales · Optimisé connexions faibles</p>
        </div>
      </div>
    </footer>
  );
}
