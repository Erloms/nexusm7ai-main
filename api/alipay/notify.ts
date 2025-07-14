import { AlipaySdk } from '@alipay/mcp-server-alipay';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types'; // Adjust path as needed

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
  privateKey: process.env.AP_APP_KEY!,
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
    const outTradeNo = params.out_trade_no;
    const tradeNo = params.trade_no; // Alipay's transaction ID

    if (!outTradeNo) {
      console.error('Alipay Notify: Missing out_trade_no in notification.');
      return new Response('fail', { status: 400, headers: corsHeaders });
    }

    // Fetch the order from Supabase
    const { data: order, error: fetchOrderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', outTradeNo)
      .single();

    if (fetchOrderError || !order) {
      console.error('Alipay Notify: Order not found in DB or fetch error:', fetchOrderError);
      return new Response('fail', { status: 404, headers: corsHeaders });
    }

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // Update order status to completed
      const { error: updateOrderError } = await supabase
        .from('payment_orders')
        .update({
          status: 'completed',
          trade_no: tradeNo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateOrderError) {
        console.error('Alipay Notify: Error updating order status to completed:', updateOrderError);
        return new Response('fail', { status: 500, headers: corsHeaders });
      }

      // Update user's membership status
      const newMembershipType = order.order_type;
      let membershipExpiresAt: string | null = null; // Initialize as null

      if (newMembershipType === 'annual') {
        // Extend by one year from now
        const newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        membershipExpiresAt = newExpiry.toISOString();
      } else if (newMembershipType === 'lifetime') {
        membershipExpiresAt = null; // Lifetime has no expiry date
      }

      const { error: updateUserError } = await supabase
        .from('profiles')
        .update({
          membership_type: newMembershipType,
          membership_expires_at: membershipExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.user_id);

      if (updateUserError) {
        console.error('Alipay Notify: Error updating user membership:', updateUserError);
        return new Response('fail', { status: 500, headers: corsHeaders });
      }

      console.log(`Alipay Notify: Payment successful for order ${outTradeNo}. User ${order.user_id} updated to ${newMembershipType}.`);
      return new Response('success', { status: 200, headers: corsHeaders }); // Alipay expects 'success' on successful processing
    } else if (tradeStatus === 'TRADE_CLOSED' || tradeStatus === 'TRADE_CANCELED') {
      // Update order status to failed/closed
      const { error: updateOrderError } = await supabase
        .from('payment_orders')
        .update({
          status: 'failed', // Or 'closed'
          trade_no: tradeNo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateOrderError) {
        console.error('Alipay Notify: Error updating order status to failed/closed:', updateOrderError);
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