#!/usr/bin/env bun

/**
 * Keep Supabase project active by pinging the database every 4 days
 * Run with: bun keep-alive.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function keepAlive() {
  try {
    console.log('🔄 Updating database to keep project alive...');

    // Create/update keep_alive table
    const { data, error } = await supabase
      .from('keep_alive')
      .upsert(
        {
          id: 1,
          last_ping: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log('✅ Database updated successfully!');
    console.log('Last ping:', data?.[0]?.last_ping);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

keepAlive();
