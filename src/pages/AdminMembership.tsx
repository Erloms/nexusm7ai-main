import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added this import
import { Save, Settings, Users, CreditCard, QrCode } from 'lucide-react';
import Navigation from "@/components/Navigation";
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

interface AlipayConfig {
  appId: string;
  appKey: string;
  publicKey: string;
  returnUrl: string;
  notifyUrl: string;
  environment: 'prod' | 'sandbox';
}

interface PaymentOrder extends Tables<'payment_orders'> {}
interface UserProfile extends Tables<'profiles'> {}


const AdminMembership = () => {
  const { toast } = useToast();
  const [alipayConfig, setAlipayConfig] = useState<AlipayConfig>({
    appId: '',
    appKey: '',
    publicKey: '',
    returnUrl: 'https://nexus.m7ai.top/payment-success', // Updated
    notifyUrl: 'https://nexus.m7ai.top/api/alipay/notify', // Updated
    environment: 'prod'
  });
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // To get user emails for display

  useEffect(() => {
    const fetchData = async () => {
      // Load Alipay config (still local)
      const savedConfig = localStorage.getItem('nexusAi_alipay_config');
      if (savedConfig) {
        setAlipayConfig(JSON.parse(savedConfig));
      }

      // Load payment orders from Supabase
      const { data: ordersData, error: ordersError } = await supabase
        .from('payment_orders')
        .select('*');
      if (ordersError) {
        console.error('Error fetching payment orders:', ordersError);
        toast({ title: "错误", description: "无法加载支付订单", variant: "destructive" });
      } else {
        setPaymentOrders(ordersData || []);
      }

      // Load users from Supabase to get email/username for orders
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*'); // Changed from select('id, email, username') to select('*')
      if (usersError) {
        console.error('Error fetching users for orders:', usersError);
      } else {
        setUsers(usersData || []);
      }
    };
    fetchData();
  }, []);

  const handleSaveAlipayConfig = () => {
    localStorage.setItem('nexusAi_alipay_config', JSON.stringify(alipayConfig));
    toast({
      title: "配置保存成功",
      description: "支付宝配置已保存",
    });
  };

  const handleConfigChange = (field: keyof AlipayConfig, value: string) => {
    setAlipayConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const approvePayment = async (orderId: string) => {
    const order = paymentOrders.find(o => o.id === orderId);
    if (!order) return;

    // Update order status in Supabase
    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('payment_orders')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (orderUpdateError) {
      console.error('Error updating payment order status:', orderUpdateError);
      toast({ title: "错误", description: "更新订单状态失败", variant: "destructive" });
      return;
    }
    setPaymentOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    // Update user membership in Supabase
    const expiryDate = order.order_type === 'annual'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null; // Lifetime has no expiry

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        membership_type: order.order_type,
        membership_expires_at: expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.user_id)
      .select()
      .single();

    if (profileUpdateError) {
      console.error('Error updating user membership after payment:', profileUpdateError);
      toast({ title: "错误", description: "更新用户会员状态失败", variant: "destructive" });
      return;
    }

    toast({
      title: "支付已确认",
      description: `已为用户 ${users.find(u => u.id === order.user_id)?.username || order.user_id.slice(0,8)} 开通会员权限`,
    });
  };

  const stats = {
    totalOrders: paymentOrders.length,
    pendingOrders: paymentOrders.filter(o => o.status === 'pending').length,
    completedOrders: paymentOrders.filter(o => o.status === 'completed').length,
    totalRevenue: paymentOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151A25] via-[#181f33] to-[#10141e]">
      <Navigation />
      <div className="container mx-auto px-6 py-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">会员管理后台</h1>
          <p className="text-gray-400">支付配置与订单管理</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1a2740] border-[#203042]/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">总订单数</CardTitle>
              <CreditCard className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2740] border-[#203042]/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">待处理订单</CardTitle>
              <QrCode className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2740] border-[#203042]/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">已完成订单</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.completedOrders}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a2740] border-[#203042]/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">总收入</CardTitle>
              <Settings className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">¥{stats.totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="alipay" className="space-y-6">
          <TabsList className="bg-[#1a2740] border-[#203042]/60">
            <TabsTrigger value="alipay" className="data-[state=active]:bg-cyan-600">支付宝配置</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-cyan-600">订单管理</TabsTrigger>
          </TabsList>

          <TabsContent value="alipay" className="space-y-6">
            <Card className="bg-[#1a2740] border-[#203042]/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  支付宝配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="appId" className="text-white">应用ID (APPID)</Label>
                      <Input
                        id="appId"
                        value={alipayConfig.appId}
                        onChange={(e) => handleConfigChange('appId', e.target.value)}
                        placeholder="支付宝开放平台应用ID"
                        className="bg-[#14202c] border-[#2e4258] text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="returnUrl" className="text-white">同步返回地址</Label>
                      <Input
                        id="returnUrl"
                        value={alipayConfig.returnUrl}
                        onChange={(e) => handleConfigChange('returnUrl', e.target.value)}
                        placeholder="https://your-domain.com/success"
                        className="bg-[#14202c] border-[#2e4258] text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notifyUrl" className="text-white">异步通知地址</Label>
                      <Input
                        id="notifyUrl"
                        value={alipayConfig.notifyUrl}
                        onChange={(e) => handleConfigChange('notifyUrl', e.target.value)}
                        placeholder="https://your-server.com/notify"
                        className="bg-[#14202c] border-[#2e4258] text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="environment" className="text-white">环境</Label>
                      <Select value={alipayConfig.environment} onValueChange={(value: 'prod' | 'sandbox') => handleConfigChange('environment', value)}>
                        <SelectTrigger className="bg-[#14202c] border-[#2e4258] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prod">生产环境</SelectItem>
                          <SelectItem value="sandbox">沙箱环境</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="appKey" className="text-white">应用私钥</Label>
                      <Textarea
                        id="appKey"
                        value={alipayConfig.appKey}
                        onChange={(e) => handleConfigChange('appKey', e.target.value)}
                        placeholder="MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
                        className="bg-[#14202c] border-[#2e4258] text-white min-h-[120px]"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="publicKey" className="text-white">支付宝公钥</Label>
                      <Textarea
                        id="publicKey"
                        value={alipayConfig.publicKey}
                        onChange={(e) => handleConfigChange('publicKey', e.target.value)}
                        placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
                        className="bg-[#14202c] border-[#2e4258] text-white min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={handleSaveAlipayConfig} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    保存配置
                  </Button>
                </div>
                
                <div className="border-t border-[#203042]/60 pt-4">
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">配置说明</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>
                      请先在支付宝开放平台创建应用并获取相关密钥信息。详细配置步骤请参考：
                    </p>
                    <a 
                      href="https://opendocs.alipay.com/open/0go80l" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      支付宝开放平台 MCP 服务文档
                    </a>
                    <p className="mt-4">
                      <strong>重要提示：</strong>请妥善保管应用私钥，不要泄露给他人。配置完成后即可启用支付宝支付功能。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-[#1a2740] border-[#203042]/60">
              <CardHeader>
                <CardTitle className="text-white">支付订单管理</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#203042]/60">
                        <th className="text-left py-3 px-4 text-white font-medium">订单ID</th>
                        <th className="text-left py-3 px-4 text-white font-medium">用户ID</th>
                        <th className="text-left py-3 px-4 text-white font-medium">套餐</th>
                        <th className="text-left py-3 px-4 text-white font-medium">金额</th>
                        <th className="text-left py-3 px-4 text-white font-medium">状态</th>
                        <th className="text-left py-3 px-4 text-white font-medium">时间</th>
                        <th className="text-left py-3 px-4 text-white font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentOrders.map(order => (
                        <tr key={order.id} className="border-b border-[#203042]/30">
                          <td className="py-3 px-4 text-white">{order.id.slice(-8)}</td>
                          <td className="py-3 px-4 text-white">{order.user_id.slice(-8)}</td>
                          <td className="py-3 px-4 text-white">
                            {order.order_type === 'annual' ? '年会员' : '永久会员'}
                          </td>
                          <td className="py-3 px-4 text-white">¥{order.amount}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'completed' ? 'bg-green-600 text-white' :
                              order.status === 'pending' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {order.status === 'completed' ? '已完成' :
                               order.status === 'pending' ? '待处理' : '失败'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">
                            {new Date(order.created_at!).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => approvePayment(order.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                确认支付
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminMembership;