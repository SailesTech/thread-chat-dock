const WEBHOOK_URL = 'https://n8n-production-2e02.up.railway.app/webhook/3389e498-f059-447c-a1a8-ff8a181ac8cb';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const requestData = await req.json();
    const { message, threadId, notionContext } = requestData;
    let selectedDatabase = null;
    if (notionContext && notionContext.selectedDatabase) {
      const db = notionContext.selectedDatabase;
      const attributeValues = notionContext.selectedAttributeValues || [];
      selectedDatabase = {
        id: db.id,
        name: db.name,
        description: db.description || '',
        pages: db.pages || [],
        attributes: db.attributes || [],
        selectedPage: notionContext.selectedPage || null,
        selectedAttributeValues: attributeValues,
        attributeFilters: attributeValues.map((av)=>({
            attributeId: av.attributeId,
            attributeName: av.attributeName,
            selectedValues: av.selectedValues,
            selectedNames: av.selectedNames || av.selectedValues,
            displayText: av.displayText || `${av.attributeName}: ${(av.selectedNames || av.selectedValues).join(', ')}`,
            filterText: av.displayText || `${av.attributeName}: ${(av.selectedNames || av.selectedValues).join(', ')}`,
            hasFilter: av.selectedValues.length > 0
          })),
        attributesSummary: attributeValues.length > 0 ? attributeValues.map((av)=>av.displayText || `${av.attributeName}: ${(av.selectedNames || av.selectedValues).join(', ')}`).join('; ') : 'brak filtrów',
        hasAttributeFilters: attributeValues.some((av)=>av.selectedValues.length > 0)
      };
    } else if (notionContext && notionContext.availableDatabases) {
      const firstDatabase = notionContext.availableDatabases[0];
      if (firstDatabase) {
        selectedDatabase = {
          id: firstDatabase.id,
          name: firstDatabase.name || firstDatabase.title,
          description: firstDatabase.description || '',
          pages: firstDatabase.pages || [],
          attributes: firstDatabase.attributes || [],
          selectedPage: null,
          selectedAttributeValues: [],
          attributeFilters: [],
          attributesSummary: 'brak filtrów',
          hasAttributeFilters: false
        };
      }
    }
    const payload = {
      message: message,
      threadId: threadId,
      selectedDatabase: selectedDatabase,
      userRequest: {
        text: message,
        timestamp: new Date().toISOString(),
        language: 'pl'
      },
      context: {
        hasUserSelection: !!selectedDatabase,
        databaseName: selectedDatabase?.name || 'none',
        pagesCount: selectedDatabase?.pages?.length || 0,
        attributesCount: selectedDatabase?.attributes?.length || 0,
        hasSelectedPage: !!selectedDatabase?.selectedPage,
        hasAttributeFilters: selectedDatabase?.hasAttributeFilters || false,
        attributeFiltersCount: selectedDatabase?.attributeFilters?.filter((f)=>f.hasFilter).length || 0,
        attributesSummary: selectedDatabase?.attributesSummary || 'brak filtrów',
        attributeFilters: selectedDatabase?.attributeFilters || [],
        filtersForAI: selectedDatabase?.hasAttributeFilters ? `Filtry: ${selectedDatabase.attributesSummary}` : 'Brak filtrów - użyj wszystkich danych'
      }
    };
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.status}`);
    }
    const responseText = await response.text();
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
        aiResponse = {
          content: JSON.stringify(parsed),
          success: true
        };
      }
    } catch (e) {
      aiResponse = {
        content: responseText,
        success: true
      };
    }
    return new Response(JSON.stringify(aiResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      content: "Przepraszam, wystąpił błąd podczas przetwarzania zapytania.",
      success: false
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
