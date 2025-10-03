import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const RagSidebar = ({ open, onClose }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {id, role: 'user'|'assistant', content}
  const listRef = useRef(null);
  const sendingRef = useRef(false);
  const [isComposing, setIsComposing] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Auto-scroll when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  const sendMessage = async () => {
    if (sendingRef.current) return; // prevent rapid double invokes
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "user" && last.content === trimmed) {
        return prev; // dedupe identical consecutive user messages
      }
      return [...prev, userMsg];
    });
    setInput("");
    sendingRef.current = true;

    try {
      const response = await axios.post("http://localhost:8000/search/ask", { query: trimmed });
      const answer = response?.data?.answer ?? "";
      const botMsg = { id: `a-${Date.now()}`, role: "assistant", content: answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const botMsg = { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I couldn't process that request." };
      setMessages((prev) => [...prev, botMsg]);
    }
    sendingRef.current = false;
  };

  return (
    <div className={`pointer-events-none fixed inset-0 z-40 ${open ? "" : ""}`}>
      {/* Backdrop */}
      <div
        className={`pointer-events-auto absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`pointer-events-auto absolute right-0 top-0 h-full w-[380px] md:w-[420px] lg:w-[480px] bg-[#1c1d25] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="RAG Assistant"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src="https://img.icons8.com/pulsar-gradient/48/why-us-female.png"
              alt="RAG Assistant"
              width={24}
              height={24}
            />
            <h3 className="text-white font-medium">RAG Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-white rounded-md px-2 py-1"
            aria-label="Close RAG Assistant"
          >
            ✕
          </button>
        </div>

        {/* Messages list */}
        <div ref={listRef} className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-sm text-neutral-400 text-center mt-10">
              Ask anything about your chat history.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm break-words border ${
                    m.role === "user"
                      ? "bg-[#8417ff]/10 text-[#d6c5ff] border-[#8417ff]/40"
                      : "bg-[#2a2b33]/40 text-white/85 border-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-[#1c1d25]">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-[#2a2b33] text-white rounded-md px-3 py-3 focus:outline-none"
              placeholder="Ask the assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              className="bg-[#8417ff] hover:bg-[#741bda] text-white px-4 py-3 rounded-md"
            >
              Send
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default RagSidebar;


