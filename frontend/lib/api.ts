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

  createRoom: (
    token: string,
    body: { maxPlayers: number; debateMode: string; visibility: string },
  ) => request<Room>('/rooms', { method: 'POST', body: JSON.stringify(body) }, token),

  joinRoom: (token: string, code: string) =>
    request<Room>('/rooms/join', { method: 'POST', body: JSON.stringify({ code }) }, token),

  getRoom: (token: string, code: string) => request<Room>(`/rooms/${code}`, {}, token),

  listPublicRooms: (token: string) => request<PublicRoomSummary[]>('/rooms/public', {}, token),
};

export { ApiError };
