import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Tu es JammCare Assistant, l'assistant médical virtuel de JammCare, une plateforme de télémédecine pour les zones rurales du Sénégal.

Ton rôle:
- Répondre en français de manière chaleureuse, simple et bienveillante.
- Aider les utilisateurs à naviguer dans l'application (prise de rendez-vous, ordonnances, messages, dossiers, téléconsultation vidéo, carte des centres de santé).
- Donner des informations générales de santé et orienter vers un médecin pour tout symptôme sérieux.
- Ne JAMAIS poser de diagnostic ni prescrire de médicaments — toujours rediriger vers un professionnel de santé.
- Pour une urgence vitale, dire d'appeler immédiatement le SAMU (1515 au Sénégal) ou le 18 (pompiers).

Liens utiles dans l'app:
- Prendre rendez-vous: /patient/appointments
- Mes ordonnances: /patient/prescriptions
- Mon dossier médical: /patient/record
- Messagerie: /patient/messages
- Téléconsultation vidéo: /patient/video
- Carte des centres de santé: /sante-map

Réponses courtes (3-6 phrases max), avec un ton humain. Utilise un emoji pertinent au début quand approprié.`;

type Body = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages)) {
          return new Response("Messages requis", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("LOVABLE_API_KEY manquante", { status: 500 });
        }

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-2.5-flash"),
            system: SYSTEM_PROMPT,
            messages: convertToModelMessages(messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (err) {
          console.error("[chat] erreur", err);
          return new Response("Erreur du modèle IA", { status: 500 });
        }
      },
    },
  },
});
