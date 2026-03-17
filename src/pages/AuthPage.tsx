import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black">Traffic Simulator</h1>
          <p className="text-muted text-sm mt-1">Real-Time Simulation</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-2xl">
          <div className="flex mb-6 bg-surface rounded-lg p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm rounded-md transition-all ${
                  mode === m
                    ? 'bg-gray-800 text-white font-medium'
                    : 'text-muted hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Login'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-gray placeholder-muted focus:outline-none focus:border-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-gray placeholder-muted focus:outline-none focus:border-black"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gray-800 hover:bg-black disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Separador visual */}
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-border" />
            <span className="mx-3 text-muted text-xs font-medium"> O </span>
            <div className="flex-grow h-px bg-border" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_17_40)">
                  <path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.684H24.48v9.02h12.98c-.56 3.02-2.24 5.58-4.78 7.3v6.06h7.74c4.54-4.18 7.11-10.34 7.11-17.696z" fill="#4285F4"/>
                  <path d="M24.48 48c6.48 0 11.92-2.14 15.89-5.82l-7.74-6.06c-2.15 1.44-4.91 2.3-8.15 2.3-6.26 0-11.56-4.22-13.46-9.9H2.5v6.22C6.46 43.98 14.7 48 24.48 48z" fill="#34A853"/>
                  <path d="M11.02 28.52c-.5-1.44-.79-2.98-.79-4.52s.29-3.08.79-4.52v-6.22H2.5A23.97 23.97 0 000 24c0 3.98.97 7.74 2.5 11.02l8.52-6.5z" fill="#FBBC05"/>
                  <path d="M24.48 9.54c3.53 0 6.68 1.22 9.17 3.62l6.87-6.87C36.4 2.14 30.96 0 24.48 0 14.7 0 6.46 4.02 2.5 10.98l8.52 6.22c1.9-5.68 7.2-9.9 13.46-9.9z" fill="#EA4335"/>
                </g>
                <defs>
                  <clipPath id="clip0_17_40">
                    <rect width="48" height="48" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <span className="text-gray-700">Sign in with Google</span>
            </button>
            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-gray-700">Continue as Guest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
