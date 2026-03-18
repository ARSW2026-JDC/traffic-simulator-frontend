import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import ControlPanel from '../ControlPanel/ControlPanel';
import ChatPanel from '../ChatPanel/ChatPanel';
import HistoryPanel from '../HistoryPanel/HistoryPanel';
import AdminPanel from '../AdminPanel/AdminPanel';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'control' | 'chat' | 'history' | 'admin';

interface Props {
  simSocket: RefObject<Socket | null>;
  chatSocket: RefObject<Socket | null>;
  historySocket: RefObject<Socket | null>;
}

export default function Sidebar({ simSocket, chatSocket }: Props) {
  const [tab, setTab] = useState<Tab>('control');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'control', label: 'Control' },
    { id: 'chat', label: 'Chat' },
    { id: 'history', label: 'History' },
    ...(isAdmin ? [{ id: 'admin' as Tab, label: 'Admin' }] : []),
  ];

  const { isConnected } = useChatStore();

  return (
    <aside className="w-80 flex flex-col bg-card border-l border-border shrink-0 overflow-hidden">
      <div className="flex border-b border-border shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-muted hover:text-white'
            }`}
          >
            {t.id === 'chat' && (
              <span
                className="inline-block align-middle mr-2"
                title={isConnected ? 'Conectado' : 'Desconectado'}
              >
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </span>
            )}
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'control' && <ControlPanel simSocket={simSocket} />}
        {tab === 'chat' && <ChatPanel chatSocket={chatSocket} />}
        {tab === 'history' && <HistoryPanel />}
        {tab === 'admin' && isAdmin && <AdminPanel simSocket={simSocket} />}
      </div>
    </aside>
  );
}
