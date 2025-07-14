import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Import useSearchParams
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Changed import path to use custom hook
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { CheckCircle, Crown, Sparkles, Star, Zap, Users, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client

const Payment = () => {
  const { user, isAuthenticated, checkPaymentStatus } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook to read URL parameters

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'lifetime' | 'agent'>('annual');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState<string | null>(null); // For QR code if precreate is used
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle'); // Track payment status

  const planDetails = {
    annual: { 
      price: '99', 
      period: '/年', 
      total: 99,
      description: '年会员套餐',
      subtitle: '高性价比之选',
      features: [
        '20+顶尖AI大模型，无限次对话',
        'Flux全家桶，无限次图像生成',
        '无限次语音合成',
        '所有功能一年内免费使用',
        '专属会员身份标识'
      ]
    },
    lifetime: { 
      price: '399', 
      period: '/永久', 
      total: 399,
      description: '永久会员套餐',
      subtitle: '一次付费，终身享用',
      features: [
        '包含所有年会员功能',
        '永久免费使用所有AI功能',
        '专属VIP身份标识',
        '无限制访问新功能',
        '永久免费功能更新'
      ]
    },
    agent: { 
      price: '1999', 
      period: '/代理', 
      total: 1999,
      description: '创业合作首选',
      subtitle: '创业合作首选',
      features: [
        '包含所有永久会员功能',
        '30%推广收益分成',
        '专属代理商后台',
        '营销素材支持',
        '自动分成系统'
      ]
    }
  };

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
          .from('payment_orders')
          .select('status')
          .eq('order_id', currentOrderId)
          .single();

        if (error) {
          console.error('Error polling payment status:', error);
          // Don't stop polling on error, might be transient
        } else if (data && data.status === 'completed') {
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
        } else if (data && (data.status === 'failed' || data.status === 'closed')) {
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


  const handleInitiatePayment = async (plan: 'annual' | 'lifetime' | 'agent') => {
    toast({
      title: "支付功能暂不可用",
      description: "支付宝集成正在维护中，请稍后再试或联系管理员手动开通。",
      variant: "destructive"
    });
    // Disable actual payment initiation for now
    // setIsInitiatingPayment(true);
    // setPaymentQrCodeUrl(null);
    // setPaymentStatus('pending');
    // setShowPaymentModal(true); // Show modal immediately

    // try {
    //   const response = await fetch('/api/alipay/create-order', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       userId: user.id,
    //       amount: planDetails[plan].total,
    //       orderType: plan,
    //       subject: `${planDetails[plan].description}购买`,
    //     }),
    //   });

    //   const data = await response.json();

    //   if (!response.ok) {
    //     throw new Error(data.error || 'Failed to initiate Alipay payment');
    //   }

    //   setCurrentOrderId(data.orderId); // Store the generated order ID

    //   if (data.qrCodeUrl) {
    //     setPaymentQrCodeUrl(data.qrCodeUrl);
    //   } else {
    //     throw new Error('No Alipay QR code received.');
    //   }

    //   toast({
    //     title: "支付请求已发送",
    //     description: "请在弹出的页面或扫码完成支付。",
    //   });

    // } catch (error: any) {
    //   console.error('Error initiating payment:', error);
    //   toast({
    //     title: "支付发起失败",
    //     description: error.message || "无法发起支付，请重试。",
    //     variant: "destructive",
    //   });
    //   setPaymentStatus('failed');
    //   setShowPaymentModal(false); // Close modal on failure
    // } finally {
    //   setIsInitiatingPayment(false);
    // }
  };


  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentQrCodeUrl(null);
    setCurrentOrderId(null);
    setPaymentStatus('idle');
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
          {/* Annual Plan */}
          <div className="relative group cursor-pointer transition-all duration-300 hover:scale-102">
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-gray-700 hover:border-cyan-400/50 rounded-3xl p-6 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="w-5 h-5 text-cyan-400 mr-2" />
                  <h3 className="text-lg font-bold text-white">{planDetails.annual.description}</h3>
                </div>
                <p className="text-gray-400 mb-4 text-sm">{planDetails.annual.subtitle}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    ¥{planDetails.annual.price}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">/年</span>
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  平均每月仅需 ¥8.25
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {planDetails.annual.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => handleInitiatePayment('annual')}
                  disabled={true}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300 opacity-50 cursor-not-allowed"
                >
                  {isInitiatingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  立即购买 (暂不可用)
                </Button>
              </div>
            </div>
          </div>

          {/* Lifetime Plan */}
          <div className="relative group cursor-pointer transition-all duration-300 hover:scale-102">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                推荐
              </div>
            </div>
            
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-purple-400 rounded-3xl p-6 transition-all duration-300 shadow-2xl shadow-purple-500/25">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="w-5 h-5 text-purple-400 mr-2" />
                  <h3 className="text-lg font-bold text-white">{planDetails.lifetime.description}</h3>
                </div>
                <p className="text-gray-400 mb-4 text-sm">{planDetails.lifetime.subtitle}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    ¥{planDetails.lifetime.price}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">/永久</span>
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  相当于4年年费，超值划算
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {planDetails.lifetime.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => handleInitiatePayment('lifetime')}
                  disabled={true}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300 opacity-50 cursor-not-allowed"
                >
                  {isInitiatingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  立即购买 (暂不可用)
                </Button>
              </div>
            </div>
          </div>

          {/* Agent Plan */}
          <div className="relative group cursor-pointer transition-all duration-300 hover:scale-102">
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-gray-700 hover:border-orange-400/50 rounded-3xl p-6 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-orange-400 mr-2" />
                  <h3 className="text-lg font-bold text-white">{planDetails.agent.description}</h3>
                </div>
                <p className="text-gray-400 mb-4 text-sm">{planDetails.agent.subtitle}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                    ¥{planDetails.agent.price}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">/代理</span>
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  推广3-4单即可回本
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {planDetails.agent.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => handleInitiatePayment('agent')}
                  disabled={true}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300 opacity-50 cursor-not-allowed"
                >
                  {isInitiatingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  立即购买 (暂不可用)
                </Button>
              </div>
            </div>
          </div>
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
                <p className="text-gray-400 text-sm">金额: ¥{planDetails[selectedPlan].total}</p>
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