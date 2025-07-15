import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserDashboard from '@/components/UserDashboard';
import AdminUserManagement from '@/components/AdminUserManagement';
import { UserProfile } from '@/contexts/AuthContext'; // Import UserProfile type
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DashboardHome = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]); // State for AdminUserManagement

  // Fetch all users for AdminUserManagement if current user is admin
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (userProfile?.role === 'admin') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error('Error fetching all users for admin:', error);
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
      }
    };
    fetchAllUsers();
  }, [userProfile]); // Depend on userProfile to trigger fetch

  if (!userProfile) {
    return (
      <div className="text-white text-center py-10">
        加载用户资料...
      </div>
    );
  }

  const isAdmin = userProfile.role === 'admin';
  const getMembershipDisplay = () => {
    if (isAdmin) return '管理员';
    if (userProfile.membership_type === 'lifetime') return '永久会员';
    if (userProfile.membership_type === 'agent') return '代理会员';
    if (userProfile.membership_type === 'annual' && userProfile.membership_expires_at) {
      const expiryDate = new Date(userProfile.membership_expires_at);
      if (expiryDate > new Date()) {
        return '年费会员';
      }
    }
    return '免费用户';
  };

  const membershipExpiry = userProfile.membership_expires_at ? new Date(userProfile.membership_expires_at) : null;
  const isExpired = membershipExpiry && membershipExpiry < new Date();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          欢迎回来，{userProfile.username || userProfile.email?.split('@')[0] || '未知用户'}！
        </h1>
        <p className="text-gray-400">
          {getMembershipDisplay()}
        </p>
      </div>

      {/* 会员状态卡片 */}
      <div className="bg-gradient-to-br from-nexus-dark/80 to-nexus-purple/30 backdrop-blur-sm rounded-xl border border-nexus-blue/20 p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">会员状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-nexus-cyan mb-1">
              {getMembershipDisplay()}
            </div>
            <div className="text-gray-400 text-sm">账户类型</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-nexus-cyan mb-1">
              {userProfile.membership_type === 'lifetime' || userProfile.membership_type === 'agent' ? '永久' : isExpired ? '已过期' : '有效'}
            </div>
            <div className="text-gray-400 text-sm">会员状态</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-nexus-cyan mb-1">
              {membershipExpiry ? membershipExpiry.toLocaleDateString() : '无'}
            </div>
            <div className="text-gray-400 text-sm">到期时间</div>
          </div>
        </div>
      </div>

      {/* 根据用户角色显示不同内容 */}
      {isAdmin ? <AdminUserManagement users={users} setUsers={setUsers} /> : <UserDashboard />}
    </div>
  );
};

export default DashboardHome;