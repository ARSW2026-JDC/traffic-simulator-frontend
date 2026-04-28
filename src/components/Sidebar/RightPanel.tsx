import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import ChatPanel from '../ChatPanel/ChatPanel';
import HistoryPanel from '../HistoryPanel/HistoryPanel';

type RightTab = 'chat' | 'history';

interface Props {
  chatSocket: { socketRef: RefObject<Socket | null>; pendingTimers: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>> };
  openMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function RightPanel({ chatSocket, openMobile, onCloseMobile }: Props) {
  const [tab, setTab] = useState<RightTab>('chat');
  const { isConnected, messages } = useChatStore();
  void onCloseMobile;

  return (
    <aside className={`sim-right-panel slim ${openMobile ? 'mobile-open' : ''}`}>
      <button className="sim-mobile-close" onClick={onCloseMobile} type="button">
        Cerrar
      </button>
      <div className="sim-right-tabs two-cols">
        <button
          onClick={() => setTab('chat')}
          className={`sim-right-tab ${tab === 'chat' ? 'sim-right-tab--active' : 'sim-right-tab--idle'}`}
        >
          <span className="sim-right-tab-dot" title={isConnected ? 'Conectado' : 'Desconectado'}>
            <span className={`sim-right-tab-dot-inner ${isConnected ? 'sim-right-tab-dot--on' : 'sim-right-tab-dot--off'}`} />
          </span>
          Chat
        </button>
        <button
          onClick={() => setTab('history')}
          className={`sim-right-tab ${tab === 'history' ? 'sim-right-tab--active' : 'sim-right-tab--idle'}`}
        >
          History
        </button>
      </div>

      <div className="sim-right-content">
        {tab === 'chat' && <ChatPanel chatSocket={chatSocket.socketRef} pendingTimers={chatSocket.pendingTimers} />}
        {tab === 'history' && <HistoryPanel />}
      </div>
    </aside>
  );
}