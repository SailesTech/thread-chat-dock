
import { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatData";
import { apiService } from "@/services/api";
import { MessagesList } from "./chat/MessagesList";
import { ChatInput } from "./chat/ChatInput";
import { EmptyState } from "./chat/EmptyState";

export function ChatArea() {
  const [isLoading, setIsLoading] = useState(false);
  const { currentThreadId } = useChatContext();
  const { messages, sendMessage } = useSupabaseChatMessages(currentThreadId);

  const handleSendMessage = async (messageContent: string) => {
    if (!currentThreadId) return;

    setIsLoading(true);

    try {
      // Send user message
      await sendMessage(messageContent, 'user');

      // Get AI response using the real API service
      const aiResponse = await apiService.sendChatMessage(
        messageContent, 
        currentThreadId,
        null // TODO: Add Notion context based on selected database/attributes
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
