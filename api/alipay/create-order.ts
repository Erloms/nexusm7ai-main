/// <reference lib="deno.ns" />
declare const Deno: any; // Explicitly declare Deno for local TypeScript compilation

import { AlipaySdk } from '@alipay/mcp-server-alipay';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types'; // Adjust path as needed

// Initialize Supabase client for the backend function
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Add new API keys environment variables
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');


// Add logging to see what values are being read
console.log('DEBUG: VITE_SUPABASE_URL:', SUPABASE_URL);
console.log('DEBUG: VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);
console.log('DEBUG: VITE_GOOGLE_API_KEY:', GOOGLE_API_KEY ? 'Set' : 'Not Set');
console.log('DEBUG: VITE_GROQ_API_KEY:', GROQ_API_KEY ? 'Set' : 'Not Set');
console.log('DEBUG: VITE_OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? 'Set' : 'Not Set');


// Ensure environment variables are loaded before creating the client
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Throw a more specific error if environment variables are missing
  throw new Error("Supabase URL and Anon Key must be set in the .env file. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);