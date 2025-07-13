import { AlipaySdk } from '@alipay/mcp-server-alipay';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types'; // Adjust path as needed
import { v4 as uuidv4 } from 'uuid'; // For generating unique order IDs

// Initialize Supabase client for the backend function
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is not set in environment variables.');
  // In a real scenario, you might want to throw an error or exit process
}

const supabase = createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!);

// Initialize Alipay SDK with environment variables
const alipaySdk = new AlipaySdk({
  appId: process.env.AP_APP_ID!,
  privateKey: process.env.AP_APP_KEY!, // AP_APP_KEY is the private key
  alipayPublicKey: process.env.AP_PUB_KEY!,
  gateway: process.env.AP_CURRENT_ENV === 'sandbox' ? 'https://openapi.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do',
  signType: process.env.AP_ENCRYPTION_ALGO || 'RSA2',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { userId, amount, orderType, subject, returnUrl, notifyUrl } = await req.json();

    if (!userId || !amount || !orderType || !subject || !returnUrl || !notifyUrl) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const outTradeNo = `NEXUS-${uuidv4()}`; // Generate a unique order ID

    // Save pending order to Supabase first
    const { data: newOrder, error: insertError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: userId,
        amount: amount,
        order_id: outTradeNo,
        order_type: orderType,
        status: 'pending',
        subject: subject,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase: Error inserting new payment order:', insertError);
      throw new Error(`Failed to create payment order in database: ${insertError.message}`);
    }

    // Alipay trade.page.pay for direct redirect (web payment)
    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      notifyUrl: notifyUrl,
      returnUrl: returnUrl,
      bizContent: {
        out_trade_no: outTradeNo,
        product_code: 'FAST_INSTANT_TRADE_PAY', // For web payments
        total_amount: amount.toFixed(2), // Amount must be string with 2 decimal places
        subject: subject,
        body: `${orderType} membership purchase for user ${userId}`,
      },
    }, { formData: true }); // formData: true returns a form string for redirection

    // The result is an HTML form string that needs to be submitted to Alipay
    // We will return this HTML form string to the frontend, which will then submit it.
    return new Response(JSON.stringify({
      success: true,
      form: result, // This is the HTML form string
      orderId: outTradeNo,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Alipay Create Order Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}