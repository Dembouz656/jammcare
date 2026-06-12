# ÉTUDE DE L'EXISTANT — JammCare Rural

## I. Présentation du projet

### A. Système actuel

JammCare Rural est une plateforme de **télémédecine** destinée aux populations rurales du Sénégal. Elle connecte patients, médecins et administrateurs via une interface web moderne.

#### 1. Architecture technique

| Couche | Technologie | Statut |
|--------|-------------|--------|
| **Framework frontend** | TanStack Start v1 (React 19 + Vite 7 + SSR) | ✅ Actif |
| **Framework UI** | Tailwind CSS v4 + Radix UI + shadcn/ui | ✅ Actif |
| **Base de données principale** | Supabase (PostgreSQL) | ✅ Actif — verrouillage critique |
| **Authentification** | Supabase Auth (JWT + RLS) | ✅ Actif — verrouillage critique |
| **Realtime** | Supabase Realtime (WebSocket sur notifications) | ✅ Actif |
| **Backend alternatif** | Express.js + MySQL2 (dossier `/backend`) | ⚠️ Inachevé, non connecté |
| **Frontend alternatif** | React + Vite (dossier `/frontend`) | ⚠️ Inachevé, non connecté |
| **Cartographie** | Leaflet.js + OpenStreetMap | ✅ Actif |
| **Chatbot IA** | Lovable AI Gateway (Gemini) via `@ai-sdk/react` | ✅ Actif |
| **PDF** | jsPDF (ordonnances avec signature SHA-256) | ✅ Actif |
| **Calendrier** | react-big-calendar + date-fns | ✅ Actif |
| **Vidéo** | WebRTC (routes call/ existantes) | 🔄 Partiel |
| **i18n** | Système custom FR + Wolof | ✅ Actif |

#### 2. Schéma de données (Supabase — 12 tables)

- `profiles` — profils utilisateurs (nom, téléphone, avatar)
- `patients` — données patients spécifiques
- `doctors` — profils médecins (spécialité, licence, statut validation)
- `user_roles` — rôles RBAC (patient / doctor / admin)
- `appointments` — rendez-vous avec statuts (pending/confirmed/completed/cancelled)
- `prescriptions` — ordonnances avec médicaments (JSONB)
- `messages` — messagerie entre patients et médecins
- `notifications` — alertes temps réel avec triggers PostgreSQL
- `health_facilities` — 25 établissements de santé seedés (lat/lng, type, contact)
- `medical_records` — dossiers médicaux
- `doctor_availabilities` — disponibilités des médecins
- `locations` — adresses géocodées

#### 3. Fonctionnalités implémentées

| Module | Patient | Médecin | Admin |
|--------|---------|---------|-------|
| Authentification / Inscription | ✅ | ✅ | ✅ |
| Tableau de bord avec statistiques | ✅ | ✅ | ✅ |
| Prise / gestion de rendez-vous | ✅ | ✅ | — |
| Calendrier interactif (jour/semaine/mois) | ✅ | ✅ | — |
| Téléconsultation vidéo (WebRTC) | ✅ | ✅ | — |
| Messagerie interne | ✅ | ✅ | — |
| Dossier médical | ✅ | ✅ | — |
| Ordonnances + PDF signé | ✅ (téléchargement) | ✅ (création) | — |
| Carte interactive des centres de santé | ✅ | ✅ | — |
| Chatbot IA bilingue (FR/Wolof) | ✅ | ✅ | ✅ |
| Notifications temps réel | ✅ | ✅ | — |
| Validation des médecins | — | — | ✅ |
| Gestion des utilisateurs | — | — | ✅ |
| Statistiques et rapports | — | — | ✅ |
| Paramètres de sécurité | — | — | ✅ |

#### 4. Routes de l'application

```
/                          → Landing page
/auth                      → Connexion / Inscription
/sante-map                 → Carte interactive des établissements de santé
/api/chat                  → API streaming du chatbot IA
/call/:id                  → Appel vidéo WebRTC

/_authenticated/patient/*  → Espace patient (8 sous-routes)
/_authenticated/medecin/*  → Espace médecin (9 sous-routes)
/_authenticated/admin/*   → Espace admin (7 sous-routes)
```

---

### B. Limites critiques du système existant

#### 1. 🔒 Verrouillage vendor — Supabase (CRITIQUE)

Le projet est **entièrement dépendant de Supabase** :
- **Authentification** : `supabase.auth` est le seul système de login fonctionnel
- **Base de données** : toutes les requêtes passent par `supabase.from(...)`
- **Sécurité** : RLS (Row Level Security) et policies PostgreSQL gèrent l'accès
- **Realtime** : notifications temps réel via `supabase.channel()`
- **Triggers** : 3 triggers PostgreSQL (`notify_appointment_event`, `notify_prescription_created`, `notify_message_received`) automatisent les notifications
- **Conséquence** : impossible de migrer ou d'exporter sans réécrire ~80 % du code métier

#### 2. 🔒 Verrouillage vendor — Lovable (CRITIQUE)

- Le projet est hébergé sur la plateforme **Lovable** avec un déploiement automatique
- Fichiers auto-générés non modifiables : `src/integrations/supabase/client.ts`, `auth-attacher.ts`, `auth-middleware.ts`, `types.ts`
- Le fichier `src/start.ts` enregistre `attachSupabaseAuth` comme middleware global obligatoire
- Le dossier `.lovable/` contient la configuration projet interne
- **Conséquence** : le code ne peut pas être exécuté hors de l'écosystème Lovable sans modifications majeures

#### 3. ⚠️ Double architecture non résolue (CRITIQUE)

Un **backend Express/MySQL alternatif** existe dans `/backend` et un **frontend React** dans `/frontend`, mais :
- Ils sont **totalement déconnectés** du code principal
- Les routes Express (`auth`, `users`, `providers`, `services`, `bookings`, `reviews`) sont des stubs basiques
- Le schéma MySQL (`sql/schema.sql`) ne couvre que 10 tables, sans prescriptions, notifications temps réel, messages, ni établissements de santé
- Le frontend `/frontend` ne contient que des pages statiques non branchées à l'API
- **Conséquence** : il y a deux projets en parallèle sans lien. Celui dans `/backend` + `/frontend` ne fonctionne pas comme remplacement opérationnel

#### 4. ⚠️ Dépendances mixées (MAJEUR)

Le `package.json` principal contient à la fois :
- `@supabase/supabase-js` + `@tanstack/react-start` (stack Lovable)
- `mysql2` (pour le backend jamais utilisé dans le frontend)
- `@cloudflare/vite-plugin` + `wrangler.jsonc` (déploiement Edge/Cloudflare)
- `@ai-sdk/openai-compatible`, `ai`, `@ai-sdk/react` (chatbot IA via Lovable Gateway)

**Conséquence** : le bundle est alourdi par des dépendances incompatibles avec un hébergement autonome.

#### 5. ⚠️ Fonctionnalités incomplètes ou simulées (MAJEUR)

| Fonctionnalité | État réel |
|----------------|-----------|
| Chatbot Wolof | Prompts basiques en latin simplifié, pas de vrai modèle Wolof |
| Signature numérique | Hash SHA-256 textuel, **pas de vraie signature cryptographique** ni QR code dynamique |
| WebRTC vidéo | Routes existantes mais non testées en production, pas de TURN/STUN configuré |
| Paiements | Table `payments` dans MySQL mais aucune intégration Stripe/PayPal/Orange Money |
| Export rapports PDF/Excel | Routes admin créées mais pas de génération réelle |
| SMS/Email notifications | Supabase Realtime uniquement, **pas de gateway SMS ni d'email transactionnel** |

#### 6. ⚠️ Dette technique (MOYEN)

- Pas de tests automatisés (unitaires, E2E)
- Pas de documentation API (OpenAPI/Swagger)
- Pas de Docker / containerisation
- Pas de CI/CD autonome (dépendance au pipeline Lovable)
- Le fichier `DashboardShell.tsx` contient encore la référence "MediRural" (ancien nom) au lieu de "JammCare"
- Le build peut échouer si les variables d'environnement Supabase ne sont pas injectées (erreur à l'import du client)

---

## II. Proposition de solution

### Description en quelques lignes

**Migrer JammCare Rural vers une architecture 100 % autonome et auto-hébergeable**, en finalisant le backend Express/MySQL existant et en y reconnectant un frontend React Vite indépendant. Cela implique :

1. **Backend** : compléter l'API Express avec toutes les entités métier (prescriptions, notifications, messages, établissements de santé, WebRTC signaling), remplacer Supabase Auth par un système JWT maître avec bcrypt, et implémenter les triggers métier côté Node.js
2. **Frontend** : découpler le code React actuel de TanStack Start / Supabase, le baser sur le dossier `/frontend` existant, remplacer toutes les requêtes `supabase.from()` par des appels API REST vers le backend Express, et conserver les composants visuels (Leaflet, calendrier, PDF, chatbot)
3. **Base de données** : étendre le schéma MySQL pour inclure les tables manquantes (prescriptions, health_facilities, notifications avec logique de polling ou WebSocket), et migrer les 25 établissements seedés
4. **Déploiement** : Dockeriser les deux services (backend + frontend + MySQL) pour un déploiement sur n'importe quel VPS cloud (AWS, DigitalOcean, OVH), avec un reverse proxy Nginx et des certificats SSL
5. **Chatbot IA** : remplacer le Lovable AI Gateway par un appel direct à l'API Google Gemini (ou un modèle open-source auto-hébergé comme Llama via Ollama) pour conserver la réponse en français et wolof
6. **Notifications** : remplacer Supabase Realtime par un système de **Server-Sent Events (SSE)** ou WebSocket via Socket.io pour les notifications temps réel

**Résultat attendu** : une plateforme de télémédecine complète, sans dépendance à Lovable ni à Supabase, déployable sur un serveur privé au Sénégal avec un coût d'infrastructure maîtrisé.
