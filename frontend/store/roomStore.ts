import { create } from 'zustand';
import { Room, RoomPlayer } from '@/types';

interface ChatEntry {
  id: string;
  userId: string;
  username: string;
  content: string;
}

interface RoomState {
  room: Room | null;
  chat: ChatEntry[];
  setRoom: (room: Room) => void;
  updatePlayer: (userId: string, patch: Partial<RoomPlayer>) => void;
  addChatMessage: (entry: ChatEntry) => void;
  clear: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  chat: [],

  setRoom: (room) =>
    set({
      room: {
        ...room,
        players: [...room.players].sort((a, b) => {
          if (a.role !== b.role) return a.role === 'HOST' ? -1 : 1;
          return a.user.username.localeCompare(b.user.username);
        }),
      },
    }),

  updatePlayer: (userId, patch) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          players: state.room.players.map((p) => (p.userId === userId ? { ...p, ...patch } : p)),
        },
      };
    }),

  addChatMessage: (entry) => set((state) => ({ chat: [...state.chat, entry].slice(-50) })),

  clear: () => set({ room: null, chat: [] }),
}));
