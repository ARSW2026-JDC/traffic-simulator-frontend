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
    <aside className="sim-right-panel">
      <div className="sim-right-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`sim-right-tab ${
              tab === t.id
                ? 'sim-right-tab--active'
                : 'sim-right-tab--idle'
            }`}
          >
            {t.id === 'chat' && (
              <span
                className="sim-right-tab-dot"
                title={isConnected ? 'Conectado' : 'Desconectado'}
              >
                <span
                  className={`sim-right-tab-dot-inner ${
                    isConnected ? 'sim-right-tab-dot--on' : 'sim-right-tab-dot--off'
                  }`}
                />
              </span>
            )}
            {t.label}
          </button>
        ))}
      </div>

      <div className="sim-right-content">
        {tab === 'control' && <ControlPanel simSocket={simSocket} />}
        {tab === 'chat' && <ChatPanel chatSocket={chatSocket} />}
        {tab === 'history' && <HistoryPanel />}
        {tab === 'admin' && isAdmin && <AdminPanel simSocket={simSocket} />}
      </div>
    </aside>
  );
}
