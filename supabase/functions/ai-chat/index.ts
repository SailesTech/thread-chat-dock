const WEBHOOK_URL = 'https://n8n-production-2e02.up.railway.app/webhook/3389e498-f059-447c-a1a8-ff8a181ac8cb';

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
    
    // Pobierz dane z requestu
    const requestData = await req.json();
    const { message, threadId, notionContext } = requestData;
    
    console.log('Received data:', { message, threadId, notionContextLength: notionContext ? JSON.stringify(notionContext).length : 0 });

    // Wyślij POST do webhooka n8n
    console.log('Forwarding to webhook:', WEBHOOK_URL);
    
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        threadId,
        notionContext
      }),
    });

    console.log('Webhook response status:', webhookResponse.status);
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', webhookResponse.status, errorText);
      throw new Error(`Webhook error: ${webhookResponse.status} - ${errorText}`);
    }

    // Pobierz odpowiedź z webhooka
    const responseText = await webhookResponse.text();
    console.log('Webhook response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log('Webhook returned non-JSON, treating as text');
      responseData = { response: responseText, success: true };
    }

    console.log('Returning response to client');

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
