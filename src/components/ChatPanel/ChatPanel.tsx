import { useState, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  chatSocket: RefObject<Socket | null>;
}

export default function ChatPanel({ chatSocket }: Props) {
  const { messages, isConnected } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const content = input.trim();
    if (!content || !chatSocket.current) return;
    chatSocket.current.emit('message:send', { content });
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canChat = user?.role === 'USER' || user?.role === 'ADMIN';

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted">{msg.userName}</span>
                <span className="text-xs text-slate-600">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-sm max-w-[90%] break-words ${
                  isOwn
                    ? 'bg-sky-300 text-black rounded-br-sm'
                    : 'bg-sky-500/100 text-black rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canChat ? (
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Send a message..."
              maxLength={500}
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-black placeholder:text-muted focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-border text-center text-xs text-muted">
          Guest mode — chat disabled
        </div>
      )}
    </div>
  );
}
