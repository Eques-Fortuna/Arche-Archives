import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProtectedRoute = () => {
  const { isAuthenticated, currentUser, isAdminUser, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && isAuthenticated && !isAdminUser) {
      toast.error('You do not have permission to access this dashboard.');
    }
  }, [loading, isAuthenticated, isAdminUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] text-[var(--color-ink)] flex items-center justify-center">
        <span className="text-xs font-sans font-bold tracking-widest text-[var(--color-muted-ink)] uppercase animate-pulse">
          Validating Security Tokens...
        </span>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdminUser) {
    return <Navigate to="/books" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;
