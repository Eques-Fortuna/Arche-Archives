import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const PublicBooksPage = lazy(() => import('../pages/public/PublicBooksPage'));
const PublicBookDetailPage = lazy(() => import('../pages/public/PublicBookDetailPage'));

// Auth Pages
const UserLoginPage = lazy(() => import('../pages/auth/UserLoginPage'));
const AdminLoginPage = lazy(() => import('../pages/auth/AdminLoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

// Dashboard Pages
const DashboardHomePage = lazy(() => import('../pages/dashboard/DashboardHomePage'));
const BooksPage = lazy(() => import('../pages/dashboard/BooksPage'));
const BookDetailPage = lazy(() => import('../pages/dashboard/BookDetailPage'));
const TextReviewPage = lazy(() => import('../pages/dashboard/TextReviewPage'));
const CoverReviewPage = lazy(() => import('../pages/dashboard/CoverReviewPage'));
const RightsReviewPage = lazy(() => import('../pages/dashboard/RightsReviewPage'));
const RecoveryPage = lazy(() => import('../pages/dashboard/RecoveryPage'));
const PublishingPage = lazy(() => import('../pages/dashboard/PublishingPage'));
const DataPage = lazy(() => import('../pages/dashboard/DataPage'));
const PhaseIngestionPage = lazy(() => import('../pages/dashboard/PhaseIngestionPage'));

// 404 Page
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <LoadingSpinner message="Loading application module..." />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<PublicBooksPage />} />
          <Route path="/books/:slug" element={<PublicBookDetailPage />} />
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHomePage />} />
            <Route path="/dashboard/books" element={<BooksPage />} />
            <Route path="/dashboard/books/:id" element={<BookDetailPage />} />
            <Route path="/dashboard/review/text" element={<TextReviewPage />} />
            <Route path="/dashboard/review/covers" element={<CoverReviewPage />} />
            <Route path="/dashboard/review/rights" element={<RightsReviewPage />} />
            <Route path="/dashboard/recovery" element={<RecoveryPage />} />
            <Route path="/dashboard/publishing" element={<PublishingPage />} />
            <Route path="/dashboard/data" element={<DataPage />} />
            <Route path="/dashboard/phases/:stage" element={<PhaseIngestionPage />} />
          </Route>
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
