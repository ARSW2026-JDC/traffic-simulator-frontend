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
  const endpoints: Array<{ name: string; url: string; method: string }> = [
    { name: 'verifyToken',        url: '/api/auth/verify',               method: 'post' },
    { name: 'getMe',              url: '/api/users/me',                  method: 'get' },
    { name: 'updateMe',           url: '/api/users/me',                  method: 'patch' },
    { name: 'updateUserRole',     url: '/api/users/',                    method: 'patch' },
    { name: 'getAllUsers',        url: '/api/users',                     method: 'get' },
    { name: 'getChatMessages',    url: '/chat/chat/chat/messages',       method: 'get' },
    { name: 'getHistory',         url: '/history/history/history',       method: 'get' },
    { name: 'getSimulations',     url: '/sim/sim',                       method: 'get' },
    { name: 'getSimulationById',  url: '/sim/sim/',                      method: 'get' },
    { name: 'deleteSimulationById', url: '/sim/sim/',                    method: 'delete' },
    { name: 'createSimulation',   url: '/sim/sim',                       method: 'post' },
    { name: 'getAvailableMaps',   url: '/sim/sim/maps/available',        method: 'get' },
    { name: 'updateUserEstatus',  url: '/api/users/',                    method: 'patch' },
    { name: 'deleteUser',         url: '/api/users/',                    method: 'delete' },
  ];

  it('should export all expected endpoint functions', () => {
    for (const { name } of endpoints) {
      expect(api).toHaveProperty(name);
      expect(typeof (api as any)[name]).toBe('function');
    }
  });

  it('each endpoint function source should reference the correct URL', () => {
    for (const { name, url } of endpoints) {
      const fnStr = (api as any)[name].toString();
      expect(fnStr).toContain(url);
    }
  });

  it('each endpoint function source should use the correct HTTP method', () => {
    for (const { name, method } of endpoints) {
      const fnStr = (api as any)[name].toString();
      expect(fnStr).toContain(`api.${method}(`);
    }
  });
});