import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach } from 'vitest';
import AppRoutes from '../routes/AppRoutes';
import { renderWithProviders } from './testUtils';
import { setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../lib/auth';
import { server } from './server';
import { http, HttpResponse } from 'msw';


describe('Arche Archives Role Gating & Permissions Integration Tests', () => {
  beforeEach(() => {
    removeStoredToken();
    removeStoredUser();
    localStorage.clear();
  });

  test('Unauthenticated user cannot access /dashboard and is redirected to /admin/login', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard'] });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify Staff Credentials/i })).toBeInTheDocument();
    });
  });

  test('Public user cannot access /dashboard', async () => {
    setStoredToken('mock-public-token');
    setStoredUser({ name: 'John Public', email: 'john@example.com', role: 'user' });
    
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard'] });
    
    await waitFor(() => {
      // Should redirect to public book catalog list
      expect(screen.getAllByText(/The Hamlet/i)[0]).toBeInTheDocument();
    });
  });

  test('Admin can access dashboard', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      expect(screen.getByText(/Real-time Pipeline Overview/i)).toBeInTheDocument();
    });
  });

  test('Viewer cannot see BookTable run/retry/archive buttons', async () => {
    setStoredToken('mock-viewer-token');
    setStoredUser({ name: 'Viewer Staff', email: 'viewer@arche.com', role: 'viewer' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books'] });

    await waitFor(() => {
      expect(screen.getByText(/Read Only/i)).toBeInTheDocument();
      expect(screen.queryByTitle('Run Next Phase')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Retry Stage')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Archive Book')).not.toBeInTheDocument();
    });
  });

  test('Operator can see run/retry but not archive on BookTable', async () => {
    setStoredToken('mock-operator-token');
    setStoredUser({ name: 'Operator Staff', email: 'operator@arche.com', role: 'operator' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books'] });

    await waitFor(() => {
      // Operator should see run/retry controls on BookTable
      expect(screen.getByTitle('Run Next Phase')).toBeInTheDocument();
      expect(screen.getByTitle('Retry Stage')).toBeInTheDocument();
      // Operator should NOT see archive
      expect(screen.queryByTitle('Archive Book')).not.toBeInTheDocument();
    });
  });

  test('Operator cannot publish on publishing page', async () => {
    setStoredToken('mock-operator-token');
    setStoredUser({ name: 'Operator Staff', email: 'operator@arche.com', role: 'operator' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/publishing'] });
    await waitFor(() => {
      expect(screen.getAllByText(/Read Only/i)[0]).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
    });
  });

  test('Admin can see manual override form on book details', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books/1'] });

    await waitFor(() => {
      expect(screen.getByText(/Manual Stage Override/i)).toBeInTheDocument();
    });
  });

  test('Text reviewer can access text review actions only', async () => {
    setStoredToken('mock-text-token');
    setStoredUser({ name: 'Text Staff', email: 'text@arche.com', role: 'text_reviewer' });

    // Text reviewer can perform text review actions
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });
    await waitFor(() => {
      expect(screen.queryByText(/Read-only: Text queue/i)).not.toBeInTheDocument();
    });

    // Text reviewer sees read-only banner on rights review form
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/rights'] });
    await waitFor(() => {
      expect(screen.getByText(/Read-only: Rights clearance/i)).toBeInTheDocument();
    });
  });

  test('Cover reviewer can access cover actions only', async () => {
    setStoredToken('mock-cover-token');
    setStoredUser({ name: 'Cover Staff', email: 'cover@arche.com', role: 'cover_reviewer' });

    // Cover reviewer can upload covers / perform cover review actions
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/covers'] });
    await waitFor(() => {
      expect(screen.queryByText(/Upload Disabled/i)).not.toBeInTheDocument();
    });

    // Cover reviewer is read-only on text reviews
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });
    await waitFor(() => {
      expect(screen.getByText(/Read-only: Text queue/i)).toBeInTheDocument();
    });
  });

  test('Rights reviewer can access rights actions only', async () => {
    setStoredToken('mock-rights-token');
    setStoredUser({ name: 'Rights Staff', email: 'rights@arche.com', role: 'rights_reviewer' });

    // Rights reviewer can review rights details
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/rights'] });
    await waitFor(() => {
      expect(screen.queryByText(/Read-only: Rights clearance/i)).not.toBeInTheDocument();
    });

    // Rights reviewer is read-only on cover reviews
    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/covers'] });
    await waitFor(() => {
      expect(screen.getByText(/Upload Disabled/i)).toBeInTheDocument();
    });
  });

  test('Archived tab renders on the publishing board and archived books display inside it', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    // Mock the admin books to return one archived book
    server.use(
      http.get('*/api/admin/books', () => {
        return HttpResponse.json([
          {
            book_id: 'archived-1',
            title: 'The Great Gatsby (Archived)',
            author: 'F. Scott Fitzgerald',
            slug: 'the-great-gatsby-archived',
            current_stage: 'archived',
            stage_status: 'complete',
            text_status: 'approved',
            cover_status: 'approved',
            rights_status: 'verified',
            publication_status: 'archived',
            archived_at: '2026-07-25T17:33:03Z'
          }
        ]);
      })
    );

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/publishing'] });

    // Renders the Archived tab
    await waitFor(() => {
      expect(screen.getByText(/Archived \(1\)/i)).toBeInTheDocument();
    });

    // Click the Archived tab
    const archivedTabButton = screen.getByText(/Archived \(1\)/i);
    fireEvent.click(archivedTabButton);

    // Verify archived book renders
    await waitFor(() => {
      expect(screen.getByText('The Great Gatsby (Archived)')).toBeInTheDocument();
      expect(screen.getByText('Slug: the-great-gatsby-archived')).toBeInTheDocument();
      expect(screen.getByText(/Archived:/i)).toBeInTheDocument();
    });
  });

  test('Admins can see the Unarchive button but Operators cannot', async () => {
    // 1. Admin test
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    server.use(
      http.get('*/api/admin/books', () => {
        return HttpResponse.json([
          {
            book_id: 'archived-1',
            title: 'The Great Gatsby (Archived)',
            author: 'F. Scott Fitzgerald',
            slug: 'the-great-gatsby-archived',
            current_stage: 'archived',
            stage_status: 'complete',
            text_status: 'approved',
            cover_status: 'approved',
            rights_status: 'verified',
            publication_status: 'archived'
          }
        ]);
      })
    );

    const { unmount } = renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/publishing'] });

    await waitFor(() => {
      expect(screen.getByText(/Archived \(1\)/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Archived \(1\)/i));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unarchive/i })).toBeInTheDocument();
    });

    unmount();
    removeStoredToken();
    removeStoredUser();

    // 2. Operator test
    setStoredToken('mock-operator-token');
    setStoredUser({ name: 'Operator Staff', email: 'operator@arche.com', role: 'operator' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/publishing'] });

    await waitFor(() => {
      expect(screen.getByText(/Archived \(1\)/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Archived \(1\)/i));

    await waitFor(() => {
      expect(screen.getByText(/Read Only/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Unarchive/i })).not.toBeInTheDocument();
    });
  });

  test('Clicking Unarchive triggers the correct API post', async () => {
    let unarchiveCalled = false;
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    server.use(
      http.get('*/api/admin/books', () => {
        return HttpResponse.json([
          {
            book_id: 'archived-1',
            title: 'The Great Gatsby (Archived)',
            author: 'F. Scott Fitzgerald',
            slug: 'the-great-gatsby-archived',
            current_stage: 'archived',
            stage_status: 'complete',
            text_status: 'approved',
            cover_status: 'approved',
            rights_status: 'verified',
            publication_status: 'archived'
          }
        ]);
      }),
      http.post('*/api/admin/books/:id/unarchive', ({ params }) => {
        if (params.id === 'archived-1') {
          unarchiveCalled = true;
        }
        return HttpResponse.json({ ok: true });
      })
    );

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/publishing'] });

    await waitFor(() => {
      expect(screen.getByText(/Archived \(1\)/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Archived \(1\)/i));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Unarchive/i });
      fireEvent.click(btn);
    });

    // Confirmation dialog pops up, click confirm
    await waitFor(() => {
      const confirmBtn = screen.getByRole('button', { name: /Unarchive Book/i });
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(unarchiveCalled).toBe(true);
    });
  });
});

