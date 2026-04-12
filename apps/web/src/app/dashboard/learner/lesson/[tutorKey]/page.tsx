"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const SKU_MAP: Record<string, string> = {
  nova: "ADDON_TUTOR_MATH",
  sage: "ADDON_TUTOR_ELA",
  spark: "ADDON_TUTOR_SCIENCE",
  chrono: "ADDON_TUTOR_HISTORY",
  pixel: "ADDON_TUTOR_CODING",
  echo: "ADDON_TUTOR_SPEECH",
  harmony: "ADDON_TUTOR_SEL",
  atlas: "ADDON_TUTOR_SOCIAL_STUDIES",
  cadence: "ADDON_TUTOR_ARTS",
  vigor: "ADDON_TUTOR_PE_HEALTH",
  lingua: "ADDON_TUTOR_LANGUAGES",
  forge: "ADDON_TUTOR_STEM_DESIGN",
  compass: "ADDON_TUTOR_LIFE_SKILLS",
  muse: "ADDON_TUTOR_CREATIVE_WRITING",
};

export default function LessonPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tutorKey = params.tutorKey as string;
  const tutor = TUTORS[tutorKey as TutorKey];

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    if (!user) return;
    setSessionStarting(true);
    try {
      const sku = SKU_MAP[tutorKey] || `ADDON_TUTOR_${tutorKey.toUpperCase()}`;
      const res = await fetch("/api/tutor/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: user.id, tutorSku: sku }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        setMessages([{
          role: "assistant",
          content: `Hi there! I'm ${tutor?.name || "your tutor"}. Ready to learn? What would you like to explore today?`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {}
    setSessionStarting(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || sending) return;
    const userMessage = input.trim();
    setInput("");
    setSending(true);

    setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date().toISOString() }]);

    try {
      const res = await fetch(`/api/tutor/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.response, timestamp: new Date().toISOString() }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble thinking about that. Can you try again?", timestamp: new Date().toISOString() }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops, something went wrong. Let's try again!", timestamp: new Date().toISOString() }]);
    }
    setSending(false);
  };

  const endSession = async () => {
    if (sessionId) {
      await fetch(`/api/tutor/session/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
    }
    router.push("/dashboard/learner");
  };

  if (loading || !user) return null;
  if (!tutor) return <div className="min-h-screen flex items-center justify-center text-slate-500">Tutor not found</div>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${tutor.color}08, white, ${tutor.color}05)` }}>
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 shadow" style={{ borderColor: tutor.color }}>
            <Image src={tutor.avatar} alt={tutor.name} fill className="object-cover object-top" sizes="40px" />
          </div>
          <div>
            <h1 className="font-heading font-bold" style={{ color: tutor.color }}>{tutor.name}</h1>
            <p className="text-xs text-slate-500">{tutor.domain}</p>
          </div>
        </div>
        <button onClick={endSession}
          className="px-4 py-2 text-sm rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 transition">
          End Session
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {!sessionId ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 py-20">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 shadow-xl" style={{ borderColor: tutor.color }}>
              <Image src={tutor.avatar} alt={tutor.name} fill className="object-cover object-top" sizes="128px" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Learn with {tutor.name}</h2>
            <p className="text-slate-500 text-center max-w-md">{tutor.domain}</p>
            <button onClick={startSession} disabled={sessionStarting}
              className="px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg transition hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: tutor.color }}>
              {sessionStarting ? "Starting..." : "Start Session"}
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border mr-2 flex-shrink-0 mt-1" style={{ borderColor: tutor.color }}>
                    <Image src={tutor.avatar} alt={tutor.name} fill className="object-cover object-top" sizes="32px" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border mr-2 flex-shrink-0 mt-1" style={{ borderColor: tutor.color }}>
                  <Image src={tutor.avatar} alt={tutor.name} fill className="object-cover object-top" sizes="32px" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {sessionId && (
        <div className="border-t border-slate-200 bg-white/90 backdrop-blur px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Ask ${tutor.name} anything...`}
              className="flex-1 px-4 py-3 rounded-full border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body text-sm"
              disabled={sending}
            />
            <button onClick={sendMessage} disabled={sending || !input.trim()}
              className="px-6 py-3 rounded-full text-white font-bold text-sm transition disabled:opacity-50"
              style={{ backgroundColor: tutor.color }}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
