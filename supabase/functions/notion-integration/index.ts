import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, database_id, property_name, filters, data_attributes, page_size } = await req.json();
    
    const notionToken = Deno.env.get('NOTION_API_KEY');
    if (!notionToken) {
      console.error('NOTION_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Notion API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notionHeaders = {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    if (action === 'query_with_filters') {
      if (!database_id) {
        console.error('Database ID is required for query_with_filters');
        return new Response(
          JSON.stringify({ error: 'Database ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Querying database with filters:', { database_id, filters, data_attributes });

      // Build Notion filter object
      let notionFilter = {};
      if (filters && filters.length > 0) {
        console.log('Processing filters:', filters);
        
        const filterConditions = [];
        
        for (const filter of filters) {
          console.log('Processing filter:', filter);
          
          if (!filter.attributeName || !filter.selectedValues || filter.selectedValues.length === 0) {
            console.warn('Skipping invalid filter:', filter);
            continue;
          }

          // Handle different property types
          if (filter.selectedValues.length === 1) {
            // Single value filter
            const value = filter.selectedValues[0];
            
            // Determine filter type based on attribute name and value
            let filterCondition;
            
            // For select/multi_select properties
            if (filter.attributeType === 'multi_select' || filter.attributeType === 'select') {
              filterCondition = {
                property: filter.attributeName,
                multi_select: {
                  contains: value
                }
              };
            } else if (filter.attributeType === 'status') {
              filterCondition = {
                property: filter.attributeName,
                status: {
                  equals: value
                }
              };
            } else {
              // Default to select
              filterCondition = {
                property: filter.attributeName,
                select: {
                  equals: value
                }
              };
            }
            
            filterConditions.push(filterCondition);
          } else {
            // Multiple values - use OR condition
            const orConditions = filter.selectedValues.map((value: string) => {
              if (filter.attributeType === 'multi_select') {
                return {
                  property: filter.attributeName,
                  multi_select: {
                    contains: value
                  }
                };
              } else if (filter.attributeType === 'status') {
                return {
                  property: filter.attributeName,
                  status: {
                    equals: value
                  }
                };
              } else {
                return {
                  property: filter.attributeName,
                  select: {
                    equals: value
                  }
                };
              }
            });
            
            filterConditions.push({
              or: orConditions
            });
          }
        }

        if (filterConditions.length === 1) {
          notionFilter = filterConditions[0];
        } else if (filterConditions.length > 1) {
          notionFilter = {
            and: filterConditions
          };
        }
      }

      // Query the database
      const queryBody: any = {
        page_size: page_size || 100
      };

      if (Object.keys(notionFilter).length > 0) {
        queryBody.filter = notionFilter;
        console.log('Notion query with filter:', JSON.stringify(queryBody, null, 2));
      } else {
        console.log('Notion query without filters');
      }

      const response = await fetch(`https://api.notion.com/v1/databases/${database_id}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify(queryBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to query database:', errorText);
        console.error('Response status:', response.status);
        console.error('Query body was:', JSON.stringify(queryBody, null, 2));
        return new Response(
          JSON.stringify({ 
            error: 'Failed to query database from Notion',
            details: errorText,
            status: response.status
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Found', data.results?.length || 0, 'pages');

      // Process pages and filter properties based on data_attributes
      const pages = data.results?.map((page: any) => {
        let title = 'Untitled Page';
        
        // Extract title
        if (page.properties) {
          for (const [key, value] of Object.entries(page.properties)) {
            if ((value as any).type === 'title' && (value as any).title?.[0]?.plain_text) {
              title = (value as any).title[0].plain_text;
              break;
            }
          }
        }

        // Filter properties based on data_attributes
        let properties = page.properties || {};
        if (data_attributes && data_attributes.length > 0) {
          const filteredProperties: any = {};
          data_attributes.forEach((attrName: string) => {
            if (properties[attrName]) {
              filteredProperties[attrName] = properties[attrName];
            }
          });
          properties = filteredProperties;
        }

        return {
          id: page.id,
          title: title,
          properties: properties,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time
        };
      }) || [];

      return new Response(
        JSON.stringify({ 
          pages,
          totalCount: pages.length,
          hasMore: data.has_more || false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_databases') {
      console.log('Fetching databases from Notion API');
      
      const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'database'
          },
          sort: {
            direction: 'descending',
            timestamp: 'last_edited_time'
          }
        })
      });

      console.log('Notion API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Notion API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch databases from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Notion API success - Found', data.results?.length || 0, 'results');

      const databases = data.results?.map((db: any) => {
        const title = db.title?.[0]?.plain_text || 'Untitled Database';
        console.log(`Processing database: ${title} (ID: ${db.id})`);
        
        return {
          id: db.id,
          name: title,
          last_edited_time: db.last_edited_time
        };
      }) || [];

      return new Response(
        JSON.stringify({ databases }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_pages') {
      if (!database_id) {
        return new Response(
          JSON.stringify({ error: 'Database ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching pages for database:', database_id);

      const response = await fetch(`https://api.notion.com/v1/databases/${database_id}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({
          page_size: 100
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch pages:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch pages from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Found', data.results?.length || 0, 'pages');

      const pages = data.results?.map((page: any) => {
        let title = 'Untitled Page';
        
        if (page.properties) {
          for (const [key, value] of Object.entries(page.properties)) {
            if ((value as any).type === 'title' && (value as any).title?.[0]?.plain_text) {
              title = (value as any).title[0].plain_text;
              break;
            }
          }
        }

        return {
          id: page.id,
          name: title,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time
        };
      }) || [];

      return new Response(
        JSON.stringify({ pages }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_attributes') {
      if (!database_id) {
        return new Response(
          JSON.stringify({ error: 'Database ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching attributes for database:', database_id);

      const response = await fetch(`https://api.notion.com/v1/databases/${database_id}`, {
        method: 'GET',
        headers: notionHeaders
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch database schema:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch database schema from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Fetched database schema successfully');

      const attributes = Object.entries(data.properties || {}).map(([name, property]: [string, any]) => ({
        id: property.id || name,
        name: name,
        type: property.type
      }));

      return new Response(
        JSON.stringify({ attributes }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_database_properties') {
      if (!database_id || !property_name) {
        return new Response(
          JSON.stringify({ error: 'Database ID and property name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fetching property "${property_name}" for database:`, database_id);

      const response = await fetch(`https://api.notion.com/v1/databases/${database_id}`, {
        method: 'GET',
        headers: notionHeaders
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch database properties:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch database properties from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const property = data.properties?.[property_name];

      if (!property) {
        return new Response(
          JSON.stringify({ error: `Property "${property_name}" not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let propertyData = { type: property.type };

      if (property.type === 'select' && property.select?.options) {
        propertyData = {
          ...propertyData,
          options: property.select.options
        };
      } else if (property.type === 'multi_select' && property.multi_select?.options) {
        propertyData = {
          ...propertyData,
          options: property.multi_select.options
        };
      } else if (property.type === 'status' && property.status?.options) {
        propertyData = {
          ...propertyData,
          options: property.status.options
        };
      }

      console.log(`Property "${property_name}" fetched successfully:`, propertyData);

      return new Response(
        JSON.stringify({ property: propertyData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
