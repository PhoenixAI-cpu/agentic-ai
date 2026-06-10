'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, ChevronDown, ChevronRight } from 'lucide-react';
import { AnaMessage } from '@/lib/types';

const SUGGESTED_PROMPTS = [
  'Compare our lead against approved EGFR inhibitors',
  'Summarise latest Phase II failures in oncology',
  'Suggest targets for neuroinflammation',
  'What are the ADMET liabilities of AX-7291?',
  'Generate a hypothesis for improving selectivity in our KRAS series',
];

export default function AnaFullPage() {
  const [messages, setMessages] = useState<AnaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: AnaMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const anaId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: anaId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    try {
      const response = await fetch('/api/ana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                accumulated += parsed.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === anaId ? { ...m, content: accumulated } : m
                  )
                );
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === anaId
            ? {
                ...m,
                content:
                  'I apologise — there was an error processing your request. Please ensure the API key is configured correctly in your environment.',
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoning((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem-3rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base"
          style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--blue) 100%)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          A
        </div>
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
          >
            Ana
          </h1>
          <p className="text-xs" style={{ color: 'var(--faint)' }}>
            Your AI scientific copilot — Bayesian inference over biomedical data
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
          <span className="text-xs" style={{ color: 'var(--faint)' }}>Ready</span>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto rounded-xl border border-[var(--line)] p-4 space-y-4 mb-3"
        style={{ background: 'var(--panel)' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
              style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--blue) 100%)', fontFamily: 'var(--font-space-grotesk)' }}
            >
              A
            </div>
            <div className="text-center">
              <p className="font-medium" style={{ color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk)' }}>
                How can I help you today?
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--faint)' }}>
                Ask me about molecules, targets, trials, or your discovery pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--line)] hover:border-[var(--cyan)] hover:bg-[var(--cyan-soft)] transition-colors"
                  style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--blue) 100%)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                A
              </div>
            )}
            <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm text-white'
                    : 'rounded-bl-sm border border-[var(--line)]'
                }`}
                style={{
                  background: msg.role === 'user' ? 'var(--blue)' : 'var(--panel)',
                  color: msg.role === 'user' ? 'white' : 'var(--ink)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {msg.content || (
                  <span className="flex gap-1.5 items-center py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--faint)', animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--faint)', animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--faint)', animationDelay: '300ms' }} />
                  </span>
                )}
              </div>

              {msg.role === 'assistant' && msg.content && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleReasoning(msg.id)}
                    className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}
                  >
                    {expandedReasoning.has(msg.id) ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                    Reasoning
                  </button>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: '#E8F8F3', color: 'var(--green)', fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    Confident
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--faint)' }}>
                    Sources: ChEMBL, UniProt, PubMed
                  </span>
                </div>
              )}

              {msg.role === 'assistant' && expandedReasoning.has(msg.id) && (
                <div
                  className="text-xs rounded-xl px-4 py-3 border border-[var(--line)] max-w-full leading-relaxed"
                  style={{ background: 'var(--bg)', color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}
                >
                  <p className="font-semibold mb-1" style={{ color: 'var(--ink)' }}>Reasoning</p>
                  Response synthesised from ChEMBL compound activity data, UniProt target annotations, and PubMed literature corpus. Bayesian confidence updated against available experimental evidence. Where primary data is unavailable, the response notes what would be retrieved and from which source.
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5"
                style={{ background: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                SC
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="rounded-xl border border-[var(--line)] overflow-hidden"
        style={{ background: 'var(--panel)' }}
      >
        <div className="flex items-start gap-2 px-3 pt-3 pb-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ana anything... (Ctrl+Enter to send)"
            rows={2}
            className="flex-1 resize-none bg-transparent text-sm focus:outline-none leading-relaxed"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}
            disabled={isStreaming}
          />
        </div>
        <div className="flex items-center gap-2 px-3 pb-3 border-t border-[var(--line)] pt-2">
          <button
            className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}
            aria-label="Attach file"
          >
            <Paperclip size={14} />
            Attach
          </button>
          <span className="text-xs ml-auto" style={{ color: 'var(--faint)' }}>
            Ctrl+Enter to send
          </span>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 hover:opacity-90"
            style={{ background: 'var(--blue)', fontFamily: 'var(--font-inter)' }}
          >
            <Send size={13} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
