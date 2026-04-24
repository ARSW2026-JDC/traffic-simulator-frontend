import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('axios');
const mockedAxios = axios as ReturnType<typeof vi.fn>;

describe('API Service', () => {
  let api: typeof import('../services/api');

  beforeEach(async () => {
    vi.clearAllMocks();
    mockedAxios.create = vi.fn().mockReturnValue({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
    });
    api = await import('../services/api');
  });

  it('should be defined', () => {
    expect(api).toBeDefined();
  });

  it('should export default api', async () => {
    const { default: api } = await import('../services/api');
    expect(api).toBeDefined();
    expect(api.get).toBeDefined();
  });
});