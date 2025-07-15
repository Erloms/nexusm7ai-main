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
import { Database } from '@/integrations/supabase/types'; // Import Database type
import { TableRow, TableCell } from "@/components/ui/table";

// Define types based on Supabase tables using direct access
type UserProfile = Database['public']['Tables']['profiles']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type MembershipPlan = Database['public']['Tables']['membership_plans']['Row'];

// Define a type for Order with joined membership_plans data
interface OrderWithMembershipPlan extends Order {
  membership_plans: { name: string } | null;
}

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<OrderWithMembershipPlan[]>([]); // Use new joined type
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]); // State for membership plans
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Manual activation form
  const [activationIdentifier, setActivationIdentifier] = useState('');
  const [activationPlanId, setActivationPlanId] = useState<string | null>(null); // Use plan ID

  useEffect(() => {
    const fetchAdminData = async () => {
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

      // Fetch payment orders from Supabase (new 'orders' table)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, membership_plans(name)') // Select plan name from joined table
        .order('created_at', { ascending: false });
      if (ordersError) {
        console.error('Error fetching payment orders:', ordersError);
        toast({ title: "错误", description: "无法加载支付订单", variant: "destructive" });
      } else {
        setPaymentOrders(ordersData as OrderWithMembershipPlan[] || []); // Cast to the new joined type
      }

      // Fetch membership plans
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (plansError) {
        console.error('Error fetching membership plans:', plansError);
        toast({ title: "错误", description: "无法加载会员套餐", variant: "destructive" });
      } else {
        setMembershipPlans(plansData || []);
        if (plansData && plansData.length > 0) {
          setActivationPlanId(plansData[0].id); // Set default selected plan
        }
      }
    };

    fetchAdminData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualActivation = async () => {
    if (!activationIdentifier || !activationPlanId) {
      toast({
        title: "错误",
        description: "请输入用户标识并选择会员类型",
        variant: "destructive"
      });
      return;
    }

    const selectedPlan = membershipPlans.find(p => p.id === activationPlanId);
    if (!selectedPlan) {
      toast({ title: "错误", description: "无效的会员套餐", variant: "destructive" });
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
      // const isPhone = /^1[3-9]\d{9}$/.test(activationIdentifier); // Simple phone validation

      const newEmail = isEmail ? activationIdentifier : `${activationIdentifier}@system.generated`;
      const newUsername = isEmail ? activationIdentifier.split('@')[0] : activationIdentifier;
      const tempPassword = Math.random().toString(36).slice(-8); // Generate a temporary password

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm for admin-created users
        user_metadata: {
          username: newUsername,
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

      // The handle_new_user trigger should create the profile automatically.
      // We'll refetch profiles to ensure the new user is in our state.
      const { data: updatedUsers, error: fetchUsersError } = await supabase.from('profiles').select('*');
      if (fetchUsersError) {
        console.error('Error refetching users after creation:', fetchUsersError);
      } else {
        setUsers(updatedUsers || []);
        targetUser = updatedUsers?.find(u => u.id === userIdToUpdate);
      }
    }

    if (!userIdToUpdate) {
      toast({ title: "错误", description: "无法确定用户ID进行激活。", variant: "destructive" });
      return;
    }

    // Call the activate_membership function
    const { error: activateError } = await supabase.rpc('activate_membership', {
      p_user_id: userIdToUpdate,
      p_plan_id: activationPlanId,
      p_order_id: null, // No order ID for manual activation
    });

    if (activateError) {
      console.error('Error activating membership:', activateError);
      toast({
        title: "错误",
        description: `手动开通会员失败: ${activateError.message}`,
        variant: "destructive"
      });
      return;
    }

    // Refetch users to update their membership status in the UI
    const { data: updatedUsers, error: refetchError } = await supabase.from('profiles').select('*');
    if (refetchError) {
      console.error('Error refetching users after manual activation:', refetchError);
    } else {
      setUsers(updatedUsers || []);
    }

    setActivationIdentifier('');
    setActivationPlanId(membershipPlans[0]?.id || null); // Reset to default

    toast({
      title: "成功",
      description: `已为 ${userNameToUpdate || userEmailToUpdate} 开通 ${selectedPlan.name} 会员`,
    });
  };

  const approvePayment = async (orderId: string) => {
    const order = paymentOrders.find(o => o.id === orderId);
    if (!order) return;

    // Call the activate_membership function
    const { error: activateError } = await supabase.rpc('activate_membership', {
      p_user_id: order.user_id!,
      p_plan_id: order.plan_id!,
      p_order_id: order.id,
    });

    if (activateError) {
      console.error('Error activating membership via admin approve:', activateError);
      toast({ title: "错误", description: `确认支付并开通会员失败: ${activateError.message}`, variant: "destructive" });
      // Optionally update order status to failed if activation fails
      await supabase.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
      return;
    }

    // Refetch orders and users to update UI
    const { data: updatedOrders, error: refetchOrdersError } = await supabase
      .from('orders')
      .select('*, membership_plans(name)')
      .order('created_at', { ascending: false });
    if (refetchOrdersError) console.error('Error refetching orders:', refetchOrdersError);
    else setPaymentOrders(updatedOrders as OrderWithMembershipPlan[] || []); // Cast to the new joined type

    const { data: updatedUsers, error: refetchUsersError } = await supabase.from('profiles').select('*');
    if (refetchUsersError) console.error('Error refetching users:', refetchUsersError);
    else setUsers(updatedUsers || []);

    toast({
      title: "支付已确认",
      description: `已为用户 ${order.user_id?.slice(0, 8)}... 开通会员权限`,
    });
  };

  const stats = {
    totalUsers: users.length,
    paidUsers: users.filter(u => u.membership_type !== 'free').length,
    pendingPayments: paymentOrders.filter(o => o.status === 'pending').length,
    totalRevenue: paymentOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0)
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
              {/* Removed Alipay config tab */}
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
                    <div className="text-2xl font-bold text-white">¥{stats.totalRevenue.toFixed(2)}</div>
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
                        <TableRow key={user.id} className="border-b border-[#203042]/30">
                          <TableCell className="py-3 px-4 text-white">{user.email}</TableCell>
                          <TableCell className="py-3 px-4 text-white">{user.username}</TableCell>
                          <TableCell className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.membership_type === 'lifetime' ? 'bg-purple-600 text-white' :
                              user.membership_type === 'agent' ? 'bg-orange-600 text-white' :
                              user.membership_type === 'annual' || user.membership_type === 'premium' ? 'bg-blue-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {user.membership_type === 'lifetime' ? '永久会员' :
                               user.membership_type === 'agent' ? '代理会员' :
                               user.membership_type === 'annual' || user.membership_type === 'premium' ? '付费会员' : '免费用户'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-white">
                            {user.membership_expires_at 
                              ? new Date(user.membership_expires_at).toLocaleDateString()
                              : user.membership_type === 'lifetime' || user.membership_type === 'agent' ? '永久' : '-'
                            }
                          </TableCell>
                          <TableCell className="py-3 px-4 text-white">
                            {new Date(user.created_at!).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
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
                        <th className="text-left py-3 px-4 text-white font-medium">订单号</th>
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
                        <TableRow key={order.id} className="border-b border-[#203042]/30">
                          <TableCell className="font-medium text-white">{order.order_number}</TableCell>
                          <TableCell className="py-3 px-4 text-white">{order.user_id?.slice(0, 8)}...</TableCell>
                          <TableCell className="py-3 px-4 text-white">
                            {order.membership_plans?.name || '未知套餐'}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-white">¥{order.amount.toFixed(2)}</TableCell>
                          <TableCell className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'paid' ? 'bg-green-600 text-white' :
                              order.status === 'pending' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {order.status === 'paid' ? '已完成' :
                               order.status === 'pending' ? '待处理' : '失败'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-white">
                            {new Date(order.created_at!).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => approvePayment(order.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                确认支付
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
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
                      <Select value={activationPlanId || ''} onValueChange={setActivationPlanId}>
                        <SelectTrigger className="bg-[#14202c] border-[#2e4258] text-white">
                          <SelectValue placeholder="选择会员套餐" />
                        </SelectTrigger>
                        <SelectContent>
                          {membershipPlans.map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} (¥{plan.price.toFixed(2)})
                            </SelectItem>
                          ))}
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
        </div>
      </div>
    </div>
  );
};

export default Admin;