
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
    console.log('Notion integration function called');
    
    // Check if Notion API key is configured
    if (!notionApiKey) {
      console.error('NOTION_API_KEY is not configured');
      return new Response(JSON.stringify({ 
        error: 'Notion API key is not configured. Please add your Notion API key in the project settings.',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Notion API key found, length:', notionApiKey.length);

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { action, database_id, query, filters } = requestBody;

    console.log(`Notion API action: ${action}`, { database_id, query, filters });

    switch (action) {
      case 'databases':
        return await getDatabases();
      case 'pages':
        return await getPages(database_id);
      case 'attributes':
        return await getAttributes(database_id);
      case 'query':
        return await queryNotionData(query, filters);
      default:
        console.error(`Invalid action: ${action}`);
        return new Response(JSON.stringify({ 
          error: 'Invalid action',
          success: false 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in notion-integration function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString(),
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getDatabases() {
  console.log('Getting databases - API key length:', notionApiKey?.length || 0);
  
  try {
    console.log('Making request to Notion API search endpoint...');
    
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
        },
        page_size: 100
      }),
    });

    console.log('Notion API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Notion API error: ${response.status} - ${errorText}`);
      
      // Parse error response if possible
      let errorDetails = 'Unknown error';
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.message || errorJson.error || errorText;
      } catch {
        errorDetails = errorText;
      }
      
      return new Response(JSON.stringify({ 
        error: `Notion API error (${response.status}): ${errorDetails}`,
        success: false
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log(`Notion API success - Found ${data.results?.length || 0} results`);
    console.log('Raw response:', JSON.stringify(data, null, 2));
    
    if (!data.results || !Array.isArray(data.results)) {
      console.error('Unexpected response format:', data);
      return new Response(JSON.stringify({ 
        error: 'Unexpected response format from Notion API',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const databases = data.results.map((db: NotionDatabase) => {
      const title = db.title?.[0]?.plain_text || 'Untitled Database';
      console.log(`Processing database: ${title} (ID: ${db.id})`);
      
      return {
        id: db.id,
        name: title,
        available: true
      };
    });

    console.log('Processed databases:', databases);

    return new Response(JSON.stringify(databases), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Exception in getDatabases:', error);
    return new Response(JSON.stringify({ 
      error: `Failed to fetch databases: ${error.message}`,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getPages(databaseId: string | null) {
  if (!databaseId) {
    console.error('Database ID is required for fetching pages');
    return new Response(JSON.stringify({ 
      error: 'Database ID required',
      success: false 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`Calling Notion API to fetch pages for database: ${databaseId}`);

  try {
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
      const errorText = await response.text();
      console.error(`Notion API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ 
        error: `Notion API error: ${response.status} - ${errorText}`,
        success: false
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log(`Found ${data.results.length} pages`);
    
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

    console.log('Processed pages:', pages);

    return new Response(JSON.stringify(pages), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Exception in getPages:', error);
    return new Response(JSON.stringify({ 
      error: `Failed to fetch pages: ${error.message}`,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getAttributes(databaseId: string | null) {
  if (!databaseId) {
    console.error('Database ID is required for fetching attributes');
    return new Response(JSON.stringify({ 
      error: 'Database ID required',
      success: false 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`Calling Notion API to fetch attributes for database: ${databaseId}`);

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Notion API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ 
        error: `Notion API error: ${response.status} - ${errorText}`,
        success: false
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log(`Found ${Object.keys(data.properties).length} attributes`);
    
    const attributes = Object.entries(data.properties).map(([name, property]: [string, any]) => ({
      id: name,
      name: name,
      type: property.type,
      database_id: databaseId
    }));

    console.log('Processed attributes:', attributes);

    return new Response(JSON.stringify(attributes), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Exception in getAttributes:', error);
    return new Response(JSON.stringify({ 
      error: `Failed to fetch attributes: ${error.message}`,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function queryNotionData(query: string | null, filters: any) {
  // This is a simplified query implementation
  // In a real app, you'd parse the query and convert it to Notion API filters
  console.log('Querying Notion data:', { query, filters });
  
  return new Response(JSON.stringify([]), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
