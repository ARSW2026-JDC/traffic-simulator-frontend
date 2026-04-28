import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';
import type { ChatMessage } from '../types';

const makeMsg = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg-1',
  userId: 'user-1',
  userName: 'Alice',
  content: 'Hello',
  timestamp: 1000,
  ...overrides,
});

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isConnected: false });
  });

  it('should have correct initial state', () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.isConnected).toBe(false);
  });

  it('setConnected should update isConnected', () => {
    useChatStore.getState().setConnected(true);
    expect(useChatStore.getState().isConnected).toBe(true);
    useChatStore.getState().setConnected(false);
    expect(useChatStore.getState().isConnected).toBe(false);
  });

  it('setMessages should replace messages array', () => {
    const msgs = [makeMsg({ id: 'a' }), makeMsg({ id: 'b' })];
    useChatStore.getState().setMessages(msgs);
    expect(useChatStore.getState().messages).toEqual(msgs);
  });

  it('addMessage should add a new message', () => {
    const msg = makeMsg();
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0]).toEqual(msg);
  });

  it('addMessage should not add duplicate (same id)', () => {
    const msg = makeMsg();
    useChatStore.getState().addMessage(msg);
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('addMessage should cap at 200 messages', () => {
    const many = Array.from({ length: 205 }, (_, i) =>
      makeMsg({ id: `msg-${i}`, timestamp: i }),
    );
    many.forEach((m) => useChatStore.getState().addMessage(m));
    // keeps last 200
    expect(useChatStore.getState().messages.length).toBeLessThanOrEqual(200);
  });

  it('addOptimisticMessage should add without dedup check', () => {
    const msg = makeMsg({ clientId: 'cli-1', status: 'pending' });
    useChatStore.getState().addOptimisticMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('confirmMessage should replace optimistic message with server msg', () => {
    const optimistic = makeMsg({ id: 'tmp', clientId: 'cli-1', status: 'pending' });
    useChatStore.getState().addOptimisticMessage(optimistic);

    const serverMsg = makeMsg({ id: 'server-id', clientId: 'cli-1' });
    useChatStore.getState().confirmMessage('cli-1', serverMsg);

    const msgs = useChatStore.getState().messages;
    expect(msgs[0].id).toBe('server-id');
    expect(msgs[0].status).toBe('sent');
    expect(msgs[0].clientId).toBe('cli-1');
  });

  it('confirmMessage should not change messages when clientId not found', () => {
    const msg = makeMsg();
    useChatStore.getState().addOptimisticMessage(msg);
    useChatStore.getState().confirmMessage('nonexistent', makeMsg({ id: 'other' }));
    expect(useChatStore.getState().messages[0].id).toBe('msg-1');
  });

  it('failMessage should mark message as failed', () => {
    const msg = makeMsg({ clientId: 'cli-1', status: 'pending' });
    useChatStore.getState().addOptimisticMessage(msg);
    useChatStore.getState().failMessage('cli-1');
    expect(useChatStore.getState().messages[0].status).toBe('failed');
  });

  it('failMessage should not affect other messages', () => {
    const msg1 = makeMsg({ id: 'a', clientId: 'cli-a', status: 'pending' });
    const msg2 = makeMsg({ id: 'b', clientId: 'cli-b', status: 'pending' });
    useChatStore.getState().addOptimisticMessage(msg1);
    useChatStore.getState().addOptimisticMessage(msg2);
    useChatStore.getState().failMessage('cli-a');
    const state = useChatStore.getState();
    expect(state.messages.find((m) => m.clientId === 'cli-a')?.status).toBe('failed');
    expect(state.messages.find((m) => m.clientId === 'cli-b')?.status).toBe('pending');
  });

  it('mergeHistory should merge server messages with pending/failed local ones', () => {
    const local1 = makeMsg({ id: 'pending-1', clientId: 'c1', status: 'pending', timestamp: 500 });
    const local2 = makeMsg({ id: 'server-2', clientId: 'c2', status: 'sent', timestamp: 600 });
    useChatStore.setState({ messages: [local1, local2] });

    const serverMsgs = [
      makeMsg({ id: 'server-1', timestamp: 100 }),
      makeMsg({ id: 'server-2', timestamp: 600 }),
    ];
    useChatStore.getState().mergeHistory(serverMsgs);

    const msgs = useChatStore.getState().messages;
    // server-1 and server-2 come from server; pending-1 is kept (pending & not in server)
    // local2 (status: sent) is dropped since server already has server-2
    const ids = msgs.map((m) => m.id);
    expect(ids).toContain('server-1');
    expect(ids).toContain('server-2');
    expect(ids).toContain('pending-1');
  });

  it('mergeHistory should sort messages by timestamp', () => {
    const serverMsgs = [
      makeMsg({ id: 'b', timestamp: 200 }),
      makeMsg({ id: 'a', timestamp: 100 }),
    ];
    useChatStore.getState().mergeHistory(serverMsgs);
    const msgs = useChatStore.getState().messages;
    expect(msgs[0].id).toBe('a');
    expect(msgs[1].id).toBe('b');
  });

  it('mergeHistory should cap at 200 messages', () => {
    const serverMsgs = Array.from({ length: 250 }, (_, i) =>
      makeMsg({ id: `s-${i}`, timestamp: i }),
    );
    useChatStore.getState().mergeHistory(serverMsgs);
    expect(useChatStore.getState().messages.length).toBeLessThanOrEqual(200);
  });
});
