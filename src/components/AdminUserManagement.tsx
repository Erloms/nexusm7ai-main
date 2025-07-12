import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Search, UserCheck, UserX, Crown, MessageSquare, Image, Volume2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  isPaid: boolean;
  registrationDate: string;
  usage: {
    chat: number;
    image: number;
    voice: number;
  };
}

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AdminUserManagement = ({ users, setUsers }: Props) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load users with usage statistics
    const loadUsersWithUsage = () => {
      const userData = localStorage.getItem('nexusAi_users');
      if (userData) {
        const userList = JSON.parse(userData);
        const usersWithStats = userList.map((user: any) => {
          // Load usage statistics for each user
          const chatUsage = parseInt(localStorage.getItem(`chat_usage_${user.id}`) || '0');
          const imageUsage = JSON.parse(localStorage.getItem(`nexusAi_image_usage_${user.id}`) || '{"remaining": 10}');
          const voiceUsage = JSON.parse(localStorage.getItem(`nexusAi_voice_usage_${user.id}`) || '{"remaining": 10}');
          
          return {
            ...user,
            registrationDate: user.registrationDate || new Date().toISOString(),
            usage: {
              chat: chatUsage,
              image: 10 - imageUsage.remaining,
              voice: 10 - voiceUsage.remaining
            }
          };
        });
        setUsers(usersWithStats);
      }
    };

    loadUsersWithUsage();
  }, [setUsers]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const deleteUser = (userId: string) => {
    const confirmDelete = window.confirm("确定要删除该用户吗？此操作不可撤销！");
    if (!confirmDelete) return;

    const updatedUsers = users.filter(user => user.id !== userId);
    localStorage.setItem('nexusAi_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    // Clean up user-specific data
    localStorage.removeItem(`chat_usage_${userId}`);
    localStorage.removeItem(`nexusAi_image_usage_${userId}`);
    localStorage.removeItem(`nexusAi_voice_usage_${userId}`);
    localStorage.removeItem(`chat_history_${userId}`);

    toast({
      title: "删除成功",
      description: "用户及其相关数据已成功删除",
    });
  };

  const toggleVipStatus = (userId: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, isPaid: !user.isPaid } : user
    );
    
    localStorage.setItem('nexusAi_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    const user = users.find(u => u.id === userId);
    const newStatus = !user?.isPaid;
    
    toast({
      title: newStatus ? "VIP开通成功" : "VIP已取消",
      description: `用户 ${user?.name} ${newStatus ? '已成功开通' : '已取消'} VIP会员`,
    });
  };

  const resetUserUsage = (userId: string) => {
    const confirmReset = window.confirm("确定要重置该用户的使用额度吗？");
    if (!confirmReset) return;

    // Reset all usage counters
    localStorage.setItem(`chat_usage_${userId}`, '0');
    localStorage.setItem(`nexusAi_image_usage_${userId}`, JSON.stringify({ remaining: 10 }));
    localStorage.setItem(`nexusAi_voice_usage_${userId}`, JSON.stringify({ remaining: 10 }));

    // Reload users to update the display
    const userData = localStorage.getItem('nexusAi_users');
    if (userData) {
      const userList = JSON.parse(userData);
      const usersWithStats = userList.map((user: any) => {
        if (user.id === userId) {
          return {
            ...user,
            usage: { chat: 0, image: 0, voice: 0 }
          };
        }
        return user;
      });
      setUsers(usersWithStats);
    }

    toast({
      title: "重置成功",
      description: "用户使用额度已重置",
    });
  };

  const calculateTotalRevenue = () => {
    return users.filter(user => user.isPaid).length * 799;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-nexus-dark/50 p-4 rounded-xl border border-nexus-blue/20">
          <h3 className="text-lg font-bold text-nexus-cyan mb-2">总用户数</h3>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        
        <div className="bg-nexus-dark/50 p-4 rounded-xl border border-nexus-blue/20">
          <h3 className="text-lg font-bold text-nexus-cyan mb-2">VIP用户</h3>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.isPaid).length}</p>
        </div>
        
        <div className="bg-nexus-dark/50 p-4 rounded-xl border border-nexus-blue/20">
          <h3 className="text-lg font-bold text-nexus-cyan mb-2">免费用户</h3>
          <p className="text-2xl font-bold text-white">{users.filter(u => !u.isPaid).length}</p>
        </div>

        <div className="bg-nexus-dark/50 p-4 rounded-xl border border-nexus-blue/20">
          <h3 className="text-lg font-bold text-nexus-cyan mb-2">总收入</h3>
          <p className="text-2xl font-bold text-white">¥{calculateTotalRevenue()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="搜索用户..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-nexus-dark/50 border-nexus-blue/30 text-white"
        />
        <Search className="h-5 w-5 text-white/50" />
      </div>

      {/* Users Table */}
      <div className="bg-nexus-dark/50 rounded-xl border border-nexus-blue/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-nexus-blue/30 hover:bg-nexus-blue/10">
              <TableHead className="text-white">用户信息</TableHead>
              <TableHead className="text-white">注册日期</TableHead>
              <TableHead className="text-white">VIP状态</TableHead>
              <TableHead className="text-white">使用统计</TableHead>
              <TableHead className="text-white">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id} className="border-nexus-blue/30 hover:bg-nexus-blue/10">
                <TableCell>
                  <div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-white/60">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-white">
                  {new Date(user.registrationDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.isPaid ? (
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Crown className="h-4 w-4" />
                      <span>VIP会员</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <UserX className="h-4 w-4" />
                      <span>免费用户</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-nexus-cyan" />
                      <span className="text-white">{user.usage.chat}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="h-3 w-3 text-nexus-cyan" />
                      <span className="text-white">{user.usage.image}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-3 w-3 text-nexus-cyan" />
                      <span className="text-white">{user.usage.voice}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleVipStatus(user.id)}
                      size="sm"
                      variant={user.isPaid ? "destructive" : "default"}
                      className={user.isPaid 
                        ? "bg-red-600 hover:bg-red-700" 
                        : "bg-yellow-600 hover:bg-yellow-700"
                      }
                    >
                      {user.isPaid ? '取消VIP' : '开通VIP'}
                    </Button>
                    
                    <Button
                      onClick={() => resetUserUsage(user.id)}
                      size="sm"
                      variant="outline"
                      className="border-nexus-blue/30 text-nexus-cyan hover:bg-nexus-blue/20"
                    >
                      重置额度
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/60">没有找到匹配的用户</p>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
