import { useState, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  chatSocket: RefObject<Socket | null>;
  pendingTimers: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>;
}

const FAIL_TIMEOUT = 10_000;

function genClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPanel({ chatSocket, pendingTimers }: Props) {
  const { messages, isConnected, addOptimisticMessage, failMessage } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const retry = (clientId: string) => {
    const msg = messages.find((m) => m.clientId === clientId);
    if (!msg || !chatSocket.current) return;
    chatSocket.current.emit('message:send', { content: msg.content, clientId });
    const existing = pendingTimers.current.get(clientId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      pendingTimers.current.delete(clientId);
      failMessage(clientId);
    }, FAIL_TIMEOUT);
    pendingTimers.current.set(clientId, timer);
  };

  const send = () => {
    const content = input.trim();
    if (!content || !chatSocket.current || !user) return;

    const clientId = genClientId();
    const localMsg = {
      id: 'local:' + clientId,
      userId: user.id,
      userName: user.name || user.email,
      content,
      timestamp: Date.now(),
      clientId,
      status: 'pending' as const,
    };

    addOptimisticMessage(localMsg);
    setInput('');

    chatSocket.current.emit('message:send', { content, clientId });

    const timer = setTimeout(() => {
      pendingTimers.current.delete(clientId);
      failMessage(clientId);
    }, FAIL_TIMEOUT);
    pendingTimers.current.set(clientId, timer);
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
                {msg.status === 'pending' && (
                  <span className="text-xs text-slate-400 italic">Enviando&hellip;</span>
                )}
                {msg.status === 'failed' && (
                  <button
                    onClick={() => msg.clientId && retry(msg.clientId)}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Fall&oacute;
                  </button>
                )}
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-sm max-w-[90%] break-words transition-opacity ${
                  msg.status === 'pending' ? 'opacity-60' : ''
                } ${
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
        <div className="p-3 border-t border-[var(--s-border)] shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isConnected ? 'Send a message...' : 'Reconnecting...'}
              maxLength={500}
              disabled={!isConnected}
              className="flex-1 px-3 py-2 bg-surface border border-[var(--s-border)] rounded-lg text-sm text-black placeholder:text-muted focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || !isConnected}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-[var(--s-border)] text-center text-xs text-muted">
          Guest mode — chat disabled
        </div>
      )}
    </div>
  );
}