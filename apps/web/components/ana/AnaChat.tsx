'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { AnaMessage } from '@/lib/types';

const SUGGESTED_PROMPTS = [
  'Compare our lead against approved EGFR inhibitors',
  'Summarise latest Phase II failures in oncology',
  'Suggest targets for neuroinflammation',
];

interface AnaChatProps {
  compact?: boolean;
}

export default function AnaChat({ compact = false }: AnaChatProps) {
  const [messages, setMessages] = useState<AnaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const placeholderMsg: AnaMessage = {
      id: anaId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, placeholderMsg]);

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
        const lines = chunk.split('\n');
        for (const line of lines) {
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
              // Non-JSON line, skip
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === anaId
            ? {
                ...m,
                content:
                  'I apologise — there was an error processing your request. Please ensure the API key is configured and try again.',
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${compact ? 'min-h-[160px]' : 'min-h-[300px]'}`}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-white/50" style={{ fontFamily: 'var(--font-inter)' }}>
              Ask Ana anything about your drug discovery pipeline.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="mr-2 mt-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'var(--cyan)', fontFamily: 'var(--font-space-grotesk)' }}
                >
                  A
                </div>
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'text-white/90 rounded-bl-sm border border-white/10'
                }`}
                style={{
                  background: msg.role === 'user' ? 'var(--cyan)' : 'rgba(255,255,255,0.08)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {msg.content || (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
              {msg.role === 'assistant' && msg.content && (
                <button
                  onClick={() => toggleReasoning(msg.id)}
                  className="text-[10px] text-white/40 hover:text-white/70 transition-colors px-1"
                >
                  {expandedReasoning.has(msg.id) ? 'Hide reasoning' : 'Show reasoning'}
                </button>
              )}
              {msg.role === 'assistant' && expandedReasoning.has(msg.id) && (
                <div
                  className="text-xs text-white/50 bg-white/5 rounded-lg px-3 py-2 border border-white/10 max-w-full"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Reasoning drawn from biomedical literature, ChEMBL compound data, and UniProt target annotations. Confidence depends on available evidence.
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="text-xs text-white/80 px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', fontFamily: 'var(--font-inter)' }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-4">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <button
            className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask Ana a question..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
            style={{ fontFamily: 'var(--font-inter)' }}
            disabled={isStreaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
            style={{ background: 'var(--cyan)' }}
            aria-label="Send message"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
