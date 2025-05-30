
// API Service for Notion and Chat integration
import { supabase } from '@/integrations/supabase/client';

interface NotionDatabase {
  id: string;
  name: string;
  available: boolean;
}

interface NotionPage {
  id: string;
  title: string;
  name: string;
  database_id: string;
}

interface NotionAttribute {
  id: string;
  name: string;
  type: string;
  database_id: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: string;
  thread_id?: string;
}

interface ChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

class APIService {
  
  // Notion API Methods
  async getNotionDatabases(): Promise<NotionDatabase[]> {
    try {
      console.log("Fetching Notion databases...");
      
      const { data, error } = await supabase.functions.invoke('notion-integration', {
        method: 'GET',
        body: new URLSearchParams({ action: 'databases' })
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching Notion databases:", error);
      throw error;
    }
  }

  async getNotionPages(databaseId: string): Promise<NotionPage[]> {
    try {
      console.log(`Fetching pages for database ${databaseId}...`);
      
      const { data, error } = await supabase.functions.invoke('notion-integration', {
        method: 'GET',
        body: new URLSearchParams({ 
          action: 'pages',
          database_id: databaseId 
        })
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching Notion pages:", error);
      throw error;
    }
  }

  async getNotionAttributes(databaseId: string): Promise<NotionAttribute[]> {
    try {
      console.log(`Fetching attributes for database ${databaseId}...`);
      
      const { data, error } = await supabase.functions.invoke('notion-integration', {
        method: 'GET',
        body: new URLSearchParams({ 
          action: 'attributes',
          database_id: databaseId 
        })
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching Notion attributes:", error);
      throw error;
    }
  }

  async queryNotionData(query: string, filters?: any): Promise<any[]> {
    try {
      console.log(`Querying Notion data with: ${query}`, filters);
      
      const { data, error } = await supabase.functions.invoke('notion-integration', {
        method: 'GET',
        body: new URLSearchParams({ 
          action: 'query',
          query: query,
          filters: filters ? JSON.stringify(filters) : ''
        })
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error querying Notion data:", error);
      throw error;
    }
  }

  // Chat API Methods
  async sendChatMessage(message: string, threadId?: string, notionContext?: any): Promise<ChatMessage> {
    try {
      console.log(`Sending chat message: ${message}`, threadId ? `to thread ${threadId}` : 'to new thread');
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message, 
          threadId,
          notionContext 
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      return {
        id: Date.now().toString(),
        content: data.response,
        sender: "bot",
        timestamp: new Date().toISOString(),
        thread_id: threadId,
      };
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  async getChatThreads(): Promise<ChatThread[]> {
    try {
      console.log("Fetching chat threads...");
      // This is handled by the Supabase hooks directly
      return [];
    } catch (error) {
      console.error("Error fetching chat threads:", error);
      throw error;
    }
  }

  async createChatThread(title: string): Promise<ChatThread> {
    try {
      console.log(`Creating new chat thread: ${title}`);
      // This is handled by the Supabase hooks directly
      return {
        id: Date.now().toString(),
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
      };
    } catch (error) {
      console.error("Error creating chat thread:", error);
      throw error;
    }
  }

  async getChatMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      console.log(`Fetching messages for thread ${threadId}...`);
      // This is handled by the Supabase hooks directly
      return [];
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
  }
}

export const apiService = new APIService();
export type { NotionDatabase, NotionPage, NotionAttribute, ChatMessage, ChatThread };
