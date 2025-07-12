import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are set in your Vercel project settings
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not set.');
  throw new Error('Supabase environment variables are not configured for the backend function.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Use the Admin SDK to update the user's email_confirmed_at
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById( // Changed to updateUserById
      userId,
      { email_confirmed_at: new Date().toISOString() }
    );

    if (error) {
      console.error('Error confirming user email:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    console.log(`Successfully confirmed virtual email for user: ${userId}`);
    return new Response(JSON.stringify({ success: true, user: data.user }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Serverless function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}