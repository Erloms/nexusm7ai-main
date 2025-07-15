import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Image, Volume2, Settings, Users, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import GradientLogo from '@/components/GradientLogo';

const DashboardSidebar = () => {
  const { userProfile, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: '仪表板', icon: LayoutDashboard, roles: ['user', 'admin'] },
    { path: '/chat', label: 'AI对话', icon: MessageSquare, roles: ['user', 'admin'] },
    { path: '/image', label: 'AI绘画', icon: Image, roles: ['user', 'admin'] },
    { path: '/voice', label: 'AI语音', icon: Volume2, roles: ['user', 'admin'] },
    { path: '/settings', label: '个人设置', icon: Settings, roles: ['user', 'admin'] },
  ];

  const adminNavItems = [
    { path: '/admin', label: '管理员面板', icon: Users, roles: ['admin'] },
    // { path: '/admin/payments', label: '支付管理', icon: CreditCard, roles: ['admin'] }, // Example for nested admin routes
  ];

  const filteredNavItems = navItems.filter(item => 
    userProfile && item.roles.includes(userProfile.role || 'user')
  );

  const filteredAdminNavItems = adminNavItems.filter(item => 
    userProfile && item.roles.includes(userProfile.role || 'user')
  );

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full pt-4 pb-6">
      <div className="px-4 mb-8">
        <Link to="/" className="flex items-center space-x-2">
          <GradientLogo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.label}
            </Link>
          );
        })}

        {filteredAdminNavItems.length > 0 && (
          <>
            <div className="border-t border-sidebar-border pt-4 mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                管理
              </h3>
            </div>
            {filteredAdminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-4 mt-auto pt-6 border-t border-sidebar-border">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm mr-3">
            {userProfile?.username?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">
              {userProfile?.username || userProfile?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500">
              {userProfile?.role === 'admin' ? '管理员' : 
               userProfile?.membership_type === 'lifetime' ? '永久会员' : 
               userProfile?.membership_type === 'annual' ? '年会员' : '免费用户'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-red-400 hover:bg-red-400/20 hover:text-red-300"
        >
          <LogOut className="h-4 w-4 mr-3" />
          退出登录
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;