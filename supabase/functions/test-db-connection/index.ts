// Test function to verify database connection and table structure
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateAdmin } from '../_shared/auth.ts';

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(_req);
    
    console.log('Starting database connection test...', undefined, 'index');
    
    // Test 1: Check database connection by querying pg_tables
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .eq('tablename', 'products')
      .limit(1);

    if (tablesError) {
      console.error('Tables query error:', tablesError, 'index');
      return new Response(JSON.stringify({ 
        error: 'Database connection test failed', 
        details: tablesError.message,
        code: tablesError.code
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const tableExists = tables && tables.length > 0;
    console.log('Table exists:', tableExists, 'index');

    // Test 2: If table exists, check its structure
    if (tableExists) {
      console.log('Checking table structure...', undefined, 'index');
      
      // Query information schema to get column details
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'products')
        .order('ordinal_position');

      if (columnsError) {
        console.error('Columns query error:', columnsError, 'index');
        return new Response(JSON.stringify({ 
          error: 'Column structure query failed', 
          details: columnsError.message,
          code: columnsError.code
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      console.log('Columns found:', JSON.stringify(columns, null, 2, 'index'));
      
      // Check if imageUrl column exists
      const imageUrlColumn = columns.find(col => col.column_name === 'imageUrl');
      console.log('imageUrl column:', imageUrlColumn, 'index');

      // Test 3: Try to insert a test product
      console.log('Attempting to insert test product...', undefined, 'index');
      const testProduct = {
        name: "DB Test Product",
        description: "Test description",
        categories: ["Test"],
        price: 9.99,
        imageUrl: "https://example.com/test.jpg",
        stock: 1
      };

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('products')
        .insert([testProduct])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError, 'index');
        return new Response(JSON.stringify({ 
          error: 'Product insertion failed', 
          details: insertError.message,
          code: insertError.code,
          tableExists: tableExists,
          imageUrlColumnExists: !!imageUrlColumn,
          columns: columns
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      console.log('Insert successful:', JSON.stringify(insertData, null, 2, 'index'));

      // Clean up - delete the test product
      if (insertData && insertData.id) {
        await supabaseAdmin.from('products').delete().eq('id', insertData.id);
        console.log('Test product cleaned up', undefined, 'index');
      }

      return new Response(JSON.stringify({ 
        success: true,
        tableExists: tableExists,
        imageUrlColumnExists: !!imageUrlColumn,
        columns: columns,
        testProduct: insertData ? 'Inserted and cleaned up' : 'Not inserted'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Table doesn't exist, try to create it
      console.log('Products table does not exist, attempting to create it...', undefined, 'index');
      
      // Since we can't run DDL in Edge Functions, we'll return an error
      return new Response(JSON.stringify({ 
        error: 'Products table does not exist',
        details: 'The products table was not found in the database'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    console.error('Function error:', error, 'index');
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});