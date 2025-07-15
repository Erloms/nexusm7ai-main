import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute'; // Import ProtectedRoute

const Dashboard = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nexus-dark text-white">
        加载中...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-nexus-dark via-nexus-purple/20 to-nexus-dark">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <DashboardSidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40 text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar">
            <DashboardSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden pt-4 md:pt-0">
          {/* Content will be rendered by Outlet */}
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;