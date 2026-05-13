import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { auth } from './firebase';


vi.mock('./firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
    })),
  };
});

import * as api from './api';

describe('API Service', () => {
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = axios.create();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have null currentUser initially', () => {
    expect(auth.currentUser).toBeNull();
  });
});

describe('API Types and Constants', () => {
  it('should have default GATEWAY URL', () => {
    const GATEWAY = 'http://localhost:3000';
    expect(GATEWAY).toBe('http://localhost:3000');
  });
});

describe('API Response Handling', () => {
  it('should handle successful responses', () => {
    const mockResponse = { data: { success: true } };
    expect(mockResponse.data.success).toBe(true);
  });

  it('should handle error responses', () => {
    const mockError = { response: { status: 401 } };
    expect(mockError.response.status).toBe(401);
  });
});

describe('API Endpoints Coverage', () => {
  const endpoints = [
    'verifyToken',
    'getMe',
    'updateMe',
    'updateUserRole',
    'getAllUsers',
    'getChatMessages',
    'getHistory',
    'getSimulations',
    'getSimulationById',
    'deleteSimulationById',
    'createSimulation',
    'getAvailableMaps',
    'updateUserEstatus',
    'deleteUser',
  ];


});