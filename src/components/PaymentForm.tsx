import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PaymentFormProps {
  selectedPlan: 'annual' | 'lifetime' | 'agent';
  planAmount: number;
  onPaymentSubmitted: () => void; // Callback to notify parent
}

const PaymentForm: React.FC<PaymentFormProps> = ({ selectedPlan, planAmount, onPaymentSubmitted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber || !contactInfo) {
      toast({
        title: "信息不完整",
        description: "请填写所有必填信息",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "未登录",
        description: "请先登录才能提交支付信息",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .insert({
          user_id: user.id,
          amount: planAmount,
          order_id: orderNumber, // Using orderNumber as order_id
          order_type: selectedPlan,
          status: 'pending',
          subject: `${selectedPlan === 'annual' ? '年会员' : selectedPlan === 'lifetime' ? '永久会员' : '代理'}购买`,
          body: `联系方式: ${contactInfo}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting payment order:', error);
        toast({
          title: "提交失败",
          description: `支付信息提交失败: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "支付申请已提交",
        description: "管理员将在24小时内处理您的支付请求",
      });
      
      setOrderNumber('');
      setContactInfo('');
      onPaymentSubmitted(); // Notify parent component
    } catch (error: any) {
      console.error('Unexpected error submitting payment:', error);
      toast({
        title: "提交失败",
        description: error.message || "发生未知错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label htmlFor="orderNumber" className="block text-sm font-medium text-white mb-2">
          支付订单号
        </label>
        <Input
          id="orderNumber"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50"
          placeholder="请输入您的支付订单号"
          required
        />
      </div>
      
      <div>
        <label htmlFor="contactInfo" className="block text-sm font-medium text-white mb-2">
          联系方式（电话/邮箱）
        </label>
        <Input
          id="contactInfo"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className="bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50"
          placeholder="请输入您的联系方式，以便我们与您联系"
          required
        />
      </div>
      
      <Button 
        type="submit"
        className="w-full bg-nexus-blue hover:bg-nexus-blue/80 text-white py-6"
        disabled={isSubmitting}
      >
        {isSubmitting ? "提交中..." : "提交支付信息"}
      </Button>
      
      <p className="text-xs text-white/60 text-center">
        提交订单号后，我们会在24小时内处理您的支付并开通会员。
      </p>
    </form>
  );
};

export default PaymentForm;