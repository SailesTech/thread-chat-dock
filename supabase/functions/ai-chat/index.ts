const WEBHOOK_URL = 'https://n8n-production-2e02.up.railway.app/webhook/3389e498-f059-447c-a1a8-ff8a181ac8cb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  console.log("🚀 ai-chat function called");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { message, threadId, notionContext } = requestData;
    
    console.log('Received:', { 
      message: message?.substring(0, 50) + "...", 
      threadId, 
      databasesCount: notionContext?.availableDatabases?.length || 0
    });

    // Przygotuj wybrane bazy wiedzy dla n8n
    let selectedDatabases = [];
    
    if (notionContext && notionContext.availableDatabases) {
      // TODO: Frontend pozwoli wybrać bazy - na razie bierz pierwsze 5
      selectedDatabases = notionContext.availableDatabases.slice(0, 5).map(db => ({
        id: db.id,
        name: db.name || db.title,
        description: db.description || '',
        pages: db.pages || [],
        attributes: db.attributes || []
      }));
    }

    // Dane dla n8n
    const payload = {
      message: message,
      threadId: threadId,
      selectedDatabases: selectedDatabases,
      userRequest: {
        text: message,
        timestamp: new Date().toISOString(),
        language: 'pl'
      },
      context: {
        totalDatabases: notionContext?.availableDatabases?.length || 0,
        selectedCount: selectedDatabases.length
      }
    };

    console.log('Sending to n8n:', selectedDatabases.map(db => db.name));

    // Wyślij do n8n
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('n8n response received');

    // Parsuj odpowiedź z n8n
    let aiResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (e) {
      aiResponse = { response: responseText, success: true };
    }

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(JSON.stringify({ 
      response: "Przepraszam, wystąpił błąd podczas przetwarzania zapytania.",
      success: false 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
