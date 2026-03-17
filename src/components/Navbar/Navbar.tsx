import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';
import { useSimulationStore } from '../../stores/simulationStore';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';

interface Props {
  simSocket: RefObject<Socket | null>;
}

export default function Navbar({ simSocket: _simSocket }: Props) {
  const { user, logout } = useAuthStore();
  const { isConnected, tick } = useSimulationStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    navigate('/auth');
  };

  const roleColor: Record<string, string> = {
    ADMIN: 'text-yellow-400',
    USER: 'text-blue-400',
    GUEST: 'text-slate-400',
  };

  return (
    <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">🚦</span>
        <span className="font-semibold text-white text-sm">Traffic Simulator</span>
        <span className="text-muted text-xs">Bogotá</span>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="text-xs text-muted">{isConnected ? 'Connected' : 'Disconnected'}</span>
        <span className="text-xs text-muted ml-2">tick #{tick}</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">{user.name || user.email}</span>
            <span className={`text-xs font-medium ${roleColor[user.role] || 'text-muted'}`}>
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-muted hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
