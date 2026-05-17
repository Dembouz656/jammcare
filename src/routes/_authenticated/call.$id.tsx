import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ArrowLeft, Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const Route = createFileRoute("/_authenticated/call/$id")({
  head: () => ({ meta: [{ title: "Téléconsultation — MediRural" }] }),
  component: CallPage,
});

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function CallPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [appt, setAppt] = useState<{ patient_id: string; doctor_id: string; scheduled_at: string; status: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const initiatedRef = useRef(false);

  // Load appointment & verify access
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("patient_id, doctor_id, scheduled_at, status")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Rendez-vous introuvable");
        navigate({ to: "/patient" });
        return;
      }
      if (data.patient_id !== user.id && data.doctor_id !== user.id) {
        toast.error("Accès refusé");
        navigate({ to: "/" });
        return;
      }
      if (data.status !== "confirmed") {
        toast.error("La téléconsultation n'est accessible qu'après confirmation du rendez-vous.");
        navigate({ to: user.id === data.doctor_id ? "/medecin" : "/patient" });
        return;
      }
      setAppt(data);
    })();
  }, [user, id, navigate]);

  const startCall = async () => {
    if (!user || !appt || initiatedRef.current) return;
    initiatedRef.current = true;
    setStatus("connecting");

    let stream: MediaStream;
    try {
      if (!window.isSecureContext) {
        throw new Error("Contexte non sécurisé : ouvre la page en HTTPS (ou via l'URL publiée).");
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("API média indisponible dans ce navigateur/iframe.");
      }
      console.info("[call] requesting getUserMedia…");
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      console.info("[call] stream acquired", {
        videoTracks: stream.getVideoTracks().map((t) => ({ label: t.label, enabled: t.enabled, muted: t.muted, readyState: t.readyState })),
        audioTracks: stream.getAudioTracks().map((t) => ({ label: t.label, enabled: t.enabled })),
      });
    } catch (err) {
      const e = err as DOMException & { message?: string };
      const msg =
        e?.name === "NotAllowedError" ? "Permission refusée pour la caméra/micro. Autorisez l'accès dans votre navigateur."
        : e?.name === "NotFoundError" ? "Aucune caméra ou micro détecté sur cet appareil."
        : e?.name === "NotReadableError" ? "La caméra/micro est utilisée par une autre application."
        : (e?.message || t("camera_error"));
      toast.error(msg);
      setStatus("idle");
      initiatedRef.current = false;
      return;
    }
    localStream.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;

    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (ev) => {
      if (remoteVideo.current && ev.streams[0]) {
        remoteVideo.current.srcObject = ev.streams[0];
        setStatus("connected");
      }
    };

    const channel = supabase.channel(`call:${id}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        channel.send({ type: "broadcast", event: "ice", payload: { from: user.id, candidate: ev.candidate } });
      }
    };

    const isInitiator = user.id === appt.patient_id; // patient initiates

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { from: user.id, sdp: answer } });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        if (pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
      })
      .on("broadcast", { event: "ice" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch (e) { console.warn(e); }
      })
      .on("broadcast", { event: "ready" }, async ({ payload }) => {
        if (payload.from === user.id) return;
        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: "broadcast", event: "offer", payload: { from: user.id, sdp: offer } });
        }
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          // Announce presence
          await channel.send({ type: "broadcast", event: "ready", payload: { from: user.id } });
          if (isInitiator) {
            // Wait briefly for peer; if peer joins later, ready event triggers offer
            setTimeout(async () => {
              if (pc.signalingState === "stable" && !pc.currentRemoteDescription) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({ type: "broadcast", event: "offer", payload: { from: user.id, sdp: offer } });
              }
            }, 800);
          }
        }
      });
  };

  const endCall = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    setStatus("ended");
    initiatedRef.current = false;
  };

  useEffect(() => () => endCall(), []); // cleanup on unmount

  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };
  const toggleCam = () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  // ===== Chat =====
  type ChatMsg = { id: string; sender_id: string; content: string; created_at: string };
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history & subscribe to realtime
  useEffect(() => {
    if (!user || !appt) return;
    let chan: RealtimeChannel | null = null;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("appointment_id", id)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);

      chan = supabase
        .channel(`chat:${id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `appointment_id=eq.${id}` },
          (payload) => {
            const m = payload.new as ChatMsg;
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          },
        )
        .subscribe();
    })();
    return () => { if (chan) supabase.removeChannel(chan); };
  }, [user, appt, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !appt || !draft.trim()) return;
    const recipient = user.id === appt.patient_id ? appt.doctor_id : appt.patient_id;
    const content = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipient,
      appointment_id: id,
      content,
    });
    if (error) {
      toast.error(error.message);
      setDraft(content);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to={user?.id === appt?.doctor_id ? "/medecin" : "/patient"}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_dashboard")}
            </Link>
          </Button>
          <div className="text-right">
            <p className="text-display text-2xl">{t("video_consultation")}</p>
            {appt && <p className="text-xs text-muted-foreground">{new Date(appt.scheduled_at).toLocaleString()}</p>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Video area */}
          <div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
                <video ref={remoteVideo} autoPlay playsInline className="h-full w-full object-cover" />
                {status !== "connected" && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                    {status === "connecting" ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t("waiting_peer")}</span>
                    ) : status === "ended" ? "—" : t("waiting_peer")}
                  </div>
                )}
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
                <video ref={localVideo} autoPlay playsInline muted className="h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] uppercase text-white">{t("you")}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              {status === "idle" || status === "ended" ? (
                <Button size="lg" onClick={startCall} className="bg-gradient-primary text-primary-foreground shadow-glow">
                  <Video className="mr-2 h-5 w-5" /> {t("start_call")}
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="outline" onClick={toggleMic} className="rounded-full">
                    {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-destructive" />}
                  </Button>
                  <Button size="lg" variant="outline" onClick={toggleCam} className="rounded-full">
                    {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-destructive" />}
                  </Button>
                  <Button size="lg" onClick={endCall} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    <PhoneOff className="mr-2 h-5 w-5" /> {t("end_call")}
                  </Button>
                </>
              )}
            </div>

            {status === "connected" && (
              <p className="mt-4 text-center text-xs text-success">{t("call_connected")}</p>
            )}
          </div>

          {/* Chat panel */}
          <aside className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">{t("chat")}</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">{t("no_messages")}</p>
              )}
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-surface text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("type_message")}
                maxLength={1000}
              />
              <Button type="submit" size="icon" disabled={!draft.trim()} className="bg-gradient-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
