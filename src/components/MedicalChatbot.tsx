import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Stethoscope,
  Languages,
  AlertTriangle,
  Plus,
  History,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  CHAT_GREETING,
  CHAT_HEADER_SUBTITLE,
  CHAT_LANG_LABEL,
  CHAT_LOADING,
  CHAT_PLACEHOLDER,
  QUICK_QUESTIONS,
  type ChatLang,
} from "@/lib/chatbot-i18n";

const LANG_STORAGE_KEY = "jammcare-medchat-lang";

const DISCLAIMER: Record<ChatLang, string> = {
  fr: "Ce chatbot fournit uniquement des informations générales et ne remplace pas un médecin.",
  wo: "Chatbot bii dafay jox kese xibaar yu àgg, du jële doktoor bi.",
};

type Conversation = {
  id: string;
  title: string;
  language: string;
  updated_at: string;
};

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function toUIMessages(rows: StoredMessage[]): UIMessage[] {
  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    parts: [{ type: "text", text: r.content }],
  })) as UIMessage[];
}

export function MedicalChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState<ChatLang>("fr");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSavedIdRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    if (saved === "fr" || saved === "wo") setLang(saved);
  }, []);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: activeConvId ?? "guest",
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const loading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("id,title,language,updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    setConversations((data ?? []) as Conversation[]);
  }, [user]);

  useEffect(() => {
    if (open && user) loadConversations();
  }, [open, user, loadConversations]);

  // Create new conversation
  const newConversation = useCallback(async () => {
    lastSavedIdRef.current = new Set();
    setInitialMessages([]);
    setMessages([]);
    setActiveConvId(null);
    setShowHistory(false);
  }, [setMessages]);

  // Load an existing conversation
  const loadConversation = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,role,content,created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      const rows = (data ?? []) as StoredMessage[];
      lastSavedIdRef.current = new Set(rows.map((r) => r.id));
      const ui = toUIMessages(rows);
      setInitialMessages(ui);
      setMessages(ui);
      setActiveConvId(id);
      setShowHistory(false);
    },
    [setMessages],
  );

  const deleteConversation = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    if (activeConvId === id) await newConversation();
    loadConversations();
  };

  // Persist messages: after stream ends, save any unsaved messages
  useEffect(() => {
    if (!user) return;
    if (loading) return;
    if (messages.length === 0) return;

    const unsaved = messages.filter((m) => !lastSavedIdRef.current.has(m.id));
    if (unsaved.length === 0) return;

    let cancelled = false;
    (async () => {
      let convId = activeConvId;
      if (!convId) {
        const firstUser = messages.find((m) => m.role === "user");
        const text = firstUser
          ? firstUser.parts.map((p) => (p.type === "text" ? p.text : "")).join("")
          : "Nouvelle conversation";
        const title = text.slice(0, 60) || "Nouvelle conversation";
        const { data, error } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id, title, language: lang })
          .select("id")
          .single();
        if (error || !data) return;
        convId = data.id;
        if (cancelled) return;
        setActiveConvId(convId);
      } else {
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }

      const rows = unsaved.map((m) => ({
        id: m.id,
        conversation_id: convId!,
        user_id: user.id,
        role: m.role as "user" | "assistant",
        content: m.parts.map((p) => (p.type === "text" ? p.text : "")).join(""),
      }));
      const { error: insertErr } = await supabase.from("chat_messages").insert(rows);
      if (!insertErr) {
        unsaved.forEach((m) => lastSavedIdRef.current.add(m.id));
        loadConversations();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, messages, user, activeConvId, lang, loadConversations]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    sendMessage({ text: text.trim() }, { body: { language: lang } });
    setInput("");
  };

  const switchLang = (next: ChatLang) => {
    setLang(next);
    if (typeof window !== "undefined") localStorage.setItem(LANG_STORAGE_KEY, next);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant médical JammCare"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[600px] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated sm:h-[620px]">
          <header className="flex items-center justify-between border-b border-border bg-gradient-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">
                  JammCare Médical
                </p>
                <p className="text-[10px] opacity-80">
                  {CHAT_HEADER_SUBTITLE[lang]}
                </p>
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
                      lang === l
                        ? "bg-white text-primary"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {user && (
                <>
                  <button
                    onClick={() => setShowHistory((s) => !s)}
                    aria-label="Historique"
                    className="rounded-full p-1.5 hover:bg-white/20"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={newConversation}
                    aria-label="Nouvelle conversation"
                    className="rounded-full p-1.5 hover:bg-white/20"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-full p-1.5 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 border-b border-border bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{DISCLAIMER[lang]}</span>
          </div>

          {showHistory && user ? (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
              <p className="px-1 text-xs font-medium text-muted-foreground">
                Historique
              </p>
              {conversations.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                  Aucune conversation
                </p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-2 text-xs transition hover:border-primary ${
                    c.id === activeConvId ? "border-primary" : ""
                  }`}
                >
                  <button
                    onClick={() => loadConversation(c.id)}
                    className="flex-1 text-left"
                  >
                    <p className="line-clamp-1 font-medium">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.updated_at).toLocaleString("fr-FR")}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteConversation(c.id)}
                    aria-label="Supprimer"
                    className="opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-secondary px-3 py-2 text-sm">
                    {CHAT_GREETING[lang]}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_QUESTIONS[lang].slice(0, 5).map((q) => (
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
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      }`}
                    >
                      {text || (loading && !isUser ? "…" : "")}
                    </div>
                  </div>
                );
              })}

              {loading &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />{" "}
                    {CHAT_LOADING[lang]}
                  </div>
                )}
            </div>
          )}

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
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-9 w-9 rounded-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
