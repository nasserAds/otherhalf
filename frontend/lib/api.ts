import { API_URL } from './constants';
import { Avatar, PublicRoomSummary, Room, User } from '@/types';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function errorMessageFromResponseBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.filter((item) => typeof item === 'string').join(', ') || fallback;

  if (message && typeof message === 'object') {
    return errorMessageFromResponseBody(message, fallback);
  }

  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, `Cannot reach the API at ${API_URL}`);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, errorMessageFromResponseBody(body, 'request failed'));
  }
  return res.json();
}

export const api = {
  checkUsername: (username: string) =>
    request<{ available: boolean; valid: boolean }>(`/auth/username?username=${encodeURIComponent(username)}`),

  register: (username: string, avatar: Avatar) =>
    request<{ accessToken: string; deviceSecret: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, avatar }),
    }),

  login: (username: string, deviceSecret: string) =>
    request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, deviceSecret }),
    }),

  me: (token: string) => request<User>('/users/me', {}, token),

  getPlayerProfile: (token: string, username: string) => request<{
    id: string; username: string; avatar: Avatar; level: number; xp: number; wins: number; losses: number;
    winRate: number; totalDebates: number; votesReceived: number; currentWinStreak: number; longestWinStreak: number;
    profilePublic: boolean;
    matchHistory: Array<{ id: string; topic: string; result: 'WIN' | 'LOSS' | 'DRAW'; endedAt: string | null }>;
  }>(`/users/profile/${encodeURIComponent(username)}`, {}, token),

  updateProfilePrivacy: (token: string, profilePublic: boolean) =>
    request<{ profilePublic: boolean }>('/users/me/profile-privacy', {
      method: 'PATCH', body: JSON.stringify({ profilePublic }),
    }, token),

  updateUsername: (token: string, username: string) =>
    request<{ accessToken: string; user: User }>('/users/me/username', {
      method: 'PATCH',
      body: JSON.stringify({ username }),
    }, token),

  createRoom: (
    token: string,
    body: { maxPlayers: number; debateMode: string; visibility: string },
  ) => request<Room>('/rooms', { method: 'POST', body: JSON.stringify(body) }, token),

  joinRoom: (token: string, code: string) =>
    request<Room>('/rooms/join', { method: 'POST', body: JSON.stringify({ code }) }, token),

  getRoom: (token: string, code: string) => request<Room>(`/rooms/${code}`, {}, token),

  listPublicRooms: (token: string) => request<PublicRoomSummary[]>('/rooms/public', {}, token),

  deleteAdminUser: (adminKey: string, username: string) =>
    request<{ username: string }>('/admin/users', {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ username }),
    }),

  getAdminAnalytics: (adminKey: string) =>
    request<{
      traffic: { totalVisits: number; todayVisits: number; todayUniqueVisitors: number; onlineVisitors: number };
      users: number;
      totalMatches: number;
      activeGames: number;
      rooms: Array<{
        id: string;
        code: string;
        status: string;
        visibility: string;
        maxPlayers: number;
        debateMode: string;
        createdAt: string;
        host: { username: string };
        players: Array<{ userId: string }>;
      }>;
    }>('/analytics/admin', {
      headers: { 'x-admin-key': adminKey },
    }),

  adjustAdminPlayerCurrency: (
    adminKey: string,
    body: { username: string; action: 'add' | 'remove'; xp: number; coins: number },
  ) =>
    request<{ id: string; username: string; xp: number; coins: number; xpDelta: number; coinDelta: number }>(
      '/admin/users/currency',
      {
        method: 'PATCH',
        headers: { 'x-admin-key': adminKey },
        body: JSON.stringify(body),
      },
    ),

  closeAdminRoom: (adminKey: string, roomId: string) =>
    request<{ id: string; code: string }>(`/admin/rooms/${roomId}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    }),
};

export { ApiError };
