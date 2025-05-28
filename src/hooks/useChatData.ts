
import { useState, useEffect } from 'react';
import { apiService, ChatThread, ChatMessage } from '@/services/api';

export function useChatThreads() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const data = await apiService.getChatThreads();
      setThreads(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch threads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const createThread = async (title: string) => {
    try {
      const newThread = await apiService.createChatThread(title);
      setThreads(prev => [newThread, ...prev]);
      return newThread;
    } catch (err) {
      setError('Failed to create thread');
      console.error(err);
      throw err;
    }
  };

  return { threads, loading, error, refetch: fetchThreads, createThread };
}

export function useChatMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await apiService.getChatMessages(threadId);
        setMessages(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch messages');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [threadId]);

  const sendMessage = async (content: string) => {
    try {
      const newMessage = await apiService.sendChatMessage(content, threadId || undefined);
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      throw err;
    }
  };

  return { messages, loading, error, sendMessage };
}
