import { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatData";
import { useNotionDatabases, useNotionPages, useNotionAttributes } from "@/hooks/useNotionData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext"; // ✅ Dodaj import
import { apiService } from "@/services/api";
import { MessagesList } from "./chat/MessagesList";
import { ChatInput } from "./chat/ChatInput";
import { EmptyState } from "./chat/EmptyState";

export function ChatArea() {
  const [isLoading, setIsLoading] = useState(false);
  const { currentThreadId } = useChatContext();
  const { messages, sendMessage } = useSupabaseChatMessages(currentThreadId);
  const { databases } = useNotionDatabases();
  
  // ✅ Używaj wyboru użytkownika z shared context
  const { 
    selectedDatabase, 
    selectedPage, 
    selectedAttributes,
    hasSelection 
  } = useNotionSelection();
  
  // ✅ Pobierz dane z wybranej bazy
  const { pages } = useNotionPages(selectedDatabase || null);
  const { attributes } = useNotionAttributes(selectedDatabase || null);

  const handleSendMessage = async (messageContent: string) => {
    if (!currentThreadId) return;

    setIsLoading(true);
    try {
      // Send user message
      await sendMessage(messageContent, 'user');

      // ✅ Przygotuj kontekst TYLKO z wybranej bazy użytkownika
      let notionContext = null;
      
      if (hasSelection && selectedDatabase) {
        // Znajdź wybraną bazę
        const selectedDatabaseData = databases.find(db => db.id === selectedDatabase);
        
        if (selectedDatabaseData) {
          console.log('🎯 Używam wybranej bazy:', selectedDatabaseData.name);
          
          // Przygotuj dane z wybranej bazy
          let selectedDatabaseWithData = {
            id: selectedDatabaseData.id,
            name: selectedDatabaseData.name,
            description: selectedDatabaseData.description || '',
            pages: [],
            attributes: []
          };

          // ✅ Dodaj strony z wybranej bazy
          if (pages && pages.length > 0) {
            selectedDatabaseWithData.pages = selectedPage 
              ? pages.filter(page => page.id === selectedPage) // Konkretna strona
              : pages; // Wszystkie strony z bazy
          }

          // ✅ Dodaj wybrane atrybuty
          if (attributes && attributes.length > 0) {
            selectedDatabaseWithData.attributes = selectedAttributes.length > 0
              ? attributes.filter(attr => selectedAttributes.includes(attr.id)) // Wybrane atrybuty
              : attributes; // Wszystkie atrybuty
          }

          // ✅ Kontekst z wybraną bazą zamiast losowych 5
          notionContext = {
            selectedDatabase: selectedDatabaseWithData,
            selectedPage: selectedPage,
            selectedAttributes: selectedAttributes,
            message: `Użytkownik wybrał bazę "${selectedDatabaseData.name}" ${
              selectedPage ? `ze stroną` : ''
            } ${
              selectedAttributes.length > 0 ? `z atrybutami: ${selectedAttributes.length}` : ''
            }`
          };
        }
      }

      console.log('Sending message with selected Notion context:', notionContext);

      // Get AI response using the real API service
      const aiResponse = await apiService.sendChatMessage(
        messageContent, 
        currentThreadId,
        notionContext // ✅ Przekaż wybór użytkownika zamiast wszystkich baz
      );

      console.log('AI response received:', aiResponse);

      // Dodaj odpowiedź AI do chatu
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
      {/* ✅ Dodaj informację o wyborze użytkownika */}
      {hasSelection && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="text-sm text-blue-700">
            🎯 Wybrana baza: <strong>{databases.find(db => db.id === selectedDatabase)?.name}</strong>
            {selectedPage && (
              <span className="ml-2">• Strona: <strong>{pages.find(p => p.id === selectedPage)?.name}</strong></span>
            )}
            {selectedAttributes.length > 0 && (
              <span className="ml-2">• Atrybuty: <strong>{selectedAttributes.length}</strong></span>
            )}
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
