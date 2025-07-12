import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { CheckCircle, Crown, Sparkles, Star, Zap, Users, X } from 'lucide-react';
import PaymentForm from '@/components/PaymentForm'; // Import the new PaymentForm component

const Payment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'lifetime' | 'agent'>('annual');
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Renamed to avoid conflict
  const [showPaymentForm, setShowPaymentForm] = useState(false); // New state to show form

  const planDetails = {
    annual: { 
      price: '99', 
      period: '/年', 
      total: 99, // Changed to number
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
      total: 399, // Changed to number
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
      total: 1999, // Changed to number
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

  const handlePurchase = (plan: 'annual' | 'lifetime' | 'agent') => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "购买会员需要先登录您的账号",
        variant: "destructive"
      });
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setShowPaymentForm(false); // Also close form if modal is closed
  };

  const handlePaymentSubmitted = () => {
    setShowPaymentModal(false);
    setShowPaymentForm(false);
    // Optionally navigate user or show a success message
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
                  onClick={() => handlePurchase('annual')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  立即购买
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
                  onClick={() => handlePurchase('lifetime')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  立即购买
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
                  onClick={() => handlePurchase('agent')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  立即购买
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-3xl p-6 max-w-sm w-full relative">
            <button 
              onClick={handleClosePaymentModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-4">扫码支付</h3>
              
              {/* Payment QR Code */}
              <div className="bg-white rounded-xl p-3 mb-4 flex justify-center w-32 h-32 mx-auto">
                <img 
                  src="/lovable-uploads/微信图片_20250711153714.jpg" 
                  alt="支付宝支付二维码" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mb-4">
                <div className="text-sm font-bold text-white mb-1">
                  ¥{planDetails[selectedPlan].total}
                </div>
                <div className="text-gray-400 text-xs">{planDetails[selectedPlan].description}</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-xs mb-4">
                支付宝扫码支付，请完成支付后填写订单信息
              </p>
              <Button 
                onClick={() => setShowPaymentForm(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300"
              >
                我已支付，填写订单信息
              </Button>
            </div>

            {showPaymentForm && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <PaymentForm 
                  selectedPlan={selectedPlan} 
                  planAmount={planDetails[selectedPlan].total}
                  onPaymentSubmitted={handlePaymentSubmitted}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;