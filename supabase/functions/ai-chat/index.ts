import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WEBHOOK_URL = 'https://n8n-production-2e02.up.railway.app/webhook/3389e498-f059-447c-a1a8-ff8a181ac8cb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Pobierz dane z requestu
    const requestData = await req.json();
    const { message, threadId, notionContext } = requestData;
    
    console.log('Received request:', { message, threadId, notionContext });

    // Wyślij POST do webhooka
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

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', webhookResponse.status, errorText);
      throw new Error(`Webhook error: ${webhookResponse.status} - ${errorText}`);
    }

    // Pobierz odpowiedź z webhooka
    const webhookData = await webhookResponse.json();
    console.log('Webhook response:', webhookData);

    // Zwróć odpowiedź
    return new Response(JSON.stringify(webhookData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
