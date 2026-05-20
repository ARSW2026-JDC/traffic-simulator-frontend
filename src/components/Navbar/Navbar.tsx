import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useThemeStore } from '../../stores/themeStore';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import cutsLogo from '../../assets/cuts_logo.png';

interface Props {
  simSocket: RefObject<Socket | null>;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  onToggleUsers?: () => void;
}

export default function SimNavbar({ simSocket: _simSocket, onToggleLeft, onToggleRight, onToggleUsers }: Props) {
  const { user, firebaseUser, logout } = useAuthStore();
  const { isConnected } = useSimulationStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

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
          <span className="sim-nav-title" title="Collaborative Urban Traffic Simulator">CUTS</span>
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

      <button
        onClick={toggleTheme}
        className="sim-nav-theme"
        title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
        type="button"
      >
        {isDarkMode ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      {/* Right side */}
      <div className="sim-nav-right">
        {isAdmin && onToggleUsers && (
          <button
            className="sim-nav-users"
            onClick={onToggleUsers}
            title="Gestión de usuarios"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </button>
        )}
        <button className="sim-nav-menu" onClick={onToggleLeft} title="Mostrar panel" type="button">
          ☰
        </button>
        <button className="sim-nav-menu sim-nav-menu--right" onClick={onToggleRight} title="Mostrar chat y historial" type="button">
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
