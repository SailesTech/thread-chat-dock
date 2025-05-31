
import { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatData";
import { useNotionDatabases, useNotionPages, useNotionAttributes } from "@/hooks/useNotionData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";
import { apiService } from "@/services/api";
import { MessagesList } from "./chat/MessagesList";
import { ChatInput } from "./chat/ChatInput";
import { EmptyState } from "./chat/EmptyState";

export function ChatArea() {
  const [isLoading, setIsLoading] = useState(false);
  const { currentThreadId } = useChatContext();
  const { messages, sendMessage } = useSupabaseChatMessages(currentThreadId);
  const { databases } = useNotionDatabases();
  
  const { 
    selectedDatabase, 
    selectedPage, 
    selectedAttributes,
    selectedAttributeValues,
    hasSelection,
    getThreadTitle
  } = useNotionSelection();
  
  const { pages } = useNotionPages(selectedDatabase || null);
  const { attributes } = useNotionAttributes(selectedDatabase || null);

  const handleSendMessage = async (messageContent: string) => {
    if (!currentThreadId) return;

    setIsLoading(true);
    try {
      // Send user message
      await sendMessage(messageContent, 'user');

      // Przygotuj kontekst z wybranymi elementami użytkownika
      let notionContext = null;
      
      if (hasSelection && selectedDatabase) {
        const selectedDatabaseData = databases.find(db => db.id === selectedDatabase);
        
        if (selectedDatabaseData) {
          console.log('🎯 Używam wybranej bazy:', selectedDatabaseData.name);
          
          let selectedDatabaseWithData = {
            id: selectedDatabaseData.id,
            name: selectedDatabaseData.name,
            description: selectedDatabaseData.description || '',
            pages: [],
            attributes: [],
            selectedAttributeValues: selectedAttributeValues
          };

          // Dodaj strony z wybranej bazy
          if (pages && pages.length > 0) {
            selectedDatabaseWithData.pages = selectedPage 
              ? pages.filter(page => page.id === selectedPage)
              : pages;
          }

          // Dodaj wybrane atrybuty
          if (attributes && attributes.length > 0) {
            selectedDatabaseWithData.attributes = selectedAttributes.length > 0
              ? attributes.filter(attr => selectedAttributes.includes(attr.id))
              : attributes;
          }

          notionContext = {
            selectedDatabase: selectedDatabaseWithData,
            selectedPage: selectedPage,
            selectedAttributes: selectedAttributes,
            selectedAttributeValues: selectedAttributeValues,
            message: `Użytkownik wybrał: ${getThreadTitle()}`
          };
        }
      }

      console.log('Sending message with Notion context:', notionContext);

      const aiResponse = await apiService.sendChatMessage(
        messageContent, 
        currentThreadId,
        notionContext
      );

      console.log('AI response received:', aiResponse);

      if (aiResponse && aiResponse.response) {
        await sendMessage(aiResponse.response, 'bot');
      } else if (aiResponse && aiResponse.content) {
        await sendMessage(aiResponse.content, 'bot');
      } else if (aiResponse && aiResponse.output) {
        await sendMessage(aiResponse.output, 'bot');
      } else {
        throw new Error('No valid response from AI');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
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
      {/* Informacja o wyborze użytkownika */}
      {hasSelection && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="text-sm text-blue-700">
            🎯 Wybrane: <strong>{getThreadTitle()}</strong>
          </div>
        </div>
      )}
      
      <MessagesList messages={messages} isLoading={isLoading} />
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        disabled={!currentThreadId}
      />
    </div>
  );
}
