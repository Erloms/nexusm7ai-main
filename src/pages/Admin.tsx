import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, CreditCard, Settings, UserCheck, UserPlus, LayoutDashboard, Menu } from 'lucide-react';
import Navigation from "@/components/Navigation";
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Define types based on Supabase tables
interface UserProfile extends Tables<'profiles'> {}
interface PaymentOrder extends Tables<'payment_orders'> {}

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Manual activation form
  const [activationIdentifier, setActivationIdentifier] = useState('');
  const [activationPlan, setActivationPlan] = useState<'annual' | 'lifetime'>('annual');
  
  // Alipay config (still local for now, as per previous discussion)
  const [alipayConfig, setAlipayConfig] = useState({
    appId: '',
    appKey: '',
    publicKey: '',
    returnUrl: '',
    notifyUrl: '',
    encryptionAlgo: 'RSA2',
    environment: 'prod' as 'prod' | 'sandbox'
  });

  useEffect(() => {
    const fetchUsersAndOrders = async () => {
      // Fetch users from Supabase
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast({ title: "错误", description: "无法加载用户数据", variant: "destructive" });
      } else {
        setUsers(usersData || []);
      }

      // Fetch payment orders from Supabase
      const { data: ordersData, error: ordersError } = await supabase
        .from('payment_orders')
        .select('*');
      if (ordersError) {
        console.error('Error fetching payment orders:', ordersError);
        toast({ title: "错误", description: "无法加载支付订单", variant: "destructive" });
      } else {
        setPaymentOrders(ordersData || []);
      }

      // Load Alipay config from localStorage (still local)
      const savedAlipayConfig = localStorage.getItem('nexusAi_alipay_config');
      if (savedAlipayConfig) {
        setAlipayConfig(JSON.parse(savedAlipayConfig));
      }
    };

    fetchUsersAndOrders();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualActivation = async () => {
    if (!activationIdentifier) {
      toast({
        title: "错误",
        description: "请输入用户邮箱、账号或手机号",
        variant: "destructive"
      });
      return;
    }

    let targetUser: UserProfile | undefined;
    // Try to find user by email, username, or ID
    targetUser = users.find(user =>
      user.email === activationIdentifier ||
      user.username === activationIdentifier ||
      user.id === activationIdentifier
    );

    let userIdToUpdate = targetUser?.id;
    let userEmailToUpdate = targetUser?.email;
    let userNameToUpdate = targetUser?.username;

    if (!targetUser) {
      // If user doesn't exist, create a new one in auth and profiles
      const isEmail = activationIdentifier.includes('@');
      const isPhone = /^1[3-9]\d{9}$/.test(activationIdentifier); // Simple phone validation

      const newEmail = isEmail ? activationIdentifier : `${activationIdentifier}@system.generated`;
      const newUsername = isEmail ? activationIdentifier.split('@')[0] : activationIdentifier;
      const tempPassword = Math.random().toString(36).slice(-8); // Generate a temporary password

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: tempPassword,
        options: {
          data: {
            username: newUsername,
          },
        },
      });

      if (authError) {
        toast({
          title: "错误",
          description: `创建新用户失败: ${authError.message}`,
          variant: "destructive"
        });
        return;
      }
      userIdToUpdate = authData.user?.id;
      userEmailToUpdate = authData.user?.email;
      userNameToUpdate = newUsername;

      // Also create profile entry for the new user
      const { data: newProfileData, error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userIdToUpdate!,
          email: userEmailToUpdate!,
          username: userNameToUpdate!,
          membership_type: 'free',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newProfileError) {
        console.error('Error creating new profile:', newProfileError);
        toast({
          title: "错误",
          description: `创建用户档案失败: ${newProfileError.message}`,
          variant: "destructive"
        });
        return;
      }
      targetUser = newProfileData; // Use the newly created profile
    }

    // Update membership in profiles table
    const expiryDate = activationPlan === 'annual'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null; // Lifetime has no expiry

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        membership_type: activationPlan,
        membership_expires_at: expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userIdToUpdate!)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user membership:', updateError);
      toast({
        title: "错误",
        description: `更新会员状态失败: ${updateError.message}`,
        variant: "destructive"
      });
      return;
    }

    setUsers(prevUsers => prevUsers.map(u => u.id === updatedProfile.id ? updatedProfile : u));
    setActivationIdentifier('');

    toast({
      title: "成功",
      description: `已为 ${userNameToUpdate || userEmailToUpdate} 开通${activationPlan === 'annual' ? '年' : '永久'}会员`,
    });
  };

  const handleSaveAlipayConfig = () => {
    localStorage.setItem('nexusAi_alipay_config', JSON.stringify(alipayConfig));
    toast({
      title: "配置保存成功",
      description: "支付宝配置已保存，支付功能已启用",
    });
  };

  const handleAlipayConfigChange = (field: string, value: string) => {
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
      : null;

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
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedProfile.id ? updatedProfile : u));

    toast({
      title: "支付已确认",
      description: `已为用户 ${updatedProfile.username || updatedProfile.email} 开通会员权限`,
    });
  };

  const stats = {
    totalUsers: users.length,
    paidUsers: users.filter(u => u.membership_type !== 'free').length,
    pendingPayments: paymentOrders.filter(o => o.status === 'pending').length,
    totalRevenue: paymentOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151A25] via-[#181f33] to-[#10141e]">
      <Navigation />
      <div className="flex">
        {/* 左侧仪表板导航 */}
        <div className="w-64 bg-[#1a2740] border-r border-[#203042]/60 min-h-screen pt-20">
          <div className="p-4">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              管理面板
            </h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#203042]/60'
                }`}
              >
                <LayoutDashboard className="inline mr-2 h-4 w-4" />
                概览
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'users' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#203042]/60'
                }`}
              >
                <Users className="inline mr-2 h-4 w-4" />
                用户管理
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'payments' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#203042]/60'
                }`}
              >
                <CreditCard className="inline mr-2 h-4 w-4" />
                支付管理
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'manual' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#203042]/60'
                }`}
              >
                <UserPlus className="inline mr-2 h-4 w-4" />
                手动开通
              </button>
              <button
                onClick={() => setActiveTab('alipay')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'alipay' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#203042]/60'
                }`}
              >
                <Settings className="inline mr-2 h-4 w-4" />
                支付宝配置
              </button>
            </nav>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 p-6 pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">管理员后台</h1>
            <p className="text-gray-400">用户管理、支付处理与系统配置</p>
          </div>

          {/* 仪表板概览 */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-[#1a2740] border-[#203042]/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">总用户数</CardTitle>
                    <Users className="h-4 w-4 text-cyan-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1a2740] border-[#203042]/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">付费用户</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.paidUsers}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1a2740] border-[#203042]/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">待处理支付</CardTitle>
                    <CreditCard className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.pendingPayments}</div>
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
            </div>
          )}

          {/* 用户管理 */}
          {activeTab === 'users' && (
            <Card className="bg-[#1a2740] border-[#203042]/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  用户列表
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#14202c] border-[#2e4258] text-white max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#203042]/60">
                        <th className="text-left py-3 px-4 text-white font-medium">邮箱</th>
                        <th className="text-left py-3 px-4 text-white font-medium">姓名</th>
                        <th className="text-left py-3 px-4 text-white font-medium">会员类型</th>
                        <th className="text-left py-3 px-4 text-white font-medium">到期时间</th>
                        <th className="text-left py-3 px-4 text-white font-medium">加入时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-[#203042]/30">
                          <td className="py-3 px-4 text-white">{user.email}</td>
                          <td className="py-3 px-4 text-white">{user.username}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.membership_type === 'lifetime' ? 'bg-purple-600 text-white' :
                              user.membership_type === 'annual' ? 'bg-blue-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {user.membership_type === 'lifetime' ? '永久会员' :
                               user.membership_type === 'annual' ? '年会员' : '免费用户'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">
                            {user.membership_expires_at 
                              ? new Date(user.membership_expires_at).toLocaleDateString()
                              : user.membership_type === 'lifetime' ? '永久' : '-'
                            }
                          </td>
                          <td className="py-3 px-4 text-white">
                            {new Date(user.created_at!).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 支付管理 */}
          {activeTab === 'payments' && (
            <Card className="bg-[#1a2740] border-[#203042]/60">
              <CardHeader>
                <CardTitle className="text-white">支付订单管理</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#203042]/60">
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
                          <td className="py-3 px-4 text-white">{order.user_id.slice(0, 8)}...</td>
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
                            {new Date(order.created_at!).toLocaleDateString()}
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
          )}

          {/* 手动开通 */}
          {activeTab === 'manual' && (
            <Card className="bg-[#1a2740] border-[#203042]/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserPlus className="mr-2 h-5 w-5" />
                  手动开通会员
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="activationIdentifier" className="text-white">用户标识</Label>
                      <Input
                        id="activationIdentifier"
                        value={activationIdentifier}
                        onChange={(e) => setActivationIdentifier(e.target.value)}
                        placeholder="输入邮箱、账号或手机号"
                        className="bg-[#14202c] border-[#2e4258] text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        支持邮箱地址、用户账号或手机号码
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="activationPlan" className="text-white">会员类型</Label>
                      <Select value={activationPlan} onValueChange={(value: 'annual' | 'lifetime') => setActivationPlan(value)}>
                        <SelectTrigger className="bg-[#14202c] border-[#2e4258] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">年会员 (¥99)</SelectItem>
                          <SelectItem value="lifetime">永久会员 (¥399)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <Button 
                      onClick={handleManualActivation}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      立即开通
                    </Button>
                  </div>
                </div>
                
                <div className="border-t border-[#203042]/60 pt-4">
                  <p className="text-gray-400 text-sm">
                    提示：支持邮箱、账号或手机号开通。如果用户不存在，系统将自动创建新用户并开通对应会员权限。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 支付宝配置 */}
          {activeTab === 'alipay' && (
            <Card className="bg-[#1a2740] border-[#203042]/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  支付宝MCP配置
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
                        onChange={(e) => handleAlipayConfigChange('appId', e.target.value)}
                        placeholder="支付宝开放平台应用ID"
                        className="bg-[#14202c] border-[#2e4258] text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="returnUrl" className="text-white">同步返回地址</Label>
                      <Input
                        id="returnUrl"
                        value={alipayConfig.returnUrl}
                        onChange={(e) => handleAlipayConfigChange('returnUrl', e.target.value)}
                        placeholder="https://your-domain.com/success"
                        className="bg-[#14202c] border-[#2e4258] text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notifyUrl" className="text-white">异步通知地址</Label>
                      <Input
                        id="notifyUrl"
                        value={alipayConfig.notifyUrl}
                        onChange={(e) => handleAlipayConfigChange('notifyUrl', e.target.value)}
                        placeholder="https://your-server.com/notify"
                        className="bg-[#14202c] border-[#2e4258] text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="environment" className="text-white">环境</Label>
                      <Select value={alipayConfig.environment} onValueChange={(value: 'prod' | 'sandbox') => handleAlipayConfigChange('environment', value)}>
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
                        onChange={(e) => handleAlipayConfigChange('appKey', e.target.value)}
                        placeholder="MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
                        className="bg-[#14202c] border-[#2e4258] text-white min-h-[120px]"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="publicKey" className="text-white">支付宝公钥</Label>
                      <Textarea
                        id="publicKey"
                        value={alipayConfig.publicKey}
                        onChange={(e) => handleAlipayConfigChange('publicKey', e.target.value)}
                        placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
                        className="bg-[#14202c] border-[#2e4258] text-white min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={handleSaveAlipayConfig} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Settings className="h-4 w-4 mr-2" />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;