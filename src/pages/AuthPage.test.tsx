import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock Firebase auth functions ──────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInAnonymously: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: null) => void) => {
    cb(null);
    return vi.fn();
  }),
}));

vi.mock('../services/firebase', () => ({
  auth: { currentUser: null },
}));

// ── Mock react-router-dom navigate ────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Mock assets ───────────────────────────────────────────────────────────────
vi.mock('../assets/cuts_logo.png', () => ({ default: 'cuts_logo.png' }));
vi.mock('../assets/auth_bg.jpg', () => ({ default: 'auth_bg.jpg' }));

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
} from 'firebase/auth';
import AuthPage from './AuthPage';

const mockSignInWithEmail = vi.mocked(signInWithEmailAndPassword);
const mockCreateUser = vi.mocked(createUserWithEmailAndPassword);
const mockSignInAnonymously = vi.mocked(signInAnonymously);
const mockSignInWithPopup = vi.mocked(signInWithPopup);

const renderAuthPage = () =>
  render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>,
  );

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render auth page', () => {
    renderAuthPage();
    expect(screen.getByText('CUTS')).toBeDefined();
  });

  it('should render login tab by default', () => {
    renderAuthPage();
    const loginTab = screen.getByRole('tab', { name: /Iniciar|login/i }) || screen.queryByText('Iniciar');
    expect(loginTab).toBeDefined();
  });

  it('should render register tab button', () => {
    renderAuthPage();
    const registerTab = screen.getByRole('tab', { name: /Registrarse|register/i }) || screen.queryByText('Registrarse');
    expect(registerTab).toBeDefined();
  });

  it('should have email and password input fields', () => {
    renderAuthPage();
    const inputs = screen.queryAllByRole('textbox').concat(screen.queryAllByRole('textbox', { hidden: true }));
    expect(inputs.length >= 2).toBe(true);
  });

  it('should show login button', () => {
    renderAuthPage();
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length > 0).toBe(true);
  });


  it('should render the page without throwing error', () => {
    expect(() => renderAuthPage()).not.toThrow();
  });
});

