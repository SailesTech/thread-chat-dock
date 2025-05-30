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
    console.log('n8n response received, content:', responseText);

    // Parsuj odpowiedź z n8n
    let aiResponse;
    try {
      const parsed = JSON.parse(responseText);
      console.log('n8n parsed response:', parsed);
      
      // n8n zwraca {output: "tekst"} - weź tylko tekst
      if (parsed.output) {
        aiResponse = { 
          response: parsed.output,  // Tylko sam tekst
          success: true 
        };
      }
      // n8n zwraca array z obiektem [{output: "..."}]
      else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].output) {
        aiResponse = { 
          response: parsed[0].output, 
          success: true 
        };
      }
      // Inne możliwe formaty
      else if (parsed.response) {
        aiResponse = parsed;
      } else if (parsed.message) {
        aiResponse = { response: parsed.message, success: true };
      } else if (parsed.text) {
        aiResponse = { response: parsed.text, success: true };
      } else if (typeof parsed === 'string') {
        aiResponse = { response: parsed, success: true };
      } else {
        // Fallback - użyj całej odpowiedzi jako tekst
        aiResponse = { response: JSON.stringify(parsed), success: true };
      }
    } catch (e) {
      console.log('n8n response is not JSON, treating as text');
      aiResponse = { response: responseText, success: true };
    }
    
    console.log('Final response to send:', aiResponse);

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
