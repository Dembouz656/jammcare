import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send, Loader2, Sparkles, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CHAT_GREETING,
  CHAT_HEADER_SUBTITLE,
  CHAT_LANG_LABEL,
  CHAT_LOADING,
  CHAT_PLACEHOLDER,
  QUICK_QUESTIONS,
  type ChatLang,
} from "@/lib/chatbot-i18n";

const LANG_STORAGE_KEY = "jammcare-chatbot-lang";

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState<ChatLang>("fr");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    if (saved === "fr" || saved === "wo") setLang(saved);
  }, []);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const loading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    sendMessage({ text: text.trim() }, { body: { language: lang } });
    setInput("");
  };

  const switchLang = (next: ChatLang) => {
    setLang(next);
    if (typeof window !== "undefined") localStorage.setItem(LANG_STORAGE_KEY, next);
    setMessages([]);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant JammCare"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[560px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          <header className="flex items-center justify-between border-b border-border bg-gradient-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <div>
                <p className="text-sm font-semibold leading-tight">JammCare Assistant</p>
                <p className="text-[10px] opacity-80">{CHAT_HEADER_SUBTITLE[lang]}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 rounded-full bg-white/15 p-0.5">
                <Languages className="ml-1 h-3 w-3 opacity-80" />
                {(["fr", "wo"] as ChatLang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLang(l)}
                    aria-label={`Langue ${CHAT_LANG_LABEL[l]}`}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase transition ${
                      lang === l ? "bg-white text-primary" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-full p-1 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-secondary px-3 py-2 text-sm">{CHAT_GREETING[lang]}</div>
                <div className="flex flex-col gap-1.5">
                  {QUICK_QUESTIONS[lang].map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="rounded-xl border border-border bg-surface px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                      isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {text || (loading && !isUser ? "…" : "")}
                  </div>
                </div>
              );
            })}

            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> {CHAT_LOADING[lang]}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-background px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CHAT_PLACEHOLDER[lang]}
              disabled={loading}
              className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-9 w-9 rounded-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
