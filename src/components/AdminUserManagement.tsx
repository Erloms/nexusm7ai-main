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
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

interface UserProfile extends Tables<'profiles'> {}

interface Props {
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

const AdminUserManagement = ({ users, setUsers }: Props) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);

  // Fetch users from Supabase on component mount and when `users` prop changes
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) {
        console.error('Error fetching users for AdminUserManagement:', error);
        toast({ title: "错误", description: "无法加载用户数据", variant: "destructive" });
      } else {
        // For usage stats, we still rely on localStorage for now as per previous discussion
        const usersWithUsage = (data || []).map(user => {
          const chatUsage = parseInt(localStorage.getItem(`chat_usage_${user.id}`) || '0');
          const imageUsage = JSON.parse(localStorage.getItem(`nexusAi_image_usage_${user.id}`) || '{"remaining": 10}');
          const voiceUsage = JSON.parse(localStorage.getItem(`nexusAi_voice_usage_${user.id}`) || '{"remaining": 10}');
          
          return {
            ...user,
            usage: {
              chat: chatUsage,
              image: 10 - imageUsage.remaining,
              voice: 10 - voiceUsage.remaining
            }
          };
        });
        setUsers(usersWithUsage as any); // Cast to any because of added 'usage' property
      }
    };
    fetchUsers();
  }, [setUsers]); // Re-fetch when setUsers function reference changes (unlikely)

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const deleteUser = async (userId: string) => {
    const confirmDelete = window.confirm("确定要删除该用户吗？此操作不可撤销！");
    if (!confirmDelete) return;

    // Delete from Supabase profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      toast({ title: "错误", description: `删除用户失败: ${profileError.message}`, variant: "destructive" });
      return;
    }

    // Also delete from Supabase auth.users (this requires RLS policies to allow admin to delete users)
    // For simplicity, we'll assume RLS allows this or it's handled by a trigger/function.
    // If not, this part would need a Supabase Function.
    // const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    // if (authError) {
    //   console.error('Error deleting user from auth:', authError);
    //   toast({ title: "错误", description: `删除认证用户失败: ${authError.message}`, variant: "destructive" });
    //   return;
    // }

    // Update local state
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

    // Clean up user-specific data from localStorage (usage stats, chat history)
    localStorage.removeItem(`chat_usage_${userId}`);
    localStorage.removeItem(`nexusAi_image_usage_${userId}`);
    localStorage.removeItem(`nexusAi_voice_usage_${userId}`);
    localStorage.removeItem(`chat_history_${userId}`);

    toast({
      title: "删除成功",
      description: "用户及其相关数据已成功删除",
    });
  };

  const toggleVipStatus = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const newMembershipType = userToUpdate.membership_type === 'free' ? 'annual' : 'free';
    const newExpiryDate = newMembershipType === 'annual'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        membership_type: newMembershipType,
        membership_expires_at: newExpiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error toggling VIP status:', updateError);
      toast({ title: "错误", description: `更新VIP状态失败: ${updateError.message}`, variant: "destructive" });
      return;
    }

    setUsers(prevUsers => prevUsers.map(u => u.id === updatedProfile.id ? updatedProfile : u));

    toast({
      title: newMembershipType !== 'free' ? "VIP开通成功" : "VIP已取消",
      description: `用户 ${updatedProfile.username || updatedProfile.email} ${newMembershipType !== 'free' ? '已成功开通' : '已取消'} VIP会员`,
    });
  };

  const resetUserUsage = (userId: string) => {
    const confirmReset = window.confirm("确定要重置该用户的使用额度吗？");
    if (!confirmReset) return;

    // Reset all usage counters in localStorage
    localStorage.setItem(`chat_usage_${userId}`, '0');
    localStorage.setItem(`nexusAi_image_usage_${userId}`, JSON.stringify({ remaining: 10 }));
    localStorage.setItem(`nexusAi_voice_usage_${userId}`, JSON.stringify({ remaining: 10 }));

    // Update local state to reflect changes
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          usage: { chat: 0, image: 0, voice: 0 } // Reset usage in local state
        };
      }
      return user;
    }));

    toast({
      title: "重置成功",
      description: "用户使用额度已重置",
    });
  };

  const calculateTotalRevenue = () => {
    // This calculation is still a mock based on number of paid users,
    // a real revenue calculation would sum up completed payment orders.
    return users.filter(user => user.membership_type !== 'free').length * 799;
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
          <h3 className="text-lg font-bold text-nexus-cyan mb-2">付费用户</h3>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.membership_type !== 'free').length}</p>
        </div>
        
        <div className="bg-nexus-dark/50 p-4 rounded-xl border border-nexus-blue/20">
          <h3 className="text-lg font-bold text-nexus-cyan mb-2">免费用户</h3>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.membership_type === 'free').length}</p>
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
              <TableHead className="text-white">会员类型</TableHead>
              <TableHead className="text-white">使用统计</TableHead>
              <TableHead className="text-white">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id} className="border-nexus-blue/30 hover:bg-nexus-blue/10">
                <TableCell>
                  <div>
                    <div className="font-medium text-white">{user.username}</div>
                    <div className="text-sm text-white/60">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-white">
                  {new Date(user.created_at!).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.membership_type !== 'free' ? (
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Crown className="h-4 w-4" />
                      <span>{user.membership_type === 'lifetime' ? '永久会员' : '年会员'}</span>
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
                      <span className="text-white">{(user as any).usage?.chat || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="h-3 w-3 text-nexus-cyan" />
                      <span className="text-white">{(user as any).usage?.image || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-3 w-3 text-nexus-cyan" />
                      <span className="text-white">{(user as any).usage?.voice || 0}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleVipStatus(user.id)}
                      size="sm"
                      variant={user.membership_type !== 'free' ? "destructive" : "default"}
                      className={user.membership_type !== 'free'
                        ? "bg-red-600 hover:bg-red-700" 
                        : "bg-yellow-600 hover:bg-yellow-700"
                      }
                    >
                      {user.membership_type !== 'free' ? '取消会员' : '开通会员'}
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