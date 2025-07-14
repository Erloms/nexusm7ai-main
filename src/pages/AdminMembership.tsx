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

interface PaymentOrder extends Tables<'payment_orders'> {}
interface UserProfile extends Tables<'profiles'> {}


const AdminMembership = () => {
  const { toast } = useToast();
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // To get user emails for display

  useEffect(() => {
    const fetchData = async () => {
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

        <Tabs defaultValue="orders" className="space-y-6"> {/* Changed default value to 'orders' */}
          <TabsList className="bg-[#1a2740] border-[#203042]/60">
            {/* Removed Alipay config tab */}
            <TabsTrigger value="orders" className="data-[state=active]:bg-cyan-600">订单管理</TabsTrigger>
          </TabsList>

          {/* Removed TabsContent for alipay */}

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