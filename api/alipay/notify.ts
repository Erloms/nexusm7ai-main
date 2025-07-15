/// <reference lib="deno.ns" />
declare const Deno: any; // Explicitly declare Deno for local TypeScript compilation

import { AlipaySdk } from '@alipay/mcp-server-alipay';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types'; // Adjust path as needed

// Initialize Supabase client for the backend function
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is not set in environment variables.');
  // In a real scenario, you might want to throw an error or exit process
}

const supabase = createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!);

// Initialize Alipay SDK with environment variables
const alipaySdk = new AlipaySdk({
  appId: Deno.env.get('AP_APP_ID')!,
  privateKey: Deno.env.get('AP_APP_KEY')!,
  alipayPublicKey: Deno.env.get('AP_PUB_KEY')!,
  gateway: Deno.env.get('AP_CURRENT_ENV') === 'sandbox' ? 'https://openapi.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do',
  signType: Deno.env.get('AP_ENCRYPTION_ALGO') || 'RSA2',
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
    // Parse form data from the request body
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        params[key] = value;
      }
    }

    // Verify Alipay signature
    const signVerified = alipaySdk.checkRsaSign(params, params.sign, params.charset || 'utf-8', params.sign_type || 'RSA2');

    if (!signVerified) {
      console.warn('Alipay Notify: Signature verification failed.');
      return new Response('fail', { status: 400, headers: corsHeaders }); // Alipay expects 'fail' on verification failure
    }

    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no; // Our order_number
    const alipayTradeNo = params.trade_no; // Alipay's transaction ID

    if (!outTradeNo) {
      console.error('Alipay Notify: Missing out_trade_no in notification.');
      return new Response('fail', { status: 400, headers: corsHeaders });
    }

    // Fetch the order from Supabase using our order_number
    const { data: order, error: fetchOrderError } = await supabase
      .from('orders') // Query the new 'orders' table
      .select('*')
      .eq('order_number', outTradeNo)
      .single();

    if (fetchOrderError || !order) {
      console.error('Alipay Notify: Order not found in DB or fetch error:', fetchOrderError);
      return new Response('fail', { status: 404, headers: corsHeaders });
    }

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // Check if order is already paid to prevent duplicate processing
      if (order.status === 'paid') {
        console.log(`Alipay Notify: Order ${outTradeNo} already processed as paid.`);
        return new Response('success', { status: 200, headers: corsHeaders });
      }

      // Call the activate_membership function to update user profile and order status
      const { error: activateError } = await supabase.rpc('activate_membership', {
        p_user_id: order.user_id!,
        p_plan_id: order.plan_id!,
        p_order_id: order.id, // Pass the internal order ID
      });

      if (activateError) {
        console.error('Alipay Notify: Error activating membership:', activateError);
        // Attempt to update order status to failed if activation fails
        await supabase.from('orders').update({ status: 'failed', alipay_trade_no: alipayTradeNo, updated_at: new Date().toISOString() }).eq('id', order.id);
        return new Response('fail', { status: 500, headers: corsHeaders });
      }

      // Update alipay_trade_no in orders table (status is updated by activate_membership)
      const { error: updateTradeNoError } = await supabase
        .from('orders')
        .update({ alipay_trade_no: alipayTradeNo, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (updateTradeNoError) {
        console.error('Alipay Notify: Error updating trade_no:', updateTradeNoError);
        // This is a non-critical error, still return success to Alipay
      }

      console.log(`Alipay Notify: Payment successful for order ${outTradeNo}. User ${order.user_id} membership activated.`);
      return new Response('success', { status: 200, headers: corsHeaders }); // Alipay expects 'success' on successful processing
    } else if (tradeStatus === 'TRADE_CLOSED' || tradeStatus === 'TRADE_CANCELED') {
      // Update order status to failed/cancelled
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled', // Or 'failed'
          alipay_trade_no: alipayTradeNo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateOrderError) {
        console.error('Alipay Notify: Error updating order status to cancelled:', updateOrderError);
        return new Response('fail', { status: 500, headers: corsHeaders });
      }
      console.log(`Alipay Notify: Payment closed/canceled for order ${outTradeNo}.`);
      return new Response('success', { status: 200, headers: corsHeaders });
    }

    return new Response('fail', { status: 400, headers: corsHeaders }); // Unhandled status
  } catch (error: any) {
    console.error('Alipay Notify Handler Error:', error.message);
    return new Response('fail', { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}