import axios from 'axios';
import { auth } from './firebase';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: GATEWAY });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function verifyToken(token: string) {
  const res = await api.post('/api/auth/verify', null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/api/users/me');
  return res.data;
}

export async function updateMe(data: { name?: string }) {
  const res = await api.patch('/api/users/me', data);
  return res.data;
}

export async function updateUserRole(id: string, role: string) {
  const res = await api.patch(`/api/users/${id}/role`, { role });
  return res.data;
}

export async function getAllUsers() {
  const res = await api.get('/api/users');
  return res.data;
}

export async function getChatMessages(limit = 50, cursor?: string) {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get('/api/chat/messages', { params });
  return res.data;
}

export async function getHistory(limit = 50, cursor?: string, simId?: string) {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  if (simId) params.simId = simId;
  const res = await api.get('/api/history', { params });
  return res.data;
}

export async function getSimulations() {
  const res = await api.get('/sim');
  return res.data;
}

export async function getSimulationById(simId: string) {
  const res = await api.get(`/sim/${simId}`);
  return res.data;
}

export async function deleteSimulationById(simId: string) {
  const res = await api.delete(`/sim/${simId}`);
  return res.data;
}

export async function createSimulation(payload: {
  mapId: string;
  nVehicles: number;
  driverMix?: {
    aggressive: number;
    normal: number;
    cautious: number;
    truck: number;
    bus: number;
  };
}) {
  const res = await api.post('/sim', payload);
  return res.data;
}

export async function getAvailableMaps() {
  const res = await api.get('/sim/maps/available');
  return res.data;
}

export default api;
