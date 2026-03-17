import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { getChatMessages } from '../services/api';
import type { ChatMessage } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useChatSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const { addMessage, setMessages, setConnected } = useChatStore();

  useEffect(() => {
    getChatMessages(50)
      .then(setMessages)
      .catch(() => {});

    const socket = io(`${GATEWAY}/chat`, {
      path: '/nrt/socket.io',
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('message:new', (msg: ChatMessage) => addMessage(msg));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
}
