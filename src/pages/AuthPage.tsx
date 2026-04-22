import { useState, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';
import cutsLogo from '../assets/cuts_logo.png';
import authBg from '../assets/auth_bg.jpg';

/* ── Eye icons ─────────────────────────────────────────────────────────────── */
function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Floating-label input ──────────────────────────────────────────────────── */
function FloatingInput({
  id, type, label, value, onChange, required = true,
  showToggle = false,
}: {
  id: string; type: string; label: string; value: string;
  onChange: (v: string) => void; required?: boolean; showToggle?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className={`auth-field ${lifted ? 'auth-field--lifted' : ''} ${focused ? 'auth-field--focused' : ''}`}>
      <input
        id={id}
        type={showToggle ? (visible ? 'text' : 'password') : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="auth-field-input"
        autoComplete={type === 'email' ? 'email' : 'current-password'}
      />
      <label htmlFor={id} className="auth-field-label">{label}</label>
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          className="auth-field-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOpen /> : <EyeOff />}
        </button>
      )}
      <span className="auth-field-bar" />
    </div>
  );
}

/* ── Spinner ───────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span className="auth-spinner" aria-hidden="true" />
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Correo o contraseña incorrectos.'
        : err.code === 'auth/email-already-in-use'
        ? 'Este correo ya está registrado.'
        : err.code === 'auth/weak-password'
        ? 'La contraseña debe tener al menos 6 caracteres.'
        : err.message;
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true); setError('');
    try {
      await signInAnonymously(auth);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    if (m === mode) return;
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-root" style={{ backgroundImage: `url(${authBg})` }}>
      {/* Animated overlay */}
      <div className="auth-overlay">
        {/* Floating blobs */}
        <div className="auth-blob auth-blob--1" />
        <div className="auth-blob auth-blob--2" />
        <div className="auth-blob auth-blob--3" />
      </div>

      {/* Card */}
      <div ref={cardRef} className={`auth-card ${shake ? 'auth-card--shake' : ''}`}>

        {/* Logo */}
        <div className="auth-header">
          <img src={cutsLogo} alt="CUTS" className="auth-logo" />
          <h1 className="auth-title">CUTS</h1>
          <p className="auth-subtitle">
            Simulador Urbano Colaborativo de Tráfico en Tiempo Real
          </p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs" role="tablist">
          <div
            className="auth-tab-indicator"
            style={{ transform: mode === 'register' ? 'translateX(100%)' : 'translateX(0)' }}
          />
          <button
            id="tab-login"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            id="tab-register"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handle} className="auth-form" noValidate>
          <FloatingInput
            id="auth-email"
            type="email"
            label="Ingresa tu correo"
            value={email}
            onChange={setEmail}
          />
          <FloatingInput
            id="auth-password"
            type="password"
            label="Ingresa tu contraseña"
            value={password}
            onChange={setPassword}
            showToggle
          />

          {/* Error */}
          {error && (
            <div className="auth-error" role="alert">
              <svg viewBox="0 0 20 20" fill="currentColor" className="auth-error-icon">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            className="auth-btn-main"
          >
            {loading ? (
              <><Spinner /> {mode === 'login' ? 'Iniciando...' : 'Creando cuenta...'}</>
            ) : (
              mode === 'login' ? 'Iniciar sesión' : 'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider"><span>o continúa con</span></div>

        {/* Alt buttons */}
        <div className="auth-alts">
          <button id="auth-google" onClick={handleGoogle} disabled={loading} className="auth-btn-alt">
            <span className="auth-btn-alt-left">
              <svg className="auth-alt-icon" viewBox="0 0 48 48" fill="none">
                <g clipPath="url(#g1)">
                  <path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.684H24.48v9.02h12.98c-.56 3.02-2.24 5.58-4.78 7.3v6.06h7.74c4.54-4.18 7.11-10.34 7.11-17.696z" fill="#4285F4"/>
                  <path d="M24.48 48c6.48 0 11.92-2.14 15.89-5.82l-7.74-6.06c-2.15 1.44-4.91 2.3-8.15 2.3-6.26 0-11.56-4.22-13.46-9.9H2.5v6.22C6.46 43.98 14.7 48 24.48 48z" fill="#34A853"/>
                  <path d="M11.02 28.52c-.5-1.44-.79-2.98-.79-4.52s.29-3.08.79-4.52v-6.22H2.5A23.97 23.97 0 000 24c0 3.98.97 7.74 2.5 11.02l8.52-6.5z" fill="#FBBC05"/>
                  <path d="M24.48 9.54c3.53 0 6.68 1.22 9.17 3.62l6.87-6.87C36.4 2.14 30.96 0 24.48 0 14.7 0 6.46 4.02 2.5 10.98l8.52 6.22c1.9-5.68 7.2-9.9 13.46-9.9z" fill="#EA4335"/>
                </g>
                <defs><clipPath id="g1"><rect width="48" height="48" fill="white"/></clipPath></defs>
              </svg>
              Ingresar con Google
            </span>
            <span className="auth-btn-arrow">›</span>
          </button>

          <button id="auth-guest" onClick={handleGuest} disabled={loading} className="auth-btn-alt">
            <span className="auth-btn-alt-left">
              <svg className="auth-alt-icon" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Ingresar como invitado
            </span>
            <span className="auth-btn-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
