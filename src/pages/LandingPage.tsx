import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { useEffect, useState } from 'react';
import trafficHero from '../assets/traffic_hero.png';
import cutsLogo from '../assets/cuts_logo.png';

// ── Logo image ───────────────────────────────────────────────────────────────
function CutsLogo() {
  return (
    <img src={cutsLogo} alt="CUTS Logo" className="cuts-logo-img" />
  );
}

// ── Animated typing for "tiempo real" ────────────────────────────────────────
function AnimatedHighlight({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => {
        setDisplayed((p) => p + text[idx]);
        setIdx((i) => i + 1);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [idx, text]);

  return (
    <span style={{ color: '#007FBD' }}>
      {displayed}
      {idx < text.length && (
        <span className="cuts-cursor">|</span>
      )}
    </span>
  );
}

// ── Stats counter ─────────────────────────────────────────────────────────────
function StatCounter({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="cuts-stat">
      <span className="cuts-stat-num">{count}{suffix}</span>
      <span className="cuts-stat-label">{label}</span>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="cuts-landing">

      {/* ── NAVBAR ── */}
      <nav className="cuts-nav">
        <div className="cuts-nav-brand">
          <CutsLogo />
          <span className="cuts-brand-text">CUTS - Collaborative Urban Traffic Simulator</span>
        </div>
        <div className="cuts-nav-actions">
          <button
            id="btn-login"
            className="cuts-btn-ghost"
            onClick={() => navigate('/auth')}
          >
            Iniciar sesión
          </button>
          <button
            id="btn-register"
            className="cuts-btn-primary"
            onClick={() => navigate('/auth')}
          >
            Registrarse
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={`cuts-hero ${heroVisible ? 'cuts-hero--visible' : ''}`}>
        {/* Left */}
        <div className="cuts-hero-left">
          <h1 className="cuts-hero-title">
            Simulación de<br />
            tráfico en{' '}
            <AnimatedHighlight text="tiempo real" />
          </h1>
          <p className="cuts-hero-sub">
            Una herramienta interactiva para análisis y experimentación
            del tráfico urbano mediante simulación colaborativa en tiempo real
          </p>
          <button
            id="btn-start"
            className="cuts-btn-cta"
            onClick={() => navigate('/auth')}
          >
            Empieza ya <span className="cuts-cta-arrow">›</span>
          </button>

          {/* Stats */}
          <div className="cuts-stats">
            <StatCounter end={100} label="Vehículos simulados" suffix="+" />
            <div className="cuts-stats-divider" />
            <StatCounter end={24} label="Tiempo real" suffix="/7" />
            <div className="cuts-stats-divider" />
            <StatCounter end={5} label="Usuarios simultáneos" suffix="+" />
          </div>
        </div>

        {/* Right – hero image */}
        <div className="cuts-hero-right">
          <div className="cuts-img-wrapper">
            <img src={trafficHero} alt="Tráfico urbano en tiempo real" className="cuts-hero-img" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="cuts-features">
        <FeatureCard
          color="#2258B1"
          title="Somos"
          body="Plataforma web colaborativa que simula tráfico urbano mediante un mapa simplificado con vías bidireccionales, vehículos autónomos y semáforos inteligentes."
        />
        <FeatureCard
          color="#007FBD"
          title="Valor esperado"
          body="Herramienta interactiva para análisis de tráfico urbano, demostrando cómo decisiones de control influyen en congestión y eficiencia vial."
        />
        <FeatureCard
          color="#2258B1"
          title="Tecnología"
          body="Construido con React, WebSockets y simulación en tiempo real: cada decisión se refleja al instante en todos los clientes conectados."
        />
      </section>

      {/* ── FOOTER ── */}
      <footer className="cuts-footer">
        <span>© 2026 CUTS — Collaborative Urban Traffic Simulator</span>
      </footer>
    </div>
  );
}

function FeatureCard({ title, body, color }: { title: string; body: string; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="cuts-feature-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderTop: `3px solid ${hovered ? color : 'transparent'}`, transition: 'border-color .25s' }}
    >
      <h3 style={{ color }}>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
