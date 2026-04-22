import { useState } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import ControlPanel from '../ControlPanel/ControlPanel';
import AdminPanel from '../AdminPanel/AdminPanel';
import { useAuthStore } from '../../stores/authStore';

type LeftTab = 'control' | 'admin';

interface Props {
  simSocket: RefObject<Socket | null>;
  openMobile: boolean;
  onCloseMobile: () => void;
}

export default function LeftPanel({ simSocket, openMobile, onCloseMobile }: Props) {
  const [tab, setTab] = useState<LeftTab>('control');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className={`sim-left-panel ${openMobile ? 'mobile-open' : ''}`}>
      <div className={`sim-panel-tabs ${!isAdmin ? 'single' : ''}`}>
        <button
          onClick={() => setTab('control')}
          className={`sim-panel-tab ${tab === 'control' ? 'sim-panel-tab--active' : 'sim-panel-tab--idle'}`}
        >
          Control
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab('admin')}
            className={`sim-panel-tab ${tab === 'admin' ? 'sim-panel-tab--active' : 'sim-panel-tab--idle'}`}
          >
            Admin
          </button>
        )}
      </div>

      <div className="sim-panel-content">
        {tab === 'control' && <ControlPanel simSocket={simSocket} />}
        {tab === 'admin' && isAdmin && <AdminPanel simSocket={simSocket} />}
      </div>

      <button className="sim-mobile-close" onClick={onCloseMobile} type="button">
        Cerrar
      </button>
    </aside>
  );
}
