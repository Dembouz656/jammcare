# Self-hosting JammCare sur Vercel (Node.js)

Ce projet utilise par défaut le preset `@lovable.dev/vite-tanstack-config`
ciblant Cloudflare Workers. Pour héberger sur **Vercel en Node.js**, il faut
**éjecter** ce preset et basculer TanStack Start vers le runtime Node.

> ⚠️ Procédure manuelle à effectuer sur un **fork GitHub** du projet
> (bouton « GitHub » dans Lovable → Connect to GitHub). Lovable continue
> de pousser sur la branche principale ; vous maintenez l'éjection sur une
> branche `vercel`.

---

## 1. Forker le projet et cloner localement

```bash
git clone https://github.com/<votre-user>/<repo>.git jammcare
cd jammcare
git checkout -b vercel
bun install        # ou npm install
```

## 2. Remplacer le preset Lovable par TanStack Start officiel

Éditer `vite.config.ts` :

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      target: "vercel", // <-- preset Node.js Vercel
      customViteReactPlugin: true,
    }),
  ],
});
```

Installer le plugin officiel et retirer le preset Cloudflare :

```bash
bun remove @lovable.dev/vite-tanstack-config wrangler
bun add -d @tanstack/react-start vite-tsconfig-paths
```

Supprimer les fichiers spécifiques Cloudflare :

```bash
rm -f wrangler.jsonc worker-configuration.d.ts
```

## 3. Adapter `src/server.ts` (le cas échéant)

Si `src/server.ts` importe quoi que ce soit lié à Cloudflare (`cloudflare:*`,
`@cloudflare/workers-types`), retirez ces imports. TanStack Start gère le
handler Node automatiquement avec `target: "vercel"`.

## 4. Variables d'environnement Vercel

Dans **Vercel → Project → Settings → Environment Variables**, ajoutez :

| Nom | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | (copier depuis `.env` Lovable) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | idem |
| `VITE_SUPABASE_PROJECT_ID` | idem |
| `SUPABASE_URL` | idem |
| `SUPABASE_PUBLISHABLE_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | (secret — Lovable Cloud → secrets) |
| `LOVABLE_API_KEY` | (si fonctions IA utilisées) |

## 5. `vercel.json` (optionnel)

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": ".output/public",
  "framework": null,
  "installCommand": "bun install"
}
```

Le preset `vercel` de TanStack Start produit automatiquement la structure
attendue par Vercel (`.output/server` + `.output/public`).

## 6. Déploiement

```bash
bun add -g vercel
vercel link
vercel --prod
```

Ou via l'interface Vercel : **Import Git Repository → branche `vercel`**.

## 7. Validation post-déploiement

- [ ] La page d'accueil `/` charge sans 404
- [ ] `/auth` permet inscription + connexion
- [ ] Après login, redirection vers `/admin` / `/medecin` / `/patient`
- [ ] Les server functions répondent (test : créer un rendez-vous)
- [ ] WebRTC fonctionne en HTTPS (Vercel fournit HTTPS automatiquement)
- [ ] Les RLS Supabase autorisent bien les lectures (pas de 403 console)

## 8. Maintenir la branche `vercel` à jour

Les modifications faites dans Lovable arrivent sur `main`. Rebasez régulièrement :

```bash
git fetch origin
git checkout vercel
git rebase origin/main
# résoudre conflits sur vite.config.ts si Lovable a changé le preset
git push --force-with-lease
```

---

## Alternative recommandée

Si vous n'avez pas besoin spécifiquement de Vercel, utilisez le bouton
**Publish** de Lovable : déploiement instantané sur `jammcare.lovable.app`,
backend Cloudflare Workers + Supabase déjà câblé, HTTPS et domaine custom
inclus, **zéro maintenance**.
