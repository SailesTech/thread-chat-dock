
const WEBHOOK_URL = 'https://n8n-production-2e02.up.railway.app/webhook/3389e498-f059-447c-a1a8-ff8a181ac8cb';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const requestData = await req.json();
    const { message, threadId, notionContext } = requestData;

    console.log('AI Chat request:', { message, threadId, hasContext: !!notionContext });

    let processedContext = null;
    
    if (notionContext && notionContext.selectedDatabase) {
      const db = notionContext.selectedDatabase;
      
      console.log('Processing Notion context:', {
        databaseName: db.name,
        hasFilters: db.hasFilters,
        hasDataSelection: db.hasDataSelection,
        pagesCount: db.filteredData?.pages?.length || 0
      });

      processedContext = {
        selectedDatabase: {
          id: db.id,
          name: db.name,
          hasFilters: db.hasFilters || false,
          hasDataSelection: db.hasDataSelection || false,
          filterSummary: db.filterSummary || 'Brak filtrów',
          dataAttributesSummary: db.dataAttributesSummary || 'Wszystkie atrybuty',
          filteredData: db.filteredData || null,
          pagesCount: db.filteredData?.pages?.length || 0,
          totalPagesAvailable: db.filteredData?.totalCount || 0,
          hasMorePages: db.filteredData?.hasMore || false
        },
        filters: notionContext.filters || [],
        dataAttributes: notionContext.dataAttributes || [],
        summary: notionContext.summary || {},
        selectedPage: notionContext.selectedPage || null
      };

      // Prepare data summary for AI
      if (processedContext.selectedDatabase.filteredData?.pages) {
        const pages = processedContext.selectedDatabase.filteredData.pages;
        console.log(`Sending ${pages.length} filtered pages to AI`);
        
        // Add data summary
        processedContext.dataSummary = {
          totalPages: pages.length,
          sampleTitles: pages.slice(0, 5).map(p => p.title),
          availableProperties: pages.length > 0 
            ? Object.keys(pages[0].properties || {})
            : [],
          filteringDescription: processedContext.selectedDatabase.hasFilters 
            ? `Dane zostały przefiltrowane według: ${processedContext.selectedDatabase.filterSummary}`
            : 'Używam wszystkich dostępnych danych z bazy',
          dataScope: processedContext.selectedDatabase.hasDataSelection
            ? `Uwzględniam tylko wybrane atrybuty: ${processedContext.selectedDatabase.dataAttributesSummary}`
            : 'Uwzględniam wszystkie atrybuty z bazy danych'
        };
      }
    }

    // Prepare payload for n8n webhook
    const payload = {
      message: message,
      threadId: threadId,
      notionContext: processedContext,
      userRequest: {
        text: message,
        timestamp: new Date().toISOString(),
        language: 'pl'
      },
      context: {
        hasUserSelection: !!processedContext,
        databaseName: processedContext?.selectedDatabase?.name || 'none',
        hasFilters: processedContext?.selectedDatabase?.hasFilters || false,
        hasDataSelection: processedContext?.selectedDatabase?.hasDataSelection || false,
        pagesCount: processedContext?.selectedDatabase?.pagesCount || 0,
        filterDescription: processedContext?.selectedDatabase?.filterSummary || 'Brak filtrów',
        dataDescription: processedContext?.selectedDatabase?.dataAttributesSummary || 'Wszystkie atrybuty',
        systemMessage: processedContext 
          ? `Użytkownik wybrał bazę "${processedContext.selectedDatabase.name}". ${processedContext.dataSummary?.filteringDescription || ''} ${processedContext.dataSummary?.dataScope || ''}`
          : 'Użytkownik nie wybrał żadnej bazy danych Notion.'
      }
    };

    console.log('Sending to n8n:', {
      hasContext: !!processedContext,
      pagesCount: payload.context.pagesCount,
      hasFilters: payload.context.hasFilters
    });

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('n8n webhook error:', response.status, response.statusText);
      throw new Error(`n8n webhook error: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('n8n response received, length:', responseText.length);

    let aiResponse;
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.output) {
        aiResponse = {
          content: parsed.output,
          success: true
        };
      } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].output) {
        aiResponse = {
          content: parsed[0].output,
          success: true
        };
      } else if (parsed.response) {
        aiResponse = {
          content: parsed.response,
          success: true
        };
      } else if (parsed.message) {
        aiResponse = {
          content: parsed.message,
          success: true
        };
      } else if (parsed.text) {
        aiResponse = {
          content: parsed.text,
          success: true
        };
      } else if (parsed.content) {
        aiResponse = {
          content: parsed.content,
          success: true
        };
      } else if (typeof parsed === 'string') {
        aiResponse = {
          content: parsed,
          success: true
        };
      } else {
        console.log('Unexpected response format:', parsed);
        aiResponse = {
          content: JSON.stringify(parsed),
          success: true
        };
      }
    } catch (e) {
      console.log('Response is not JSON, using as text');
      aiResponse = {
        content: responseText,
        success: true
      };
    }

    console.log('AI response processed successfully');

    return new Response(JSON.stringify(aiResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    
    return new Response(JSON.stringify({
      content: "Przepraszam, wystąpił błąd podczas przetwarzania zapytania. Spróbuj ponownie za chwilę.",
      success: false,
      error: error.message
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
