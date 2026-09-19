import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './constants';

let socket: Socket | null = null;
let socketToken: string | null = null;

// One shared socket per browser tab, reused across every screen (Lobby ->
// Game) so the server-side room membership (client.data.roomId) persists
// across client-side route changes and only ever resets on a real
// disconnect/reconnect or explicit logout.
export function getSocket(accessToken: string): Socket {
  if (socket && socketToken === accessToken) return socket;
  if (socket) socket.disconnect();
  socketToken = accessToken;
  const isProxiedSocket = SOCKET_URL.startsWith('/');
  socket = io(isProxiedSocket ? window.location.origin : SOCKET_URL, {
    auth: { token: accessToken },
    ...(isProxiedSocket
      ? { path: `${SOCKET_URL.replace(/\/$/, '')}/socket.io` }
      : {}),
    transports: ['polling'],
    upgrade: false,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
