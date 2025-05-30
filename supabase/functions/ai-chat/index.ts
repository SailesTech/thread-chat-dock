const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  console.log("🚀 ai-chat function called");

  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight");
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Processing POST request");
    
    const requestData = await req.json();
    const { message, threadId, notionContext } = requestData;
    
    console.log('Received data:', { 
      message: message?.substring(0, 50) + "...", 
      threadId, 
      hasNotionContext: !!notionContext 
    });

    // Odpowiedź w formacie oczekiwanym przez aplikację
    const aiResponse = {
      response: `Cześć! Otrzymałem twoją wiadomość: "${message}". 

Mam dostęp do ${notionContext?.availableDatabases?.length || 0} baz danych Notion. 

Funkcja AI chat działa poprawnie! 🎉

ThreadId: ${threadId}`,
      success: true
    };

    console.log('Returning AI response:', { 
      responseLength: aiResponse.response.length, 
      success: aiResponse.success 
    });

    return new Response(JSON.stringify(aiResponse), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(JSON.stringify({ 
      response: "Przepraszam, wystąpił błąd w funkcji AI.",
      success: false,
      error: error.message
    }), {
      status: 200, // Zwracamy 200 nawet dla błędów, żeby aplikacja mogła pokazać wiadomość
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
