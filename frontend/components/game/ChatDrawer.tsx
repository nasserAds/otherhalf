'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

interface ChatEntry {
  id: string;
  userId: string;
  username: string;
  content: string;
}

interface ChatDrawerProps {
  messages: ChatEntry[];
  onSend: (content: string) => void;
}

export function ChatDrawer({ messages, onSend }: ChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(messages.length);

  useEffect(() => {
    if (messages.length > lastCount.current) {
      if (!open) setUnread((u) => u + (messages.length - lastCount.current));
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
    lastCount.current = messages.length;
  }, [messages, open]);

  function toggle() {
    setOpen((o) => !o);
    if (!open) setUnread(0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  }

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="w-[280px] max-w-[80vw] bg-ink-900 border border-line-800 rounded-lg shadow-lg flex flex-col overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-line-800">
              <span className="text-xs font-extrabold text-fg-100">الدردشة</span>
              <span className="text-[10px] text-fg-600 mr-2">— يمكنك الكتابة والتحدث بالميكروفون معًا</span>
            </div>
            <div ref={listRef} className="flex flex-col gap-1.5 p-3 max-h-52 overflow-y-auto text-xs">
              {messages.length === 0 && <p className="text-fg-600 text-center py-2">لا رسائل بعد</p>}
              {messages.map((m) => (
                <div key={m.id}>
                  <span className="font-bold text-mint">{m.username}: </span>
                  <span className="text-fg-100">{m.content}</span>
                </div>
              ))}
            </div>
            <form onSubmit={submit} className="flex items-center gap-2 border-t border-line-800 px-3 py-2.5">
              <label htmlFor="game-chat-input" className="sr-only">اكتب رسالة في الدردشة</label>
              <input
                id="game-chat-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="اكتب رسالة..."
                className="bg-transparent flex-1 outline-none text-fg-100 placeholder:text-fg-500 text-xs"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="rounded-pill bg-mint px-3 py-1.5 text-[11px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                إرسال
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggle}
        aria-label={open ? 'إغلاق الدردشة' : 'فتح الدردشة'}
        aria-expanded={open}
        className={clsx(
          'btn-press relative flex items-center gap-2 px-4 py-2.5 rounded-pill font-bold text-[13px] border transition-colors',
          open ? 'bg-mint text-white border-mint shadow-mint' : 'bg-ink-900 text-fg-500 border-line-800 hover:text-fg-100',
        )}
      >
        <ChatIcon />
        الدردشة
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber text-[#35260A] text-[10px] font-black flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
