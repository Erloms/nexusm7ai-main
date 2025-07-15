import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[]; // Optional: specify roles allowed to access this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, userProfile } = useAuth();

  if (loading) {
    // Still loading auth state, show a loading indicator or null
    return (
      <div className="min-h-screen flex items-center justify-center bg-nexus-dark text-white">
        加载中...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role || 'user')) {
    // Authenticated but not authorized for this role, redirect to dashboard or a forbidden page
    return <Navigate to="/dashboard" replace />; // Or a /forbidden page
  }

  // Authenticated and authorized, render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;