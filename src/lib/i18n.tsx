import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "wo";

type Dict = Record<string, { fr: string; wo: string }>;

export const dict: Dict = {
  // Global
  app_tagline: { fr: "Télémédecine rurale", wo: "Fajalu ci dëkki ndawi" },
  app_subtitle: { fr: "Accédez à votre espace sécurisé pour gérer vos consultations.", wo: "Dugal ci sa barab bu wóor ngir saytu say faju." },
  login: { fr: "Connexion", wo: "Dugg" },
  signup: { fr: "Créer un compte", wo: "Sos kont" },
  logout: { fr: "Déconnexion", wo: "Génn" },
  back: { fr: "Retour", wo: "Dellu" },
  language: { fr: "Langue", wo: "Làkk" },
  french: { fr: "Français", wo: "Frañse" },
  wolof: { fr: "Wolof", wo: "Wolof" },
  secure_auth: { fr: "Authentification chiffrée", wo: "Dugg bu wóor te sutura" },

  // Auth
  email: { fr: "Email", wo: "Imeel" },
  password: { fr: "Mot de passe", wo: "Baatu-jublu" },
  full_name: { fr: "Nom complet", wo: "Tur wépp" },
  phone: { fr: "Téléphone", wo: "Telefon" },
  city: { fr: "Ville", wo: "Dëkk" },
  i_am: { fr: "Je suis", wo: "Maa ngi" },
  patient: { fr: "Patient", wo: "Aji-faj" },
  doctor: { fr: "Médecin", wo: "Doktoor" },
  specialty: { fr: "Spécialité", wo: "Mën-mën" },
  license: { fr: "N° licence", wo: "Limeero lëmës" },
  sign_in: { fr: "Se connecter", wo: "Dugg léegi" },
  create_account: { fr: "Créer mon compte", wo: "Sos sama kont" },
  invalid_credentials: { fr: "Identifiants invalides", wo: "Imeel walla baatu-jublu du baax" },
  login_success: { fr: "Connexion réussie", wo: "Dugg na jaadu" },
  account_created: { fr: "Compte créé. Bienvenue !", wo: "Kont bi sosu na. Dalal jàmm !" },
  doctor_pending: { fr: "Compte créé. En attente de validation par un administrateur.", wo: "Kont bi sosu na. Dafa wér pour aji-yorin bi nangu." },

  // Dashboard patient
  hello: { fr: "Bonjour", wo: "Salaam" },
  welcome: { fr: "Bienvenue", wo: "Dalal jàmm" },
  new_appointment: { fr: "Nouveau rendez-vous", wo: "Bunt bu bees" },
  appointments: { fr: "Rendez-vous", wo: "Bunt yi" },
  upcoming: { fr: "à venir", wo: "yu ñëw" },
  total_consultations: { fr: "Total consultations", wo: "Faju yi yépp" },
  completed: { fr: "terminées", wo: "su jeexee" },
  prescriptions: { fr: "Ordonnances", wo: "Ordonaas" },
  received: { fr: "reçues", wo: "yu ñu jot" },
  messages: { fr: "Messages", wo: "Bataaxal yi" },
  unread: { fr: "non lus", wo: "yu ñu jàngul" },
  next_appointments: { fr: "Prochains rendez-vous", wo: "Bunt yu ñëw" },
  no_upcoming: { fr: "Aucun rendez-vous à venir.", wo: "Amul bunt bu ñëw." },
  request_appointment: { fr: "Demander un rendez-vous", wo: "Ñaan bunt" },
  choose_doctor: { fr: "Choisir un médecin", wo: "Tànn doktoor" },
  no_doctor_available: { fr: "Aucun médecin disponible", wo: "Amul doktoor bu jot" },
  date_time: { fr: "Date & heure", wo: "Bés ak waxtu" },
  reason: { fr: "Motif", wo: "Lan moo tax" },
  confirm: { fr: "Confirmer", wo: "Dëggal" },
  date: { fr: "Date", wo: "Bés" },
  available_slot: { fr: "Créneau disponible", wo: "Waxtu wu jot" },
  no_slot: { fr: "Aucun créneau ce jour", wo: "Amul waxtu ci bés bii" },
  appointment_requested: { fr: "Rendez-vous demandé", wo: "Bunt bi ñaan na" },
  select_doctor_date: { fr: "Sélectionnez médecin et créneau", wo: "Tànnal doktoor ak waxtu" },

  // Doctor
  today: { fr: "Aujourd'hui", wo: "Tey" },
  agenda: { fr: "Agenda", wo: "Bornu yi" },
  patients: { fr: "Patients", wo: "Aji-faj yi" },
  followed: { fr: "suivis", wo: "ñu nu topp" },
  consultations_today: { fr: "Consultations du jour", wo: "Faju yu tey" },
  to_come: { fr: "À venir", wo: "Yu ñëw" },
  pending_validation: { fr: "Compte en attente de validation", wo: "Sa kont da fa wér ngir nangu" },
  pending_validation_desc: { fr: "Un administrateur doit valider votre profil.", wo: "Aji-yorin moo war a nangu sa profil." },
  no_appointments: { fr: "Aucun rendez-vous pour le moment.", wo: "Amul bunt léegi." },
  finish: { fr: "Terminer", wo: "Jeexal" },
  cancel: { fr: "Annuler", wo: "Bañ" },
  manage_availability: { fr: "Mes disponibilités", wo: "Sama waxtu yi jot" },
  add_slot: { fr: "Ajouter un créneau", wo: "Yokk waxtu" },
  weekday: { fr: "Jour", wo: "Bés" },
  start: { fr: "Début", wo: "Tàmbali" },
  end: { fr: "Fin", wo: "Mujj" },
  delete: { fr: "Supprimer", wo: "Far" },
  no_availability: { fr: "Aucune disponibilité définie.", wo: "Amul waxtu wu nu defar." },
  overview: { fr: "Vue d'ensemble", wo: "Xool yépp" },
  availability: { fr: "Disponibilités", wo: "Waxtu yi jot" },
  validation: { fr: "Validation", wo: "Nangu" },
  my_record: { fr: "Mon dossier", wo: "Sama kayit" },
  settings: { fr: "Paramètres", wo: "Tëgg" },
  users: { fr: "Utilisateurs", wo: "Jëfandikukat yi" },
  doctors: { fr: "Médecins", wo: "Doktoor yi" },
  stats: { fr: "Statistiques", wo: "Statistik" },
  security: { fr: "Sécurité", wo: "Wóoreel" },
  activity: { fr: "Activité", wo: "Jëf yi" },
  generated_slots: { fr: "Aperçu des créneaux", wo: "Xool waxtu yi" },
  slots_count: { fr: "créneaux générés", wo: "waxtu yu juddu" },
  edit: { fr: "Modifier", wo: "Soppi" },

  // Video
  join_call: { fr: "Rejoindre", wo: "Bokk" },
  video_consultation: { fr: "Téléconsultation vidéo", wo: "Faju ci wideo" },
  start_call: { fr: "Démarrer l'appel", wo: "Tàmbali woote bi" },
  end_call: { fr: "Terminer l'appel", wo: "Jeexal woote bi" },
  waiting_peer: { fr: "En attente de l'autre participant…", wo: "Mu ngi xaar moroom mi…" },
  call_connected: { fr: "Appel connecté", wo: "Woote dafa tàkk" },
  camera_error: { fr: "Impossible d'accéder à la caméra/micro", wo: "Mënul ubbi kaamera/mikro" },
  back_to_dashboard: { fr: "Retour au tableau de bord", wo: "Dellu ci tablo bi" },

  // Weekdays
  d0: { fr: "Dimanche", wo: "Dibéer" },
  d1: { fr: "Lundi", wo: "Altine" },
  d2: { fr: "Mardi", wo: "Talaata" },
  d3: { fr: "Mercredi", wo: "Àllarba" },
  d4: { fr: "Jeudi", wo: "Alxames" },
  d5: { fr: "Vendredi", wo: "Àjjuma" },
  d6: { fr: "Samedi", wo: "Gaawu" },

  // Chat
  chat: { fr: "Discussion", wo: "Waxtaan" },
  type_message: { fr: "Écrire un message…", wo: "Bind ab bataaxal…" },
  send: { fr: "Envoyer", wo: "Yónnee" },
  no_messages: { fr: "Aucun message pour le moment.", wo: "Amul bataaxal léegi." },
  you: { fr: "Vous", wo: "Yow" },

  // Landing
  landing_title: { fr: "Votre santé, notre priorité.", wo: "Sa wér-gi-yaram, sunu jëfu njëkk." },
  landing_lead: { fr: "JammCare connecte les patients et les professionnels de santé où que vous soyez, en toute sécurité.", wo: "JammCare dafa boole aji-faj yi ak doktoor yi, fu nga mën a nekk, ci wóoreel gu mat." },
  feature_book: { fr: "Prenez rendez-vous facilement", wo: "Jël bunt ci yomb" },
  feature_consult: { fr: "Consultez à distance en toute sécurité", wo: "Faj ci sori ci wóoreel" },
  feature_chat: { fr: "Échangez en temps réel avec votre médecin", wo: "Wax ak doktoor bi ci jamono ji" },
  feature_records: { fr: "Accédez à vos dossiers médicaux", wo: "Dugal sa kayit yu paj" },
  trust_secure: { fr: "Sécurisé", wo: "Wóor na" },
  trust_private: { fr: "Confidentiel", wo: "Sutura" },
  trust_human: { fr: "Humain", wo: "Nit" },
  get_started: { fr: "Commencer", wo: "Tàmbali" },
  already_member: { fr: "Déjà inscrit ?", wo: "Bokk nga ba noppi ?" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
}

const Ctx = createContext<I18nCtx | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) || "fr";
    setLangState(saved === "wo" ? "wo" : "fr");
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
