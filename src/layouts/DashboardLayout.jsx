import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import UploadBookModal from '../components/books/UploadBookModal';
import { useQueryClient } from '@tanstack/react-query';

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOpenModal = () => {
      setIsUploadModalOpen(true);
    };
    window.addEventListener('open-register-book', handleOpenModal);
    return () => {
      window.removeEventListener('open-register-book', handleOpenModal);
    };
  }, []);

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1A1A1A] flex overflow-hidden w-screen">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden h-screen">
        {/* Top Header */}
        <Topbar setMobileOpen={setMobileOpen} />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Upload Book / New Collection Modal */}
      <UploadBookModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default DashboardLayout;
