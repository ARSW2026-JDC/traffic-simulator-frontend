import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';
import { useSimulationStore } from '../../stores/simulationStore';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import cutsLogo from '../../assets/cuts_logo.png';

interface Props {
  simSocket: RefObject<Socket | null>;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
}

export default function SimNavbar({ simSocket: _simSocket, onToggleLeft, onToggleRight }: Props) {
  const { user, firebaseUser, logout } = useAuthStore();
  const { isConnected } = useSimulationStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate('/landing', { replace: true });
    try {
      await signOut(auth);
    } catch {
      // Keep local logout/navigation even if remote signOut fails.
    }
  };

  const displayName = user?.name || firebaseUser?.displayName || user?.email || 'Usuario';
  const avatarUrl = user?.avatarUrl || firebaseUser?.photoURL || null;

  return (
    <header className="sim-nav">
      {/* Brand */}
      <div className="sim-nav-brand">
        <img src={cutsLogo} alt="CUTS" className="sim-nav-logo" />
        <span className="sim-nav-title">CUTS - Collaborative Urban Traffic Simulator</span>
      </div>

      {/* Connection dot */}
      <div className="sim-conn-status">
        <div
          className={`sim-conn-dot ${isConnected ? 'sim-conn-dot--on' : 'sim-conn-dot--off'}`}
          aria-hidden="true"
        />
        <span className="sim-conn-text">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {/* Right side */}
      <div className="sim-nav-right">
        <button className="sim-nav-menu" onClick={onToggleLeft} title="Mostrar panel izquierdo" type="button">
          ☰
        </button>
        <button className="sim-nav-menu sim-nav-menu--right" onClick={onToggleRight} title="Mostrar chat e historial" type="button">
          💬
        </button>
        <div className="sim-nav-user">
          <span>{displayName}</span>
          <div className="sim-nav-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </div>
        </div>
        <button className="sim-nav-logout" onClick={handleLogout} title="Cerrar sesión">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
