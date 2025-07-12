import { AlipaySdk } from '@alipay/mcp-server-alipay';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types'; // Adjust path as needed

// Initialize Supabase client for the backend function
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend operations

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
  // Optional:
  // gateway: process.env.AP_CURRENT_ENV === 'sandbox' ? 'https://openapi.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do',
  // signType: process.env.AP_ENCRYPTION_ALGO || 'RSA2',
});

// Helper to parse URL-encoded body for Vercel Serverless Functions
async function parseBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type');
  if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const result: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }
  return {};
}

export default async function handler(req: Request) {
  // Only allow POST requests from Alipay
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const params = await parseBody(req);
    console.log('Alipay Notify Received:', params);

    // 1. 验签：验证通知的真实性
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.warn('Alipay Notify: Signature verification failed!');
      return new Response('fail', { status: 400 }); // 返回 'fail' 告知支付宝验签失败
    }

    console.log('Alipay Notify: Signature verification successful.');

    // 2. 业务处理：根据交易状态更新订单和用户会员
    const outTradeNo = params.out_trade_no; // 商户订单号
    const tradeStatus = params.trade_status; // 交易状态
    const totalAmount = parseFloat(params.total_amount); // 支付金额
    const tradeNo = params.trade_no; // 支付宝交易号

    if (tradeStatus === 'TRADE_SUCCESS') {
      console.log(`Alipay Notify: Payment SUCCESS for order ${outTradeNo}.`);

      // 2.1. 幂等性处理：检查订单是否已处理
      const { data: existingOrder, error: fetchOrderError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('order_id', outTradeNo)
        .single();

      if (fetchOrderError && fetchOrderError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Supabase: Error fetching existing order:', fetchOrderError);
        return new Response('fail', { status: 500 }); // 数据库查询失败，返回 'fail'
      }

      if (existingOrder && existingOrder.status === 'completed') {
        console.log(`Alipay Notify: Order ${outTradeNo} already completed. Skipping.`);
        return new Response('success', { status: 200 }); // 已处理，直接返回 'success'
      }

      // 2.2. 更新 payment_orders 表状态
      const { data: updatedOrder, error: updateOrderError } = await supabase
        .from('payment_orders')
        .update({
          status: 'completed',
          trade_no: tradeNo,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', outTradeNo)
        .select()
        .single();

      if (updateOrderError) {
        console.error('Supabase: Error updating payment order:', updateOrderError);
        return new Response('fail', { status: 500 }); // 数据库更新失败，返回 'fail'
      }

      if (!updatedOrder) {
        console.error(`Supabase: Order ${outTradeNo} not found for update.`);
        return new Response('fail', { status: 404 }); // 订单不存在，返回 'fail'
      }

      // 2.3. 更新用户会员状态 (profiles 表)
      const userId = updatedOrder.user_id;
      const orderType = updatedOrder.order_type; // 'annual' or 'lifetime'

      let membershipExpiresAt: string | null = null;
      if (orderType === 'annual') {
        membershipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }
      // 'lifetime' remains null for expiry date

      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          membership_type: orderType,
          membership_expires_at: membershipExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateProfileError) {
        console.error('Supabase: Error updating user profile membership:', updateProfileError);
        return new Response('fail', { status: 500 }); // 数据库更新失败，返回 'fail'
      }

      console.log(`Alipay Notify: User ${userId} membership updated to ${orderType}.`);

    } else if (tradeStatus === 'TRADE_CLOSED' || tradeStatus === 'TRADE_FINISHED') {
      // 处理交易关闭或交易完成（退款等）的逻辑，根据您的业务需求
      console.log(`Alipay Notify: Order ${outTradeNo} status is ${tradeStatus}.`);
      // 您可能需要更新 payment_orders 表的状态为 'closed' 或 'refunded'
    }

    // 3. 返回 'success' 告知支付宝处理成功
    return new Response('success', { status: 200 });

  } catch (error: any) {
    console.error('Alipay Notify Handler Error:', error.message);
    return new Response('fail', { status: 500 }); // 任何未捕获的错误都返回 'fail'
  }
}