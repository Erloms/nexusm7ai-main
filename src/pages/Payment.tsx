import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Import useSearchParams
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Changed import path to use custom hook
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { CheckCircle, Crown, Sparkles, Star, Zap, Users, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { Database, Json } from '@/integrations/supabase/types'; // Import Database and Json types

// Define types for MembershipPlan and Order based on Supabase schema using direct access
type MembershipPlan = Database['public']['Tables']['membership_plans']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

const Payment = () => {
  const { user, isAuthenticated, checkPaymentStatus } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook to read URL parameters

  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null); // Use plan ID
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState<string | null>(null); // For QR code if precreate is used
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null); // This is the `order_number` from our DB
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle'); // Track payment status

  // Fetch membership plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true }); // Order by price for display

      if (error) {
        console.error('Error fetching membership plans:', error);
        toast({
          title: "加载套餐失败",
          description: "无法获取会员套餐信息，请稍后再试。",
          variant: "destructive",
        });
      } else {
        setMembershipPlans(data || []);
        // Optionally pre-select the cheapest or a specific plan
        if (data && data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      }
    };
    fetchPlans();
  }, [toast]);

  // Handle return from Alipay (after payment) - this is for page.pay, might not be strictly needed for precreate
  useEffect(() => {
    const tradeStatus = searchParams.get('trade_status');
    const outTradeNo = searchParams.get('out_trade_no');

    if (tradeStatus === 'TRADE_SUCCESS' && outTradeNo) {
      toast({
        title: "支付成功",
        description: "您的会员已开通，请稍候刷新页面或前往仪表板查看。",
        variant: "success",
        duration: 5000,
      });
      setPaymentStatus('completed');
      setCurrentOrderId(outTradeNo);
      // Clear search params to prevent re-triggering on refresh
      navigate('/payment', { replace: true });
    } else if (tradeStatus === 'TRADE_CLOSED' || tradeStatus === 'TRADE_FINISHED') {
      toast({
        title: "支付已关闭或完成",
        description: "您的支付交易已关闭或已完成。",
        variant: "info",
        duration: 5000,
      });
      setPaymentStatus('failed');
      navigate('/payment', { replace: true });
    } else if (searchParams.size > 0) { // If there are any params, but not a success/closed status
      toast({
        title: "支付未完成",
        description: "支付可能未成功，请检查您的支付宝账户或重试。",
        variant: "destructive",
        duration: 5000,
      });
      setPaymentStatus('failed');
      navigate('/payment', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  // Polling for payment status if an order was initiated
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (currentOrderId && paymentStatus === 'pending') {
      interval = setInterval(async () => {
        const { data, error } = await supabase
          .from('orders') // Query the new 'orders' table
          .select('status')
          .eq('order_number', currentOrderId) // Use order_number
          .single();

        if (error) {
          console.error('Error polling payment status:', error);
          // Don't stop polling on error, might be transient
        } else if (data && data.status === 'paid') { // Check for 'paid' status
          setPaymentStatus('completed');
          toast({
            title: "支付成功",
            description: "您的会员已开通！",
            variant: "success",
            duration: 5000,
          });
          if (interval) clearInterval(interval);
          setShowPaymentModal(false); // Close modal on success
          navigate('/dashboard'); // Redirect to dashboard
        } else if (data && (data.status === 'failed' || data.status === 'cancelled')) { // Check for 'failed' or 'cancelled'
          setPaymentStatus('failed');
          toast({
            title: "支付失败",
            description: "您的支付未能完成，请重试。",
            variant: "destructive",
            duration: 5000,
          });
          if (interval) clearInterval(interval);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentOrderId, paymentStatus, toast, navigate]);


  const handleInitiatePayment = async (planId: string) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "请先登录",
        description: "购买会员需要先登录您的账号",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    const selectedPlan = membershipPlans.find(p => p.id === planId);
    if (!selectedPlan) {
      toast({
        title: "套餐错误",
        description: "未找到选定的会员套餐。",
        variant: "destructive"
      });
      return;
    }

    setSelectedPlanId(planId); // Set selectedPlanId here for modal display
    setIsInitiatingPayment(true);
    setPaymentQrCodeUrl(null);
    setPaymentStatus('pending');
    setShowPaymentModal(true); // Show modal immediately

    try {
      // Call the generate_order_number function from Supabase
      const { data: orderNumberData, error: orderNumberError } = await supabase.rpc('generate_order_number');
      if (orderNumberError) {
        console.error('Error generating order number:', orderNumberError);
        throw new Error(`Failed to generate order number: ${orderNumberError.message}`);
      }
      const generatedOrderNumber = generatedOrderData;

      const response = await fetch('/api/alipay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planId: selectedPlan.id, // Pass plan_id
          amount: selectedPlan.price,
          orderNumber: generatedOrderNumber, // Pass generated order number
          subject: `${selectedPlan.name}购买`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Alipay payment');
      }

      setCurrentOrderId(data.orderId); // Store the generated order ID (order_number)

      if (data.qrCodeUrl) {
        setPaymentQrCodeUrl(data.qrCodeUrl);
      } else {
        throw new Error('No Alipay QR code received.');
      }

      toast({
        title: "支付请求已发送",
        description: "请在弹出的页面或扫码完成支付。",
      });

    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "支付发起失败",
        description: error.message || "无法发起支付，请重试。",
        variant: "destructive",
      });
      setPaymentStatus('failed');
      setShowPaymentModal(false); // Close modal on failure
    } finally {
      setIsInitiatingPayment(false);
    }
  };


  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentQrCodeUrl(null);
    setCurrentOrderId(null);
    setPaymentStatus('idle');
  };

  const getPlanPeriod = (durationMonths: number, planName: string) => {
    if (planName === '永久会员' || planName === '代理会员') return '/永久';
    if (durationMonths === 1) return '/月';
    if (durationMonths === 3) return '/季度';
    if (durationMonths === 12) return '/年';
    return '';
  };

  const getPlanSubtitle = (planName: string) => {
    if (planName.includes('年度')) return '高性价比之选';
    if (planName.includes('永久')) return '一次付费，终身享用';
    if (planName.includes('代理')) return '创业合作首选';
    return '解锁无限可能';
  };

  const getPlanFeatures = (features: Json | null) => {
    if (!features || !Array.isArray(features)) return [];
    return features as string[];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#0f1419]">
      <Navigation />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-6">
            选择会员套餐
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            解锁全部AI超能力，开启无限创作之旅
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-gray-300 ml-2">已有1000+用户选择我们</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {membershipPlans.map((plan) => (
            <div key={plan.id} className="relative group cursor-pointer transition-all duration-300 hover:scale-102">
              {plan.name.includes('年度') && ( // Example: Add "推荐" badge for annual plan
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    推荐
                  </div>
                </div>
              )}
              
              <div className={`relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 ${
                plan.name.includes('年度') ? 'border-purple-400 shadow-2xl shadow-purple-500/25' : 'border-gray-700 hover:border-cyan-400/50'
              } rounded-3xl p-6 transition-all duration-300`}>
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <Crown className={`w-5 h-5 ${plan.name.includes('年度') ? 'text-purple-400' : 'text-cyan-400'} mr-2`} />
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-gray-400 mb-4 text-sm">{getPlanSubtitle(plan.name)}</p>
                  
                  <div className="mb-4">
                    <span className={`text-3xl font-bold bg-clip-text text-transparent ${
                      plan.name.includes('年度') ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                    }`}>
                      ¥{plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">{getPlanPeriod(plan.duration_months, plan.name)}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    {plan.duration_months === 12 ? `平均每月仅需 ¥${(plan.price / 12).toFixed(2)}` : ''}
                    {plan.duration_months === 3 ? `平均每月仅需 ¥${(plan.price / 3).toFixed(2)}` : ''}
                    {plan.name === '永久会员' ? `相当于${(plan.price / 99).toFixed(1)}年年费，超值划算` : ''}
                    {plan.name === '代理会员' ? `推广${Math.ceil(plan.price / (plan.price * 0.3))}单即可回本` : ''}
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  {getPlanFeatures(plan.features).map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className={`w-4 h-4 ${plan.name.includes('年度') ? 'text-purple-400' : 'text-cyan-400'} mr-2 flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={() => handleInitiatePayment(plan.id)}
                    disabled={isInitiatingPayment}
                    className={`w-full font-bold py-3 rounded-xl text-sm transition-all duration-300 ${
                      plan.name.includes('年度') ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                    }`}
                  >
                    {isInitiatingPayment && selectedPlanId === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    立即购买
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-3xl p-6 max-w-sm w-full relative text-center">
            <button 
              onClick={handleClosePaymentModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {paymentStatus === 'pending' ? '正在等待支付...' : 
               paymentStatus === 'completed' ? '支付成功！' : 
               '支付失败'}
            </h3>
            
            {paymentStatus === 'pending' && (
              <>
                {paymentQrCodeUrl ? (
                  <>
                    <img src={paymentQrCodeUrl} alt="Alipay QR Code" className="w-48 h-48 mx-auto mb-4 border border-gray-700 rounded-lg" />
                    <p className="text-gray-300 mb-4">请使用支付宝扫码完成支付。</p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-6" />
                    <p className="text-gray-300 mb-4">正在生成支付二维码...</p>
                  </>
                )}
                <p className="text-gray-400 text-sm">订单号: {currentOrderId}</p>
                <p className="text-gray-400 text-sm">金额: ¥{membershipPlans.find(p => p.id === selectedPlanId)?.price.toFixed(2) || '0.00'}</p>
                <p className="text-gray-500 text-xs mt-4">
                  支付完成后，系统将自动为您开通会员。
                </p>
              </>
            )}

            {paymentStatus === 'completed' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <p className="text-green-300 text-lg mb-4">您的会员已成功开通！</p>
                <Button onClick={() => navigate('/dashboard')} className="bg-green-600 hover:bg-green-700">
                  前往仪表板
                </Button>
              </>
            )}

            {paymentStatus === 'failed' && (
              <>
                <X className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <p className="text-red-300 text-lg mb-4">支付未能完成。</p>
                <Button onClick={handleClosePaymentModal} className="bg-red-600 hover:bg-red-700">
                  关闭
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;