
import { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatData";
import { useNotionDatabases } from "@/hooks/useNotionData";
import { apiService } from "@/services/api";
import { MessagesList } from "./chat/MessagesList";
import { ChatInput } from "./chat/ChatInput";
import { EmptyState } from "./chat/EmptyState";

export function ChatArea() {
  const [isLoading, setIsLoading] = useState(false);
  const { currentThreadId } = useChatContext();
  const { messages, sendMessage } = useSupabaseChatMessages(currentThreadId);
  const { databases } = useNotionDatabases();

  const handleSendMessage = async (messageContent: string) => {
    if (!currentThreadId) return;

    setIsLoading(true);

    try {
      // Send user message
      await sendMessage(messageContent, 'user');

      // Prepare Notion context for AI
      const notionContext = databases.length > 0 ? {
        availableDatabases: databases,
        message: `User has access to ${databases.length} Notion database(s): ${databases.map(db => db.name).join(', ')}`
      } : null;

      console.log('Sending message with Notion context:', notionContext);

      // Get AI response using the real API service
      const aiResponse = await apiService.sendChatMessage(
        messageContent, 
        currentThreadId,
        notionContext
      );

      console.log('AI response received:', aiResponse);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Send fallback message
      await sendMessage(
        "Przepraszam, wystąpił błąd podczas przetwarzania Twojego zapytania. Spróbuj ponownie.", 
        'bot'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentThreadId) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50">
      <MessagesList messages={messages} isLoading={isLoading} />
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        disabled={!currentThreadId}
      />
    </div>
  );
}
