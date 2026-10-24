"use client";

import React, { useEffect, useRef, useState } from "react";

type Message = { text: string; sender: "user" | "bot" };

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello, how can I help you today?", sender: "bot" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (text === "" || isLoading) return;

    const conversation: Message[] = [...messages, { text, sender: "user" }];
    setMessages(conversation);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.reply) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Sorry, I couldn't reach the AI service. Please try again in a moment.";
      setMessages((prev) => [
        ...prev,
        { text: message, sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex h-[min(72vh,660px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur-xl">
      {/* Chat log */}
      <div
        ref={scrollRef}
        className="chat-scrollbar flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`animate-rise flex items-end gap-2 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-1 ring-white/20">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-white"
                  aria-hidden="true"
                >
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                </svg>
              </span>
            )}
            <div
              className={`max-w-[80%] break-words px-4 py-2.5 text-sm leading-relaxed sm:text-base ${
                msg.sender === "user"
                  ? "rounded-2xl rounded-br-md bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-900/40"
                  : "rounded-2xl rounded-bl-md border border-white/10 bg-white/10 text-gray-100"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="animate-rise flex items-end gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-1 ring-white/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white"
                aria-hidden="true"
              >
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
              </svg>
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/10 px-4 py-3.5">
              <span className="dot-1 h-1.5 w-1.5 rounded-full bg-violet-300" />
              <span className="dot-2 h-1.5 w-1.5 rounded-full bg-violet-300" />
              <span className="dot-3 h-1.5 w-1.5 rounded-full bg-violet-300" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 bg-black/20 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            aria-label="Message"
            disabled={isLoading}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 placeholder-gray-400 outline-none transition focus:border-violet-400/60 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60 sm:text-base"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isLoading || inputValue.trim() === ""}
            aria-label="Send message"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-base"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="mt-2 px-1 text-center text-[11px] text-gray-500">
          AI responses may be inaccurate — double-check important information.
        </p>
      </div>
    </section>
  );
};

export default Chat;
