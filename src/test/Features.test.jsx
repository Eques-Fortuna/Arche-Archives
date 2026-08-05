import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach } from 'vitest';
import AppRoutes from '../routes/AppRoutes';
import { renderWithProviders } from './testUtils';
import { setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../lib/auth';
import { server } from './server';
import { http, HttpResponse } from 'msw';

describe('Arche Archives Production Features & Fixes Tests', () => {
  beforeEach(() => {
    removeStoredToken();
    removeStoredUser();
    localStorage.clear();
  });

  test('Cover Reupload button is visible to Admin and Cover Reviewer but hidden from Viewer and Text Reviewer', async () => {
    // 1. Admin test
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    const { unmount } = renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books/1'] });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Reupload Cover/i })[0]).toBeInTheDocument();
    }, { timeout: 4000 });

    unmount();
    removeStoredToken();
    removeStoredUser();

    // 2. Viewer test
    setStoredToken('mock-viewer-token');
    setStoredUser({ name: 'Viewer Staff', email: 'viewer@arche.com', role: 'viewer' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books/1'] });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Reupload Cover/i })).not.toBeInTheDocument();
    });
  });

  test('Admin sees Permanent Delete section and modal requires DELETE_BOOK confirmation input', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books/1'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Book Permanently/i })).toBeInTheDocument();
    });

    // Click Danger Zone delete button
    fireEvent.click(screen.getByRole('button', { name: /Delete Book Permanently/i }));

    await waitFor(() => {
      expect(screen.getByText(/Permanently delete this book\?/i)).toBeInTheDocument();
    });

    const confirmInput = screen.getByPlaceholderText('DELETE_BOOK');
    expect(confirmInput).toBeInTheDocument();

    // Button should be disabled before typing DELETE_BOOK
    const modalDeleteBtn = screen.getAllByRole('button', { name: /Delete Permanently/i })[0];
    expect(modalDeleteBtn).toBeDisabled();

    // Type DELETE_BOOK into confirmation input
    fireEvent.change(confirmInput, { target: { value: 'DELETE_BOOK' } });
    expect(modalDeleteBtn).not.toBeDisabled();
  });

  test('Operator cannot see Danger Zone or Delete Book Permanently button', async () => {
    setStoredToken('mock-operator-token');
    setStoredUser({ name: 'Operator Staff', email: 'operator@arche.com', role: 'operator' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books/1'] });

    await waitFor(() => {
      expect(screen.getByText(/Pipeline Compilation Stepper/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete Book Permanently/i })).not.toBeInTheDocument();
    });
  });

  test('Pipeline Stepper renders real pipeline steps on book detail page', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books/1'] });

    await waitFor(() => {
      expect(screen.getAllByText('Uploaded')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Normalized')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Structured')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Rendered')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Text Approved')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Cover Approved')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Rights Verified')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Final Assembly')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Published')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Data Packaged')[0]).toBeInTheDocument();
    });

  });

  test('Dashboard displays accurate Human Approval breakdown counts', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      expect(screen.getByText('Human Approval')).toBeInTheDocument();
      expect(screen.getByText('Text: 1 · Cover: 1 · Rights: 1')).toBeInTheDocument();
      expect(screen.queryByText('140')).not.toBeInTheDocument();
    });
  });

  test('Archived books are excluded by default on BooksPage catalog', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    server.use(
      http.get('*/api/admin/books', () => {
        return HttpResponse.json([
          {
            book_id: 'active-1',
            title: 'Active Volume One',
            author: 'Author A',
            slug: 'active-volume-one',
            publication_status: 'draft'
          },
          {
            book_id: 'archived-1',
            title: 'Archived Volume Two',
            author: 'Author B',
            slug: 'archived-volume-two',
            publication_status: 'archived'
          }
        ]);
      })
    );

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books'] });

    await waitFor(() => {
      expect(screen.getByText('Active Volume One')).toBeInTheDocument();
      expect(screen.queryByText('Archived Volume Two')).not.toBeInTheDocument();
      expect(screen.getByText('1 VOLUMES IN CATALOG')).toBeInTheDocument();
    });
  });
});
