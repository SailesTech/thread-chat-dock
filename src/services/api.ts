import { createClient } from '@supabase/supabase-js';

class ApiService {
  private supabase = createClient();

  async sendChatMessage(message: string, threadId: string, notionContext?: any) {
    console.log('🔄 ApiService: Sending message to edge function...');
    console.log('📤 Message:', message);
    console.log('🔗 Thread ID:', threadId);
    console.log('📋 Notion Context:', notionContext);

    try {
      const { data, error } = await this.supabase.functions.invoke('ai-chat', {
        body: {
          message,
          threadId,
          notionContext
        }
      });

      console.log('📥 Edge function raw response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        console.error('❌ No data received from edge function');
        throw new Error('No data received from AI service');
      }

      // Fix: The edge function returns content in data.content, not data.response
      if (!data.content) {
        console.error('❌ No content in response:', data);
        throw new Error('No content in AI response');
      }

      console.log('✅ API Response processed successfully:', data.content);
      
      return {
        content: data.content,
        threadId: data.threadId || threadId
      };

    } catch (error) {
      console.error('💥 ApiService error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
