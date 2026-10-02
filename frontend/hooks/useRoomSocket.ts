'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { useConnectionStore } from '@/store/connectionStore';
import { useToast } from '@/components/ui/Toast';
import { getSocket } from '@/lib/socket';
import { SocketEvents } from '@/lib/socketEvents';
import { DebateMode, Room, RoomVisibility } from '@/types';

interface ErrorPayload {
  message: string;
}

export interface UpdateRoomSettingsInput {
  maxPlayers?: number;
  debateMode?: DebateMode;
  visibility?: RoomVisibility;
}

// Joins the given room over the socket, keeps useRoomStore in sync with
// every membership/presence/chat event, and re-joins automatically on
// reconnect. Safe to call from both the Lobby and Game screens — a second
// `room:join` for the same code is idempotent server-side.
export function useRoomSocket(code: string | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setChat = useRoomStore((s) => s.setChat);
  const updatePlayer = useRoomStore((s) => s.updatePlayer);
  const addChatMessage = useRoomStore((s) => s.addChatMessage);
  const clearRoom = useRoomStore((s) => s.clear);
  const setStatus = useConnectionStore((s) => s.setStatus);
  const router = useRouter();
  const { show } = useToast();
  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => {
    if (!accessToken || !code) return;
    const socket = getSocket(accessToken);

    const join = () => {
      if (!codeRef.current) return;
      socket.emit(SocketEvents.ROOM_JOIN, { code: codeRef.current });
    };

    const onConnect = () => {
      setStatus('connected');
      join();
    };
    const onDisconnect = () => setStatus('reconnecting');
    const onReconnectAttempt = () => setStatus('reconnecting');
    const onConnectError = (err: Error) => {
      setStatus('disconnected');
      console.error('socket connect error:', err.message);
    };
    const onStateSync = (room: Room) => {
      setRoom(room);
      // Ask the game gateway for a point-in-time match snapshot after every
      // room join/reconnect. It is harmless in the lobby and lets a player
      // rebuild an active game after a browser refresh.
      socket.emit(SocketEvents.GAME_STATE_SYNC_REQUEST);
    };
    const onChatHistory = (
      entries: { id: string; userId: string; username: string; content: string }[],
    ) => setChat(entries);
    const onReadyChanged = ({ userId, isReady }: { userId: string; isReady: boolean }) =>
      updatePlayer(userId, { isReady });
    const onPresenceOnline = ({ userId }: { userId: string }) => updatePlayer(userId, { isOnline: true });
    const onPresenceOffline = ({ userId }: { userId: string }) => updatePlayer(userId, { isOnline: false });
    const onChatMessage = (entry: { id: string; userId: string; username: string; content: string }) =>
      addChatMessage(entry);
    const onError = (err: ErrorPayload) => console.error('socket error:', err.message);
    const onKicked = () => {
      clearRoom();
      show('تم إخراجك من الغرفة بواسطة المضيف');
      router.replace('/games/otherhalf');
    };
    const onRoomClosed = () => {
      clearRoom();
      show('تم إغلاق الغرفة');
      router.replace('/games/otherhalf');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on(SocketEvents.ROOM_STATE_SYNC, onStateSync);
    socket.on(SocketEvents.LOBBY_CHAT_HISTORY, onChatHistory);
    socket.on(SocketEvents.LOBBY_PLAYER_READY_CHANGED, onReadyChanged);
    socket.on(SocketEvents.PRESENCE_ONLINE, onPresenceOnline);
    socket.on(SocketEvents.PRESENCE_OFFLINE, onPresenceOffline);
    socket.on(SocketEvents.LOBBY_CHAT_MESSAGE, onChatMessage);
    socket.on(SocketEvents.LOBBY_KICKED, onKicked);
    socket.on(SocketEvents.ROOM_CLOSED, onRoomClosed);
    socket.on(SocketEvents.ERROR, onError);

    if (socket.connected) {
      setStatus('connected');
      join();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off(SocketEvents.ROOM_STATE_SYNC, onStateSync);
      socket.off(SocketEvents.LOBBY_CHAT_HISTORY, onChatHistory);
      socket.off(SocketEvents.LOBBY_PLAYER_READY_CHANGED, onReadyChanged);
      socket.off(SocketEvents.PRESENCE_ONLINE, onPresenceOnline);
      socket.off(SocketEvents.PRESENCE_OFFLINE, onPresenceOffline);
      socket.off(SocketEvents.LOBBY_CHAT_MESSAGE, onChatMessage);
      socket.off(SocketEvents.LOBBY_KICKED, onKicked);
      socket.off(SocketEvents.ROOM_CLOSED, onRoomClosed);
      socket.off(SocketEvents.ERROR, onError);
    };
  }, [accessToken, code, setRoom, setChat, updatePlayer, addChatMessage, clearRoom, setStatus, router, show]);

  return {
    toggleReady(isReady: boolean) {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      if (!socket.connected) return;
      socket.emit(SocketEvents.LOBBY_READY_TOGGLE, { isReady });
    },
    sendChat(content: string) {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      if (!socket.connected) return;
      socket.emit(SocketEvents.LOBBY_CHAT_MESSAGE, { content });
    },
    startMatch() {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      if (!socket.connected) return;
      socket.emit(SocketEvents.LOBBY_START_MATCH);
    },
    leaveRoom() {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      if (!socket.connected) return;
      socket.emit(SocketEvents.ROOM_LEAVE);
    },
    // Host-only — the backend re-validates this regardless, but the button
    // that calls this should only ever render for the host.
    kickPlayer(userId: string) {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      if (!socket.connected) return;
      socket.emit(SocketEvents.LOBBY_KICK_PLAYER, { userId });
    },
    updateSettings(patch: UpdateRoomSettingsInput) {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      if (!socket.connected) return;
      socket.emit(SocketEvents.LOBBY_UPDATE_SETTINGS, patch);
    },
  };
}
