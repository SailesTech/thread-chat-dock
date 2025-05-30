Deno.serve((req) => {
  console.log("🚀 Function called!");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Hello from Edge Function!",
    timestamp: Date.now()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
