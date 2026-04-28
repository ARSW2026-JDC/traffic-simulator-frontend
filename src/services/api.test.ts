import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// ── Mock axios ────────────────────────────────────────────────────────────────
vi.mock('axios', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockApi),
    },
    __mockApi: mockApi,
  };
});

vi.mock('./firebase', () => ({
  auth: { currentUser: null },
}));

// Grab the mocked api instance
const getMockApi = async () => {
  const mod = await import('axios');
  return (mod as any).__mockApi;
};

// Fresh import of api module
const getApi = () => import('./api?t=' + Date.now());

describe('API Service – function exports', () => {
  it('should export verifyToken as function', async () => {
    const { verifyToken } = await import('./api');
    expect(typeof verifyToken).toBe('function');
  });
  it('should export getMe as function', async () => {
    const { getMe } = await import('./api');
    expect(typeof getMe).toBe('function');
  });
  it('should export updateMe as function', async () => {
    const { updateMe } = await import('./api');
    expect(typeof updateMe).toBe('function');
  });
  it('should export updateUserRole as function', async () => {
    const { updateUserRole } = await import('./api');
    expect(typeof updateUserRole).toBe('function');
  });
  it('should export getAllUsers as function', async () => {
    const { getAllUsers } = await import('./api');
    expect(typeof getAllUsers).toBe('function');
  });
  it('should export getChatMessages as function', async () => {
    const { getChatMessages } = await import('./api');
    expect(typeof getChatMessages).toBe('function');
  });
  it('should export getHistory as function', async () => {
    const { getHistory } = await import('./api');
    expect(typeof getHistory).toBe('function');
  });
  it('should export getSimulations as function', async () => {
    const { getSimulations } = await import('./api');
    expect(typeof getSimulations).toBe('function');
  });
  it('should export getSimulationById as function', async () => {
    const { getSimulationById } = await import('./api');
    expect(typeof getSimulationById).toBe('function');
  });
  it('should export deleteSimulationById as function', async () => {
    const { deleteSimulationById } = await import('./api');
    expect(typeof deleteSimulationById).toBe('function');
  });
  it('should export createSimulation as function', async () => {
    const { createSimulation } = await import('./api');
    expect(typeof createSimulation).toBe('function');
  });
  it('should export getAvailableMaps as function', async () => {
    const { getAvailableMaps } = await import('./api');
    expect(typeof getAvailableMaps).toBe('function');
  });
  it('should export default api instance', async () => {
    const { default: api } = await import('./api');
    expect(api).toBeDefined();
  });
});

describe('API Service – HTTP calls', () => {
  let mockApi: any;

  beforeEach(async () => {
    mockApi = await getMockApi();
    vi.clearAllMocks();
  });

  it('verifyToken should POST to /api/auth/verify with Bearer header', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { ok: true } });
    const { verifyToken } = await import('./api');
    const result = await verifyToken('my-token');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/auth/verify',
      null,
      expect.objectContaining({ headers: { Authorization: 'Bearer my-token' } }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('getMe should GET /api/users/me', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { id: 'u1' } });
    const { getMe } = await import('./api');
    const result = await getMe();
    expect(mockApi.get).toHaveBeenCalledWith('/api/users/me');
    expect(result).toEqual({ id: 'u1' });
  });

  it('updateMe should PATCH /api/users/me', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: { name: 'Bob' } });
    const { updateMe } = await import('./api');
    const result = await updateMe({ name: 'Bob' });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/users/me', { name: 'Bob' });
    expect(result).toEqual({ name: 'Bob' });
  });

  it('updateUserRole should PATCH /api/users/:id/role', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: { role: 'ADMIN' } });
    const { updateUserRole } = await import('./api');
    const result = await updateUserRole('u1', 'ADMIN');
    expect(mockApi.patch).toHaveBeenCalledWith('/api/users/u1/role', { role: 'ADMIN' });
    expect(result).toEqual({ role: 'ADMIN' });
  });

  it('getAllUsers should GET /api/users', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 'u1' }] });
    const { getAllUsers } = await import('./api');
    const result = await getAllUsers();
    expect(mockApi.get).toHaveBeenCalledWith('/api/users');
    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('getChatMessages should GET /api/chat/messages with limit param', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getChatMessages } = await import('./api');
    await getChatMessages(100);
    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/chat/messages',
      expect.objectContaining({ params: expect.objectContaining({ limit: '100' }) }),
    );
  });

  it('getChatMessages should include cursor param when provided', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getChatMessages } = await import('./api');
    await getChatMessages(50, 'cursor-abc');
    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/chat/messages',
      expect.objectContaining({ params: expect.objectContaining({ cursor: 'cursor-abc' }) }),
    );
  });

  it('getHistory should GET /api/history with limit and optional simId', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getHistory } = await import('./api');
    await getHistory(50, undefined, 'sim-1');
    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/history',
      expect.objectContaining({ params: expect.objectContaining({ simId: 'sim-1', limit: '50' }) }),
    );
  });

  it('getHistory should not include cursor when not provided', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getHistory } = await import('./api');
    await getHistory(50);
    const callParams = mockApi.get.mock.calls[0][1].params;
    expect(callParams.cursor).toBeUndefined();
  });

  it('getSimulations should GET /sim/sim', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getSimulations } = await import('./api');
    await getSimulations();
    expect(mockApi.get).toHaveBeenCalledWith('/sim/sim');
  });

  it('getSimulationById should GET /sim/sim/:id', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { simId: 's1' } });
    const { getSimulationById } = await import('./api');
    const result = await getSimulationById('s1');
    expect(mockApi.get).toHaveBeenCalledWith('/sim/sim/s1');
    expect(result).toEqual({ simId: 's1' });
  });

  it('deleteSimulationById should DELETE /sim/sim/:id', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: { deleted: true } });
    const { deleteSimulationById } = await import('./api');
    const result = await deleteSimulationById('s1');
    expect(mockApi.delete).toHaveBeenCalledWith('/sim/sim/s1');
    expect(result).toEqual({ deleted: true });
  });

  it('createSimulation should POST /sim/sim with payload', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { simId: 'new-sim' } });
    const { createSimulation } = await import('./api');
    const payload = { mapId: 'map1', nVehicles: 10 };
    const result = await createSimulation(payload);
    expect(mockApi.post).toHaveBeenCalledWith('/sim/sim', payload);
    expect(result).toEqual({ simId: 'new-sim' });
  });

  it('createSimulation should support driverMix payload', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { simId: 'new-sim-2' } });
    const { createSimulation } = await import('./api');
    const payload = {
      mapId: 'map2',
      nVehicles: 20,
      driverMix: { aggressive: 10, normal: 5, cautious: 3, truck: 1, bus: 1 },
    };
    await createSimulation(payload);
    expect(mockApi.post).toHaveBeenCalledWith('/sim/sim', payload);
  });

  it('getAvailableMaps should GET /sim/sim/maps/available', async () => {
    mockApi.get.mockResolvedValueOnce({ data: ['map1', 'map2'] });
    const { getAvailableMaps } = await import('./api');
    const result = await getAvailableMaps();
    expect(mockApi.get).toHaveBeenCalledWith('/sim/sim/maps/available');
    expect(result).toEqual(['map1', 'map2']);
  });
});