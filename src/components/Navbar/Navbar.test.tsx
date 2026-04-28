import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimNavbar from './Navbar';

// ── Mock firebase auth ────────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: null },
}));

// ── Mock react-router-dom ─────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Mock assets ───────────────────────────────────────────────────────────────
vi.mock('../../assets/cuts_logo.png', () => ({ default: 'cuts_logo.png' }));

// ── Mock stores ───────────────────────────────────────────────────────────────
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { name: 'Test User', email: 'test@example.com' },
    firebaseUser: { displayName: 'Firebase User', photoURL: null },
    logout: vi.fn(),
  })),
}));

vi.mock('../../stores/simulationStore', () => ({
  useSimulationStore: vi.fn(() => ({
    isConnected: true,
  })),
}));

describe('SimNavbar Component', () => {
  const mockSimSocket = { current: null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render navbar with logo and title', () => {
    render(<SimNavbar simSocket={mockSimSocket} />);
    expect(screen.getByAltText('CUTS')).toBeInTheDocument();
    expect(screen.getByText(/CUTS - Collaborative Urban Traffic Simulator/)).toBeInTheDocument();
  });

  it('should display user name', () => {
    render(<SimNavbar simSocket={mockSimSocket} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should have user information displayed', () => {
    render(<SimNavbar simSocket={mockSimSocket} />);
    const userInfo = screen.queryByText(/Test User|test@example.com/);
    expect(userInfo).toBeInTheDocument();
  });

  it('should display logo', () => {
    render(<SimNavbar simSocket={mockSimSocket} />);
    const logo = screen.getByAltText('CUTS');
    expect(logo).toBeInTheDocument();
  });

  it('should display title', () => {
    render(<SimNavbar simSocket={mockSimSocket} />);
    expect(screen.getByText(/CUTS - Collaborative Urban Traffic Simulator/)).toBeInTheDocument();
  });
});
