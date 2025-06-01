
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
    if (!currentThreadId) {
      console.error('No current thread ID available');
      return;
    }

    console.log('🚀 Starting message send process...');
    setIsLoading(true);
    
    try {
      // Send user message first
      console.log('📤 Sending user message:', messageContent);
      await sendMessage(messageContent, 'user');

      // Prepare context with user's selected elements
      let notionContext = null;
      
      if (hasSelection && selectedDatabase) {
        const selectedDatabaseData = databases.find(db => db.id === selectedDatabase);
        
        if (selectedDatabaseData) {
          console.log('🎯 Using selected database:', selectedDatabaseData.name);
          
          let selectedDatabaseWithData = {
            id: selectedDatabaseData.id,
            name: selectedDatabaseData.name,
            pages: [],
            attributes: [],
            selectedAttributeValues: selectedAttributeValues
          };

          // Add pages from selected database
          if (pages && pages.length > 0) {
            selectedDatabaseWithData.pages = selectedPage 
              ? pages.filter(page => page.id === selectedPage)
              : pages;
          }

          // Add selected attributes
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
            message: `User selected: ${getThreadTitle()}`
          };
        }
      }

      console.log('🔄 Sending message to AI with context:', notionContext);

      // Call AI service with improved error handling
      const aiResponse = await apiService.sendChatMessage(
        messageContent, 
        currentThreadId,
        notionContext
      );

      console.log('✅ AI response received:', aiResponse);

      // Validate response structure more thoroughly
      if (!aiResponse) {
        throw new Error('No response received from AI service');
      }

      if (!aiResponse.content || typeof aiResponse.content !== 'string') {
        console.error('❌ Invalid AI response structure:', aiResponse);
        throw new Error('Invalid response format from AI service');
      }

      if (aiResponse.content.trim() === '') {
        throw new Error('Empty response from AI service');
      }

      console.log('📥 Saving AI response to database:', aiResponse.content);
      await sendMessage(aiResponse.content, 'bot');
      console.log('✅ AI response saved successfully');

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // More specific error messages based on error type
      let errorMessage = "Przepraszam, wystąpił błąd podczas przetwarzania Twojego zapytania.";
      
      if (error instanceof Error) {
        console.error('Detailed error:', error.message);
        
        if (error.message.includes('Edge function failed')) {
          errorMessage = "Błąd połączenia z usługą AI. Spróbuj ponownie za chwilę.";
        } else if (error.message.includes('No content') || error.message.includes('Empty response')) {
          errorMessage = "AI nie zwróciło odpowiedzi. Spróbuj ponownie lub przeformułuj pytanie.";
        } else if (error.message.includes('Invalid response')) {
          errorMessage = "Otrzymano nieprawidłową odpowiedź z AI. Spróbuj ponownie.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Błąd połączenia sieciowego. Sprawdź połączenie i spróbuj ponownie.";
        }
      }
      
      try {
        await sendMessage(errorMessage, 'bot');
      } catch (dbError) {
        console.error('Failed to save error message to database:', dbError);
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 Message send process completed');
    }
  };

  if (!currentThreadId) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50">
      {/* Sticky pasek z informacją o wyborze użytkownika */}
      {hasSelection && (
        <div className="sticky top-0 z-10 px-4 py-2 bg-blue-50 border-b border-blue-200 shadow-sm">
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
