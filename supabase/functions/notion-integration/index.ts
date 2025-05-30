
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const notionApiKey = Deno.env.get('NOTION_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotionDatabase {
  id: string;
  title: Array<{ plain_text: string }>;
  properties: Record<string, any>;
}

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  parent: { database_id?: string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log(`Notion API action: ${action}`);

    switch (action) {
      case 'databases':
        return await getDatabases();
      case 'pages':
        const databaseId = url.searchParams.get('database_id');
        return await getPages(databaseId);
      case 'attributes':
        const dbId = url.searchParams.get('database_id');
        return await getAttributes(dbId);
      case 'query':
        const { searchParams } = url;
        const query = searchParams.get('query');
        const filters = searchParams.get('filters');
        return await queryNotionData(query, filters);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in notion-integration function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getDatabases() {
  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: {
        property: 'object',
        value: 'database'
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }

  const data = await response.json();
  
  const databases = data.results.map((db: NotionDatabase) => ({
    id: db.id,
    name: db.title?.[0]?.plain_text || 'Untitled Database',
    available: true
  }));

  return new Response(JSON.stringify(databases), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getPages(databaseId: string | null) {
  if (!databaseId) {
    return new Response(JSON.stringify({ error: 'Database ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      page_size: 100
    }),
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }

  const data = await response.json();
  
  const pages = data.results.map((page: NotionPage) => {
    const titleProperty = Object.values(page.properties).find((prop: any) => 
      prop.type === 'title' && prop.title?.length > 0
    ) as any;
    
    return {
      id: page.id,
      title: titleProperty?.title?.[0]?.plain_text || 'Untitled Page',
      name: titleProperty?.title?.[0]?.plain_text || 'Untitled Page',
      database_id: databaseId
    };
  });

  return new Response(JSON.stringify(pages), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAttributes(databaseId: string | null) {
  if (!databaseId) {
    return new Response(JSON.stringify({ error: 'Database ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }

  const data = await response.json();
  
  const attributes = Object.entries(data.properties).map(([name, property]: [string, any]) => ({
    id: name,
    name: name,
    type: property.type,
    database_id: databaseId
  }));

  return new Response(JSON.stringify(attributes), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function queryNotionData(query: string | null, filters: string | null) {
  // This is a simplified query implementation
  // In a real app, you'd parse the query and convert it to Notion API filters
  console.log('Querying Notion data:', { query, filters });
  
  return new Response(JSON.stringify([]), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
