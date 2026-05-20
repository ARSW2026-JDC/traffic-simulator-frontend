import { describe, it, expect } from 'vitest';
import { statusColor, statusLabel, lightStateLabel } from './ControlPanel';

describe('statusColor', () => {
  it('returns green for moving', () => {
    expect(statusColor('moving')).toBe('bg-green-400');
  });

  it('returns yellow for waiting', () => {
    expect(statusColor('waiting')).toBe('bg-yellow-400');
  });

  it('returns red for stopped', () => {
    expect(statusColor('stopped')).toBe('bg-red-400');
  });

  it('returns red for unknown status', () => {
    expect(statusColor('unknown')).toBe('bg-red-400');
  });
});

describe('statusLabel', () => {
  it('returns En movimiento for moving', () => {
    expect(statusLabel('moving')).toBe('En movimiento');
  });

  it('returns Esperando for waiting', () => {
    expect(statusLabel('waiting')).toBe('Esperando');
  });

  it('returns Detenido for stopped', () => {
    expect(statusLabel('stopped')).toBe('Detenido');
  });

  it('returns Detenido for unknown status', () => {
    expect(statusLabel('unknown')).toBe('Detenido');
  });
});

describe('lightStateLabel', () => {
  it('returns Verde for green', () => {
    expect(lightStateLabel('green')).toBe('Verde');
  });

  it('returns Amarillo for yellow', () => {
    expect(lightStateLabel('yellow')).toBe('Amarillo');
  });

  it('returns Rojo for red', () => {
    expect(lightStateLabel('red')).toBe('Rojo');
  });

  it('returns Rojo for unknown state', () => {
    expect(lightStateLabel('unknown')).toBe('Rojo');
  });
});
