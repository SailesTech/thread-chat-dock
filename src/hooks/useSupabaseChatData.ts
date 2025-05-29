
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatThread, ChatMessage, ThreadWithStats } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useSupabaseChatThreads() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to fetch threads';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          title,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setThreads(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Thread created successfully",
      });
      return data;
    } catch (err) {
      const errorMessage = 'Failed to create thread';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error(err);
      throw err;
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('chat_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      
      setThreads(prev => prev.filter(t => t.id !== threadId));
      toast({
        title: "Success",
        description: "Thread deleted successfully",
      });
    } catch (err) {
      const errorMessage = 'Failed to delete thread';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error(err);
      throw err;
    }
  };

  const updateThreadTitle = async (threadId: string, title: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', threadId)
        .select()
        .single();

      if (error) throw error;
      
      setThreads(prev => prev.map(t => t.id === threadId ? data : t));
      toast({
        title: "Success",
        description: "Thread title updated successfully",
      });
      return data;
    } catch (err) {
      const errorMessage = 'Failed to update thread title';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error(err);
      throw err;
    }
  };

  return { 
    threads, 
    loading, 
    error, 
    refetch: fetchThreads, 
    createThread,
    deleteThread,
    updateThreadTitle
  };
}

export function useSupabaseChatMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Ensure sender field matches our type definition
        const typedMessages: ChatMessage[] = (data || []).map(msg => ({
          ...msg,
          sender: msg.sender as 'user' | 'bot'
        }));
        
        setMessages(typedMessages);
        setError(null);
      } catch (err) {
        const errorMessage = 'Failed to fetch messages';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            sender: payload.new.sender as 'user' | 'bot'
          } as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, toast]);

  const sendMessage = async (content: string, sender: 'user' | 'bot' = 'user') => {
    try {
      if (!threadId) throw new Error('No thread selected');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          user_id: user.id,
          content,
          sender,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Note: The message will be added automatically via real-time subscription
      return data;
    } catch (err) {
      const errorMessage = 'Failed to send message';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error(err);
      throw err;
    }
  };

  return { messages, loading, error, sendMessage };
}
