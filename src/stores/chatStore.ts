import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatStore {
  messages: ChatMessage[];
  isConnected: boolean;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setConnected: (v: boolean) => void;
  addOptimisticMessage: (msg: ChatMessage) => void;
  confirmMessage: (clientId: string, serverMsg: ChatMessage) => void;
  failMessage: (clientId: string) => void;
  mergeHistory: (serverMessages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isConnected: false,

  addMessage: (msg) =>
    set((state) => {
      if (state.messages.some((m) => m.id === msg.id)) return state;
      return {
        messages: [...state.messages.slice(-199), msg],
      };
    }),

  setMessages: (msgs) => set({ messages: msgs }),

  setConnected: (isConnected) => set({ isConnected }),

  addOptimisticMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-199), msg],
    })),

  confirmMessage: (clientId, serverMsg) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.clientId === clientId
          ? { ...serverMsg, status: 'sent' as const, clientId }
          : m,
      ),
    })),

  failMessage: (clientId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.clientId === clientId ? { ...m, status: 'failed' as const } : m,
      ),
    })),

  mergeHistory: (serverMessages) =>
    set((state) => {
      const serverIds = new Set(serverMessages.map((m) => m.id));
      const keepLocal = state.messages.filter(
        (m) => (m.status === 'pending' || m.status === 'failed') && !serverIds.has(m.id),
      );
      const merged = [...serverMessages, ...keepLocal];
      merged.sort((a, b) => a.timestamp - b.timestamp);
      return { messages: merged.slice(-200) };
    }),
}));