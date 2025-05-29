
import { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatData";
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

      // Simulate bot response (in a real app, this would be an API call)
      setTimeout(async () => {
        try {
          await sendMessage(
            "Pracuję nad Twoim zapytaniem... (Tutaj będzie odpowiedź z API)", 
            'bot'
          );
        } catch (error) {
          console.error('Failed to send bot message:', error);
        } finally {
          setIsLoading(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to send message:', error);
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
