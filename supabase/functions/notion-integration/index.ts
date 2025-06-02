Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, access_token, database_id, filters } = await req.json();

    const notionHeaders = {
      'Authorization': `Bearer ${access_token}`,
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

      const queryBody: any = {
        page_size: 100
      };

      // Build Notion filter object
      let notionFilter = {};
      if (filters && filters.length > 0) {
        console.log('=== NOTION FILTER DEBUG START ===');
        console.log('Raw filters received:', JSON.stringify(filters, null, 2));

        const filterConditions = [];

        for (const filter of filters) {
          console.log(`\n--- Processing filter for attribute: ${filter.attributeName} ---`);
          console.log('Filter details:', {
            attributeName: filter.attributeName,
            attributeType: filter.attributeType,
            selectedValues: filter.selectedValues,
            selectedNames: filter.selectedNames,
            valuesCount: filter.selectedValues?.length
          });
          
          if (!filter.attributeName) {
            console.error('❌ Missing attributeName in filter:', filter);
            continue;
          }
          
          if (!filter.selectedValues || filter.selectedValues.length === 0) {
            console.warn('⚠️ No selectedValues in filter:', filter);
            continue;
          }

          const createFilterCondition = (value: string) => {
            const property = filter.attributeName;
            const attributeType = filter.attributeType;
            
            console.log(`Creating condition for value: "${value}" with type: "${attributeType}"`);
            
            let condition;
            
            // Określ prawidłowy operator na podstawie typu właściwości
            if (attributeType === 'multi_select') {
              condition = {
                property,
                multi_select: {
                  contains: value
                }
              };
              console.log('✅ Created multi_select condition');
            } else if (attributeType === 'select') {
              condition = {
                property,
                select: {
                  equals: value
                }
              };
              console.log('✅ Created select condition');
            } else if (attributeType === 'status') {
              condition = {
                property,
                status: {
                  equals: value
                }
              };
              console.log('✅ Created status condition');
            } else {
              // Domyślnie użyj select
              console.warn(`⚠️ Unknown attribute type: "${attributeType}", defaulting to select`);
              condition = {
                property,
                select: {
                  equals: value
                }
              };
              console.log('✅ Created default select condition');
            }
            
            console.log('Final condition:', JSON.stringify(condition, null, 2));
            return condition;
          };

          if (filter.selectedValues.length === 1) {
            // Pojedyncza wartość
            console.log('📝 Single value filter');
            const filterCondition = createFilterCondition(filter.selectedValues[0]);
            filterConditions.push(filterCondition);
            console.log('Added single condition to filterConditions');
          } else {
            // Wiele wartości - użyj OR condition
            console.log(`📝 Multiple values filter (${filter.selectedValues.length} values)`);
            const orConditions = filter.selectedValues.map((value, index) => {
              console.log(`Processing OR condition ${index + 1}/${filter.selectedValues.length} for value: "${value}"`);
              return createFilterCondition(value);
            });
            
            const orCondition = {
              or: orConditions
            };
            
            console.log('Final OR condition:', JSON.stringify(orCondition, null, 2));
            filterConditions.push(orCondition);
            console.log('Added OR condition to filterConditions');
          }
          
          console.log(`--- Finished processing ${filter.attributeName} ---\n`);
        }

        console.log('\n=== FILTER CONDITIONS SUMMARY ===');
        console.log('Total filter conditions created:', filterConditions.length);
        console.log('All filter conditions:', JSON.stringify(filterConditions, null, 2));

        // Build final notion filter
        if (filterConditions.length === 1) {
          notionFilter = filterConditions[0];
          console.log('🔧 Using single filter condition');
        } else if (filterConditions.length > 1) {
          notionFilter = {
            and: filterConditions
          };
          console.log('🔧 Using AND combination of multiple filters');
        } else {
          console.log('🔧 No filter conditions - querying without filters');
        }

        console.log('\n=== FINAL NOTION FILTER ===');
        console.log('Final notionFilter object:', JSON.stringify(notionFilter, null, 2));
        console.log('=== NOTION FILTER DEBUG END ===\n');
      }

      if (Object.keys(notionFilter).length > 0) {
        queryBody.filter = notionFilter;
        console.log('Notion query with filter:', JSON.stringify(queryBody, null, 2));
      } else {
        console.log('Notion query without filters');
      }

      console.log('Notion query body:', JSON.stringify(queryBody, null, 2));
      
      // Dodatkowe logowanie przed wysłaniem
      console.log('=== SENDING TO NOTION API ===');
      console.log('URL:', `https://api.notion.com/v1/databases/${database_id}/query`);
      console.log('Method: POST');
      console.log('Body being sent:', JSON.stringify(queryBody, null, 2));
      console.log('============================');
      
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
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'get_databases') {
      const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({
          filter: {
            value: 'database',
            property: 'object'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get databases:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch databases from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'get_database_properties') {
      if (!database_id) {
        return new Response(
          JSON.stringify({ error: 'Database ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.notion.com/v1/databases/${database_id}`, {
        method: 'GET',
        headers: notionHeaders
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get database properties:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch database properties from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'query_database') {
      if (!database_id) {
        return new Response(
          JSON.stringify({ error: 'Database ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.notion.com/v1/databases/${database_id}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({
          page_size: 100
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to query database:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to query database from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'get_page') {
      const { page_id } = await req.json();
      
      if (!page_id) {
        return new Response(
          JSON.stringify({ error: 'Page ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
        method: 'GET',
        headers: notionHeaders
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get page:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch page from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'create_page') {
      const { database_id: db_id, properties } = await req.json();
      
      if (!db_id || !properties) {
        return new Response(
          JSON.stringify({ error: 'Database ID and properties are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({
          parent: {
            database_id: db_id
          },
          properties
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create page:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create page in Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'update_page') {
      const { page_id, properties } = await req.json();
      
      if (!page_id || !properties) {
        return new Response(
          JSON.stringify({ error: 'Page ID and properties are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
        method: 'PATCH',
        headers: notionHeaders,
        body: JSON.stringify({
          properties
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update page:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to update page in Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'delete_page') {
      const { page_id } = await req.json();
      
      if (!page_id) {
        return new Response(
          JSON.stringify({ error: 'Page ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
        method: 'PATCH',
        headers: notionHeaders,
        body: JSON.stringify({
          archived: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete page:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to delete page in Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'get_page_content') {
      const { page_id } = await req.json();
      
      if (!page_id) {
        return new Response(
          JSON.stringify({ error: 'Page ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.notion.com/v1/blocks/${page_id}/children`, {
        method: 'GET',
        headers: notionHeaders
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get page content:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch page content from Notion' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
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
