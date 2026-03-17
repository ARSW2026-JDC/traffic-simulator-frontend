import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatStore {
  messages: ChatMessage[];
  isConnected: boolean;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setConnected: (v: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isConnected: false,
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-199), msg],
    })),
  setMessages: (messages) => set({ messages }),
  setConnected: (isConnected) => set({ isConnected }),
}));
