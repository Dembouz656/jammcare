import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { SYSTEM_PROMPTS, type ChatLang } from "@/lib/chatbot-i18n";

type Body = { messages?: unknown; language?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, language } = (await request.json()) as Body;
        if (!Array.isArray(messages)) {
          return new Response("Messages requis", { status: 400 });
        }
        const lang: ChatLang = language === "wo" ? "wo" : "fr";

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("LOVABLE_API_KEY manquante", { status: 500 });
        }

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const modelMessages = await convertToModelMessages(messages as UIMessage[]);
          const result = streamText({
            model: gateway("google/gemini-2.5-flash"),
            system: SYSTEM_PROMPTS[lang],
            messages: modelMessages,
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
