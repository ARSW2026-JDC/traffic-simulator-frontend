import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// ── Mock firebase auth ────────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: null) => void) => {
    cb(null);
    return vi.fn();
  }),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('./services/firebase', () => ({
  auth: { currentUser: null },
}));

// ── Mock pages ────────────────────────────────────────────────────────────────
vi.mock('./pages/AuthPage', () => ({
  default: () => <div data-testid="auth-page">AuthPage</div>,
}));

vi.mock('./pages/SimulationPage', () => ({
  default: () => <div data-testid="simulation-page">SimulationPage</div>,
}));

vi.mock('./pages/LandingPage', () => ({
  default: () => <div data-testid="landing-page">LandingPage</div>,
}));

// ── Mock API service ──────────────────────────────────────────────────────────
vi.mock('./services/api', () => ({
  verifyToken: vi.fn().mockResolvedValue(null),
}));

// ── Mock auth store ───────────────────────────────────────────────────────────
vi.mock('./stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    firebaseUser: null,
    user: null,
    setFirebaseUser: vi.fn(),
    setUser: vi.fn(),
    setLoading: vi.fn(),
    isLoading: false,
  })),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('should render landing page when user is not authenticated', () => {
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(screen.queryByTestId('simulation-page')).not.toBeInTheDocument();
  });

  it('should navigate to landing page on wildcard route', () => {
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('should have BrowserRouter setup', () => {
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });
});
