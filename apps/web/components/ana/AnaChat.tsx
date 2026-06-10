'use client';

import { useState, useRef, useEffect } from 'react';

const SUGGESTED_PROMPTS = [
  'Compare our lead against approved EGFR inhibitors',
  'Summarise latest Phase II failures in oncology',
  'Suggest targets for neuroinflammation',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AnaChatProps {
  compact?: boolean;
}

// Cyan 4-point star SVG icon
function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z"
        fill="var(--cyan, #00D4FF)"
      />
    </svg>
  );
}

export default function AnaChat({ compact = false }: AnaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const anaId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: anaId, role: 'assistant', content: '' },
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
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === anaId ? { ...m, content: accumulated } : m
                  )
                );
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== anaId));
      setError('Ana is unavailable at the moment. Please check your API key.');
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Error state */}
      {error && (
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs border"
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            borderColor: 'rgba(251, 191, 36, 0.3)',
            color: 'rgb(251, 191, 36)',
            fontFamily: 'var(--font-inter)',
          }}
        >
          {error}
        </div>
      )}

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${
          compact ? 'min-h-[160px]' : 'min-h-[300px]'
        }`}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p
              className="text-sm text-white/50"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Ask Ana anything about your drug discovery pipeline.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="mr-2 mt-1 flex-shrink-0">
                <StarIcon />
              </div>
            )}
            <div
              className={`max-w-[80%] ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              } flex flex-col gap-1`}
            >
              <div
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'text-white/90 rounded-bl-sm border border-white/10'
                }`}
                style={{
                  background:
                    msg.role === 'user'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.05)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {msg.content ? (
                  <span>
                    {msg.content}
                    {isStreaming && msg.role === 'assistant' && msg.content && (
                      <span className="inline-block w-0.5 h-3.5 bg-white/70 ml-0.5 animate-pulse" />
                    )}
                  </span>
                ) : msg.role === 'assistant' ? (
                  <span className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </span>
                ) : null}
              </div>
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
              style={{
                background: 'rgba(255,255,255,0.08)',
                fontFamily: 'var(--font-inter)',
              }}
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
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
