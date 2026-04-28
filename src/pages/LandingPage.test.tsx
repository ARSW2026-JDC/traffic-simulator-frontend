import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../assets/traffic_hero.png', () => ({ default: 'traffic_hero.png' }));
vi.mock('../assets/cuts_logo.png', () => ({ default: 'cuts_logo.png' }));
vi.mock('../services/firebase', () => ({ auth: { currentUser: null } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import LandingPage from './LandingPage';

const renderLanding = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the CUTS brand text in the navbar', () => {
    renderLanding();
    expect(screen.getByText(/CUTS - Collaborative Urban Traffic Simulator/)).toBeDefined();
  });

  it('should render hero title', () => {
    renderLanding();
    expect(screen.getByText(/Simulación de/i)).toBeDefined();
  });

  it('should render hero subtitle paragraph', () => {
    renderLanding();
    const matches = screen.getAllByText(/herramienta interactiva/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should render "Empieza ya" CTA button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /Empieza ya/i })).toBeDefined();
  });

  it('should navigate to /auth when "Iniciar sesión" button clicked', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('should navigate to /auth when "Registrarse" nav button clicked', () => {
    renderLanding();
    const registerBtn = screen.getAllByRole('button', { name: /Registrarse/i })[0];
    fireEvent.click(registerBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('should navigate to /auth when CTA "Empieza ya" clicked', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /Empieza ya/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('should render hero image', () => {
    renderLanding();
    expect(screen.getByAltText('Tráfico urbano en tiempo real')).toBeDefined();
  });

  it('should render footer copyright text', () => {
    renderLanding();
    expect(screen.getByText(/© 2026 CUTS/)).toBeDefined();
  });

  it('should render feature card "Somos"', () => {
    renderLanding();
    expect(screen.getByText('Somos')).toBeDefined();
  });

  it('should render feature card "Valor esperado"', () => {
    renderLanding();
    expect(screen.getByText('Valor esperado')).toBeDefined();
  });

  it('should render feature card "Tecnología"', () => {
    renderLanding();
    expect(screen.getByText('Tecnología')).toBeDefined();
  });

  it('should render stat counter "Vehículos simulados"', () => {
    renderLanding();
    expect(screen.getByText('Vehículos simulados')).toBeDefined();
  });

  it('should render stat counter "Tiempo real"', () => {
    renderLanding();
    expect(screen.getByText('Tiempo real')).toBeDefined();
  });

  it('should render stat counter "Usuarios simultáneos"', () => {
    renderLanding();
    expect(screen.getByText('Usuarios simultáneos')).toBeDefined();
  });
});