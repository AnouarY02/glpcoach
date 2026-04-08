"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { differenceInDays } from "date-fns";
import { Brain, Send, Loader2, Lock } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const FREE_MESSAGE_LIMIT = 3;

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [initLoading, setInitLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: injections }, { data: profile }] = await Promise.all([
        supabase.from("injections").select("injected_at").eq("user_id", user.id)
          .order("injected_at", { ascending: false }).limit(1),
        supabase.from("user_profiles").select("subscription_tier").eq("id", user.id).single(),
      ]);

      if (injections?.[0]) {
        const day = differenceInDays(new Date(), new Date(injections[0].injected_at)) + 1;
        setCycleDay(Math.min(day, 7));
      }

      if (profile?.subscription_tier === "pro") {
        setIsPro(true);
      }

      setInitLoading(false);
    };
    load();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    if (!isPro && messageCount >= FREE_MESSAGE_LIMIT) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setMessageCount((c) => c + 1);
    setLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          cycleDay,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Fout bij coach");
      }

      const data = await response.json();
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, ik kon geen antwoord geven. Probeer het opnieuw.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showProWall = !isPro && messageCount >= FREE_MESSAGE_LIMIT;

  if (initLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-green-100 shrink-0">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="font-bold text-green-800">AI Coach</h1>
          {cycleDay && (
            <p className="text-xs text-green-600">
              Je bent op dag {cycleDay} van je cyclus
            </p>
          )}
        </div>
        {!isPro && (
          <div className="ml-auto bg-orange-50 text-orange-600 text-xs font-medium px-3 py-1 rounded-full">
            {FREE_MESSAGE_LIMIT - messageCount} berichten over
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-green-700 font-medium">Hoi! Ik ben je GLP-1 coach.</p>
            <p className="text-green-500 text-sm mt-1 max-w-xs mx-auto">
              Stel me gerust je vragen over bijwerkingen, voeding, of hoe je je voelt.
            </p>
            <div className="mt-6 space-y-2">
              {[
                "Waarom ben ik misselijk na mijn injectie?",
                "Wat moet ik eten op dag 2 van mijn cyclus?",
                "Is het normaal dat ik meer honger heb nu?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-sm bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-xl transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                <Brain className="w-3.5 h-3.5 text-orange-500" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-green-600 text-white rounded-br-sm"
                  : "bg-white border border-green-100 text-green-800 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mr-2 mt-1">
              <Brain className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="bg-white border border-green-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-green-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pro Wall Overlay */}
      {showProWall && (
        <div className="bg-white border-t border-green-100 rounded-t-2xl p-6 text-center shadow-lg">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-orange-500" />
          </div>
          <p className="font-semibold text-green-800 mb-1">Pro nodig voor meer coaching</p>
          <p className="text-sm text-green-600 mb-4">
            Met Pro heb je onbeperkt toegang tot je persoonlijke AI coach.
          </p>
          <a
            href="/settings"
            className="btn-primary text-sm py-2.5 px-6 inline-flex"
          >
            Upgrade naar Pro — €12,99/maand
          </a>
        </div>
      )}

      {/* Input */}
      {!showProWall && (
        <div className="border-t border-green-100 pt-4 flex gap-2 shrink-0">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel een vraag aan je coach..."
            className="input-field flex-1 resize-none text-sm"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-green-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 self-end"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
