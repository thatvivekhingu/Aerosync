"use client";

import React, { useState } from "react";
import { Send, Bot, User, Sparkles, HelpCircle } from "lucide-react";
import { CADASTRAL_QA_PAIRS } from "@/data/knowledge";

export default function RagChatbot() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 **Namaste! I am AeroSync Cadastral AI Assistant.**\nAsk me anything about SVAMITVA guidelines, DoLR land norms, parcel area calculations, water body buffer violations, or property card generation in English or Hindi!",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "What is ULPIN Bhu-Aadhaar and how is it generated?",
    "What is the setback buffer distance for water bodies?",
    "Gaon me kitne houses detect hue hain?",
    "What is the protocol for low confidence boundary?",
    "What attributes are mandatory on SVAMITVA Property Card?",
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    const userMsg = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    setTimeout(() => {
      const q = text.toLowerCase();
      let reply = CADASTRAL_QA_PAIRS["default"];

      if (q.includes("ulpin") || q.includes("aadhaar") || q.includes("bhu")) {
        reply = CADASTRAL_QA_PAIRS["ulpin"];
      } else if (q.includes("buffer") || q.includes("encroachment") || q.includes("talab") || q.includes("setback")) {
        reply = CADASTRAL_QA_PAIRS["buffer"];
      } else if (q.includes("uncertainty") || q.includes("confidence") || q.includes("doubt") || q.includes("protocol")) {
        reply = CADASTRAL_QA_PAIRS["uncertainty"];
      } else if (q.includes("property card") || q.includes("gharoni") || q.includes("kagaz") || q.includes("attribute")) {
        reply = CADASTRAL_QA_PAIRS["card"];
      } else if (q.includes("kitne") || q.includes("area") || q.includes("gaon") || q.includes("houses")) {
        reply = CADASTRAL_QA_PAIRS["hindi_gaon"];
      }

      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      setLoading(false);
    }, 450);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-lg min-h-[580px]">
      
      {/* Sidebar Quick Prompts */}
      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Sparkles size={16} className="text-primary" />
          <span>Cadastral RAG Prompts</span>
        </div>
        <p className="text-xs text-slate-500">Click any prompt to ask the AI assistant directly:</p>

        <div className="flex flex-col gap-2 mt-1">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-left p-3 rounded-xl bg-white hover:bg-primary-light text-slate-700 hover:text-primary text-xs font-medium border border-slate-200 hover:border-primary/40 transition-all duration-200 leading-snug"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Conversation Area */}
      <div className="lg:col-span-8 flex flex-col justify-between h-[520px]">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-primary text-white rounded-br-none shadow-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60"
                }`}
                dangerouslySetInnerHTML={{
                  __html: m.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>"),
                }}
              />

              {m.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center text-xs text-slate-400 pl-11">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
              <span>AeroSync AI analyzing land records...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-200 flex gap-2.5">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about land records, ULPIN, or survey results..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-primary text-sm transition-colors"
          />
          <button
            onClick={() => handleSend()}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm flex items-center gap-1.5 shadow-glow-primary transition-all duration-200"
          >
            <span>Send</span>
            <Send size={16} />
          </button>
        </div>

      </div>

    </div>
  );
}
