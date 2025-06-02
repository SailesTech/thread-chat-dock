
import { useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatData";
import { useNotionDatabases } from "@/hooks/useNotionData";
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
    filteringAttributeValues,
    dataAttributes,
    hasSelection,
    hasFilters,
    hasDataSelection,
    getThreadTitle,
    getFilterSummary,
    getDataAttributesSummary
  } = useNotionSelection();

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

      // Prepare context with user selections and filtered data
      let notionContext = null;
      
      if (hasSelection && selectedDatabase) {
        const selectedDatabaseData = databases.find(db => db.id === selectedDatabase);
        
        if (selectedDatabaseData) {
          console.log('🎯 Using selected database:', selectedDatabaseData.name);
          console.log('🔍 Current filters:', filteringAttributeValues);
          console.log('📊 Data attributes:', dataAttributes);
          
          let filteredData = null;
          
          // Query filtered data if filters are applied
          if (hasFilters) {
            try {
              console.log('🔍 Querying with filters:', filteringAttributeValues);
              
              // Get selected data attributes (or all if none selected)
              const selectedDataAttributes = hasDataSelection 
                ? dataAttributes.filter(attr => attr.selected).map(attr => attr.name)
                : []; // Empty array means all attributes
              
              console.log('🎯 Selected data attributes for AI:', selectedDataAttributes);
              
              const queryResult = await apiService.queryWithFilters({
                databaseId: selectedDatabase,
                filters: filteringAttributeValues,
                dataAttributes: selectedDataAttributes,
                pageSize: 50
              });
              
              filteredData = queryResult;
              console.log('✅ Filtered data received:', filteredData.pages.length, 'pages');
            } catch (error) {
              console.error('❌ Error querying filtered data:', error);
              // Continue without filtered data
            }
          }

          notionContext = {
            selectedDatabase: {
              id: selectedDatabaseData.id,
              name: selectedDatabaseData.name,
              hasFilters: hasFilters,
              hasDataSelection: hasDataSelection,
              filterSummary: getFilterSummary(),
              dataAttributesSummary: getDataAttributesSummary(),
              filteredData: filteredData
            },
            selectedPage: selectedPage,
            filters: filteringAttributeValues,
            dataAttributes: hasDataSelection 
              ? dataAttributes.filter(attr => attr.selected).map(attr => attr.name)
              : [],
            summary: {
              hasSelection: true,
              hasFilters: hasFilters,
              hasDataSelection: hasDataSelection,
              threadTitle: getThreadTitle(),
              filterDescription: hasFilters 
                ? `Filtry aktywne: ${getFilterSummary()}`
                : 'Brak filtrów - używam wszystkich danych',
              dataDescription: hasDataSelection 
                ? `Wybrane atrybuty: ${getDataAttributesSummary()}`
                : 'Wszystkie atrybuty będą uwzględnione',
              pagesCount: filteredData?.pages?.length || 0
            }
          };
        }
      }

      console.log('🔄 Sending message to AI with context:', notionContext);

      // Call AI service
      const aiResponse = await apiService.sendChatMessage(
        messageContent, 
        currentThreadId,
        notionContext
      );

      console.log('✅ AI response received:', aiResponse);

      if (aiResponse && aiResponse.content) {
        console.log('📥 Saving AI response to database:', aiResponse.content);
        await sendMessage(aiResponse.content, 'bot');
        console.log('✅ AI response saved successfully');
      } else {
        console.error('❌ Invalid AI response structure:', aiResponse);
        throw new Error('Invalid response from AI service - missing content');
      }

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      let errorMessage = "Przepraszam, wystąpił błąd podczas przetwarzania Twojego zapytania.";
      
      if (error instanceof Error) {
        if (error.message.includes('Edge function failed')) {
          errorMessage = "Błąd połączenia z usługą AI. Spróbuj ponownie za chwilę.";
        } else if (error.message.includes('No content')) {
          errorMessage = "AI nie zwróciło odpowiedzi. Spróbuj ponownie.";
        } else if (error.message.includes('Failed to query data')) {
          errorMessage = "Błąd podczas pobierania danych z Notion. Sprawdź filtry i spróbuj ponownie.";
        }
        console.error('Detailed error:', error.message);
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
      {/* Selection and filter info */}
      {hasSelection && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="text-sm text-blue-700">
            🎯 <strong>{getThreadTitle()}</strong>
            {hasFilters && (
              <div className="text-xs text-blue-600 mt-1">
                Filtry: {getFilterSummary()}
              </div>
            )}
            {hasDataSelection && (
              <div className="text-xs text-blue-600 mt-1">
                Dane: {getDataAttributesSummary()}
              </div>
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
