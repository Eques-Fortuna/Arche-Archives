import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import PublicBooksPage from '../pages/public/PublicBooksPage';
import PublicBookDetailPage from '../pages/public/PublicBookDetailPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';

// Dashboard Pages
import DashboardHomePage from '../pages/dashboard/DashboardHomePage';
import BooksPage from '../pages/dashboard/BooksPage';
import BookDetailPage from '../pages/dashboard/BookDetailPage';
import TextReviewPage from '../pages/dashboard/TextReviewPage';
import CoverReviewPage from '../pages/dashboard/CoverReviewPage';
import RightsReviewPage from '../pages/dashboard/RightsReviewPage';
import RecoveryPage from '../pages/dashboard/RecoveryPage';
import PublishingPage from '../pages/dashboard/PublishingPage';
import DataPage from '../pages/dashboard/DataPage';
import PhaseIngestionPage from '../pages/dashboard/PhaseIngestionPage';

// 404 Page
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<PublicBooksPage />} />
        <Route path="/books/:slug" element={<PublicBookDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
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
  );
};

export default AppRoutes;
