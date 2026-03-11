#!/usr/bin/env bun

/**
 * Keep Supabase project active by creating and deleting a temporary property
 * Run with: bun keep-alive.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Error: Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY environment variables'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function keepAlive() {
  try {
    console.log('Creating temporary property to generate database traffic...');

    const timestamp = new Date().toISOString();

    const { data: createdProperty, error: createError } = await supabase
      .from('properties')
      .insert({
        name: `Keep Alive ${timestamp}`,
        address: `Automation ${timestamp}`,
        monthly_rent: 1,
        currency: 'RD$',
        rooms: 1,
        status: 'Disponible',
        payment_status: 'Pendiente',
      })
      .select();

    if (createError) {
      console.error('Create failed:', createError.message);
      process.exit(1);
    }

    const propertyId = createdProperty?.[0]?.id;

    if (!propertyId) {
      console.error('Create succeeded but no property id was returned');
      process.exit(1);
    }

    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (deleteError) {
      console.error('Delete failed:', deleteError.message);
      process.exit(1);
    }

    console.log('Temporary property created and deleted successfully');
    console.log('Property id:', propertyId);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

keepAlive();
