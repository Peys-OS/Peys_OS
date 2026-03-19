/**
 * Supabase Client Utility for WhatsApp Bot
 * 
 * Provides a configured Supabase client for database operations.
 * Uses service role for bot operations (bypasses RLS).
 * 
 * Security: Environment variables MUST be set:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY (service role key for bot operations)
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration:');
  if (!supabaseUrl) console.error('  - SUPABASE_URL not set');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✓ Supabase client initialized');
console.log(`  URL: ${supabaseUrl}`);

module.exports = { supabase };
