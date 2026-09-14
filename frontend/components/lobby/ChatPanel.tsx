'use client';

import { useEffect, useRef, useState } from 'react';

interface ChatEntry {
  id: string;
  username: string;
  content: string;
}

interface ChatPanelProps {
  messages: ChatEntry[];
  onSend: (content: string) => void;
}

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Always keep the newest message in view as new ones arrive.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  }

  return (
    <div className="bg-ink-800 border border-line-800 rounded-md overflow-hidden">
      {/* Message list — sits above the input bar so history is always visible, not hidden behind a placeholder. */}
      <div ref={listRef} className="flex flex-col gap-1 px-3 py-2 max-h-28 overflow-y-auto text-xs">
        {messages.length === 0 ? (
          <p className="text-fg-600 text-center py-1">لا رسائل بعد — ابدأ المحادثة</p>
        ) : (
          messages.map((m) => (
            <div key={m.id}>
              <span className="font-bold text-mint">{m.username}: </span>
              <span className="text-fg-100">{m.content}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-line-800 px-3 py-2.5 text-xs">
        <ChatIcon />
        <label htmlFor="lobby-chat-input" className="sr-only">اكتب رسالة في الدردشة</label>
        <input
          id="lobby-chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رسالة..."
          className="bg-transparent flex-1 outline-none text-fg-100 placeholder:text-fg-500"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-pill bg-mint px-3 py-1.5 font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          إرسال
        </button>
      </form>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fg-500 flex-none">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
