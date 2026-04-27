import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { getChatMessages } from '../services/api';
import type { ChatMessage } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useChatSocket() {
  const socketRef = useRef<Socket | null>(null);
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { token, user } = useAuthStore();
  const { addMessage, confirmMessage, setMessages, setConnected, mergeHistory } = useChatStore();

  useEffect(() => {
    if (!token || !user) return;

    getChatMessages(100)
      .then((msgs) => mergeHistory(msgs as ChatMessage[]))
      .catch(() => {});

    const socket = io(`${GATEWAY}/chat`, {
      path: '/nrt/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('message:new', (msg: ChatMessage) => {
      if (msg.clientId) {
        const timer = pendingTimers.current.get(msg.clientId);
        if (timer) {
          clearTimeout(timer);
          pendingTimers.current.delete(msg.clientId);
        }
        confirmMessage(msg.clientId, msg);
      } else {
        addMessage(msg);
      }
    });

    return () => {
      pendingTimers.current.forEach((timer) => clearTimeout(timer));
      pendingTimers.current.clear();
      socket.disconnect();
    };
  }, [token, user]);

  return { socketRef, pendingTimers };
}