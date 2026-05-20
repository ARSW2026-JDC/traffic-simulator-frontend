import { describe, it, expect } from 'vitest';
import { getLightLabel } from './TrafficLightMarker';
import { getStatusLabel } from './VehicleMarker';

describe('getLightLabel', () => {
  it('returns "Verde" for green', () => {
    expect(getLightLabel('green')).toBe('Verde');
  });

  it('returns "Amarillo" for yellow', () => {
    expect(getLightLabel('yellow')).toBe('Amarillo');
  });

  it('returns "Rojo" for red', () => {
    expect(getLightLabel('red')).toBe('Rojo');
  });

  it('returns "Rojo" for unknown state', () => {
    expect(getLightLabel('unknown')).toBe('Rojo');
  });
});

describe('getStatusLabel', () => {
  it('returns "En movimiento" for moving', () => {
    expect(getStatusLabel('moving')).toBe('En movimiento');
  });

  it('returns "Esperando" for waiting', () => {
    expect(getStatusLabel('waiting')).toBe('Esperando');
  });

  it('returns "Detenido" for stopped', () => {
    expect(getStatusLabel('stopped')).toBe('Detenido');
  });

  it('returns "Detenido" for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('Detenido');
  });
});
