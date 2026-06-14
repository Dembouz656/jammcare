# Déploiement sur Vercel

> **Important** : la preview Lovable utilise Cloudflare Workers (`@cloudflare/vite-plugin` dans `vite.config.ts`). Pour déployer sur **Vercel**, exportez le code (bouton GitHub depuis Lovable) puis suivez ces étapes dans votre fork — ne modifiez pas `vite.config.ts` dans le projet Lovable, sinon la preview cessera de fonctionner.

## 1. Exporter le code
- Dans Lovable → bouton **GitHub → Connect to GitHub** → créer le repo.
- Cloner le repo localement : `git clone <url>`.

## 2. Adapter `vite.config.ts` pour Vercel
Remplacer le plugin Cloudflare par le preset Nitro / Vercel de TanStack Start :

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({ target: "vercel" }), // <-- preset Vercel
    react(),
  ],
});
```

Supprimer `@cloudflare/vite-plugin` du `package.json` et le dossier `.wrangler/`.

## 3. Importer sur Vercel
1. https://vercel.com → **New Project** → Import Git Repository.
2. Framework Preset : **Other** (Vite gère tout).
3. Build Command : `bun run build` (ou `npm run build`).
4. Output Directory : `.output/public`.

## 4. Variables d'environnement
Dans **Project Settings → Environment Variables** :

| Variable | Type | Valeur |
|---|---|---|
| `VITE_SUPABASE_URL` | Public | URL projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | Clé publishable |
| `SUPABASE_URL` | Secret | identique à VITE_SUPABASE_URL |
| `SUPABASE_PUBLISHABLE_KEY` | Secret | identique |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | **service role** (jamais public) |
| `LOVABLE_API_KEY` | Secret | clé AI Gateway |

## 5. Déployer
Click **Deploy**. Vercel build automatiquement à chaque push sur `main`.

## 6. Domaine personnalisé
Vercel → **Domains** → ajouter le domaine → suivre les instructions DNS (CNAME / A record).

## Limitations à connaître
- WebRTC en production rurale nécessite un **serveur TURN** (Twilio, Coturn). Sans cela, certains réseaux 4G/NAT symétrique bloqueront la téléconsultation.
- Supabase Auth doit avoir l'URL Vercel ajoutée dans **Authentication → URL Configuration → Redirect URLs**.
