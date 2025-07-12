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

interface User {
  id: string;
  email: string;
  name: string;
  membershipType: 'free' | 'annual' | 'lifetime';
  membershipExpiry?: string;
  joinDate: string;
}

interface PaymentOrder {
  id: string;
  userId: string;
  email: string;
  amount: number;
  plan: 'annual' | 'lifetime';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  paymentMethod: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Manual activation form - 支持多种标识符
  const [activationIdentifier, setActivationIdentifier] = useState('');
  const [activationPlan, setActivationPlan] = useState<'annual' | 'lifetime'>('annual');
  
  // 支付宝配置
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
    // Load users from localStorage
    const savedUsers = localStorage.getItem('nexusAi_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Add some mock data for demonstration
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          name: '用户一',
          membershipType: 'free',
          joinDate: '2024-01-15'
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: '用户二',
          membershipType: 'annual',
          membershipExpiry: '2025-01-15',
          joinDate: '2024-01-20'
        }
      ];
      setUsers(mockUsers);
      localStorage.setItem('nexusAi_users', JSON.stringify(mockUsers));
    }

    // Load payment orders
    const savedOrders = localStorage.getItem('nexusAi_payment_orders');
    if (savedOrders) {
      setPaymentOrders(JSON.parse(savedOrders));
    } else {
      // Add some mock payment data
      const mockOrders: PaymentOrder[] = [
        {
          id: '1',
          userId: '3',
          email: 'newuser@example.com',
          amount: 99,
          plan: 'annual',
          status: 'pending',
          timestamp: new Date().toISOString(),
          paymentMethod: 'alipay'
        }
      ];
      setPaymentOrders(mockOrders);
      localStorage.setItem('nexusAi_payment_orders', JSON.stringify(mockOrders));
    }

    // Load Alipay config
    const savedAlipayConfig = localStorage.getItem('nexusAi_alipay_config');
    if (savedAlipayConfig) {
      setAlipayConfig(JSON.parse(savedAlipayConfig));
    }
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualActivation = () => {
    if (!activationIdentifier) {
      toast({
        title: "错误",
        description: "请输入用户邮箱、账号或手机号",
        variant: "destructive"
      });
      return;
    }

    // 检查是否为邮箱格式
    const isEmail = activationIdentifier.includes('@');
    // 检查是否为手机号格式（简单验证）
    const isPhone = /^1[3-9]\d{9}$/.test(activationIdentifier);
    
    const updatedUsers = users.map(user => {
      // 支持邮箱、用户名或手机号匹配
      if (user.email === activationIdentifier || 
          user.name === activationIdentifier ||
          user.id === activationIdentifier) {
        const expiryDate = activationPlan === 'annual' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;
        
        return {
          ...user,
          membershipType: activationPlan,
          membershipExpiry: expiryDate
        };
      }
      return user;
    });

    // If user doesn't exist, create new one
    if (!users.find(u => u.email === activationIdentifier || u.name === activationIdentifier || u.id === activationIdentifier)) {
      const newUser: User = {
        id: Date.now().toString(),
        email: isEmail ? activationIdentifier : `${activationIdentifier}@system.generated`,
        name: isEmail ? activationIdentifier.split('@')[0] : activationIdentifier,
        membershipType: activationPlan,
        membershipExpiry: activationPlan === 'annual' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        joinDate: new Date().toISOString()
      };
      updatedUsers.push(newUser);
    }

    setUsers(updatedUsers);
    localStorage.setItem('nexusAi_users', JSON.stringify(updatedUsers));
    setActivationIdentifier('');
    
    toast({
      title: "成功",
      description: `已为 ${activationIdentifier} 开通${activationPlan === 'annual' ? '年' : '永久'}会员`,
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

  const approvePayment = (orderId: string) => {
    const order = paymentOrders.find(o => o.id === orderId);
    if (!order) return;

    // Update order status
    const updatedOrders = paymentOrders.map(o => 
      o.id === orderId ? { ...o, status: 'completed' as const } : o
    );
    setPaymentOrders(updatedOrders);
    localStorage.setItem('nexusAi_payment_orders', JSON.stringify(updatedOrders));

    // Update user membership
    const updatedUsers = users.map(user => {
      if (user.email === order.email) {
        const expiryDate = order.plan === 'annual' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;
        
        return {
          ...user,
          membershipType: order.plan,
          membershipExpiry: expiryDate
        };
      }
      return user;
    });

    // If user doesn't exist, create new one
    if (!users.find(u => u.email === order.email)) {
      const newUser: User = {
        id: Date.now().toString(),
        email: order.email,
        name: order.email.split('@')[0],
        membershipType: order.plan,
        membershipExpiry: order.plan === 'annual' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        joinDate: new Date().toISOString()
      };
      updatedUsers.push(newUser);
    }

    setUsers(updatedUsers);
    localStorage.setItem('nexusAi_users', JSON.stringify(updatedUsers));

    toast({
      title: "支付已确认",
      description: `已为 ${order.email} 开通会员权限`,
    });
  };

  const stats = {
    totalUsers: users.length,
    paidUsers: users.filter(u => u.membershipType !== 'free').length,
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
                          <td className="py-3 px-4 text-white">{user.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.membershipType === 'lifetime' ? 'bg-purple-600 text-white' :
                              user.membershipType === 'annual' ? 'bg-blue-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {user.membershipType === 'lifetime' ? '永久会员' :
                               user.membershipType === 'annual' ? '年会员' : '免费用户'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">
                            {user.membershipExpiry 
                              ? new Date(user.membershipExpiry).toLocaleDateString()
                              : user.membershipType === 'lifetime' ? '永久' : '-'
                            }
                          </td>
                          <td className="py-3 px-4 text-white">
                            {new Date(user.joinDate).toLocaleDateString()}
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
                        <th className="text-left py-3 px-4 text-white font-medium">用户邮箱</th>
                        <th className="text-left py-3 px-4 text-white font-medium">套餐</th>
                        <th className="text-left py-3 px-4 text-white font-medium">金额</th>
                        <th className="text-left py-3 px-4 text-white font-medium">支付方式</th>
                        <th className="text-left py-3 px-4 text-white font-medium">状态</th>
                        <th className="text-left py-3 px-4 text-white font-medium">时间</th>
                        <th className="text-left py-3 px-4 text-white font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentOrders.map(order => (
                        <tr key={order.id} className="border-b border-[#203042]/30">
                          <td className="py-3 px-4 text-white">{order.email}</td>
                          <td className="py-3 px-4 text-white">
                            {order.plan === 'annual' ? '年会员' : '永久会员'}
                          </td>
                          <td className="py-3 px-4 text-white">¥{order.amount}</td>
                          <td className="py-3 px-4 text-white">{order.paymentMethod}</td>
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
                            {new Date(order.timestamp).toLocaleDateString()}
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
