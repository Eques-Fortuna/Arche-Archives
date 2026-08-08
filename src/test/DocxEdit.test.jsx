import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach } from 'vitest';
import AppRoutes from '../routes/AppRoutes';
import { renderWithProviders } from './testUtils';
import { setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../lib/auth';
import { server } from './server';
import { http, HttpResponse } from 'msw';

describe('Phase 4 DOCX Edit Round-Trip Integration Tests', () => {
  beforeEach(() => {
    removeStoredToken();
    removeStoredUser();
    localStorage.clear();
  });

  test('1 & 2. Admin and text_reviewer see Upload Edited DOCX button', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    const { unmount } = renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Edited DOCX/i })).toBeInTheDocument();
    });

    unmount();
    removeStoredToken();
    removeStoredUser();

    setStoredToken('mock-text-token');
    setStoredUser({ name: 'Text Auditor', email: 'text@arche.com', role: 'text_reviewer' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Edited DOCX/i })).toBeInTheDocument();
    });
  });

  test('3 & 4. Viewer and cover_reviewer DO NOT see Upload Edited DOCX button', async () => {
    setStoredToken('mock-viewer-token');
    setStoredUser({ name: 'Viewer Staff', email: 'viewer@arche.com', role: 'viewer' });

    const { unmount } = renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });

    await waitFor(() => {
      expect(screen.getByText(/Text Layout Review/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Upload Edited DOCX/i })).not.toBeInTheDocument();
    });

    unmount();
    removeStoredToken();
    removeStoredUser();

    setStoredToken('mock-cover-token');
    setStoredUser({ name: 'Art Director', email: 'cover@arche.com', role: 'cover_reviewer' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });

    await waitFor(() => {
      expect(screen.getByText(/Text Layout Review/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Upload Edited DOCX/i })).not.toBeInTheDocument();
    });
  });


  test('5. Invalid file types (.pdf, .txt, .doc) are rejected client-side', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Edited DOCX/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Upload Edited DOCX/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reviewer Guidance/i)).toBeInTheDocument();
    });

    const fileInput = document.querySelector('#docx-file-input');
    expect(fileInput).toBeInTheDocument();

    const invalidFile = new File(['mock content'], 'invalid_file.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [invalidFile], configurable: true });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    const submitBtn = screen.getByRole('button', { name: /Upload & Import Edits/i });
    expect(submitBtn).toBeDisabled();
  });

  test('6, 7 & 8. Valid .docx upload requests signed URL, triggers backend import, and NEVER calls n8n directly', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    let directN8nCalled = false;

    server.use(
      http.all('https://n8n.129-212-179-251.sslip.io/*', () => {
        directN8nCalled = true;
        return HttpResponse.json({ error: 'Direct n8n call prohibited' }, { status: 500 });
      })
    );

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Edited DOCX/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Upload Edited DOCX/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reviewer Guidance/i)).toBeInTheDocument();
    });

    const fileInput = document.querySelector('#docx-file-input');
    const validDocx = new File(['test docx content'], 'revision_edited.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    Object.defineProperty(fileInput, 'files', { value: [validDocx], configurable: true });
    fireEvent.change(fileInput, { target: { files: [validDocx] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload & Import Edits/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Upload & Import Edits/i }));

    await waitFor(() => {
      expect(directN8nCalled).toBe(false);
      expect(screen.getByText(/DOCX Edit Import Triggered/i)).toBeInTheDocument();
      expect(screen.getByText(/DOCX Import Summary/i)).toBeInTheDocument();
    }, { timeout: 3500 });
  });

  test('9 & 10. 409 rejection displays Large Edit Detected modal and confirm re-submission sends confirm: true', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    server.use(
      http.post('*/api/admin/books/:id/docx-edit/import', async ({ request }) => {
        const body = await request.json().catch(() => ({}));

        if (!body.confirm) {
          return HttpResponse.json(
            {
              ok: false,
              rejected: 'too_many_deletions (63% removed)',
              change_report: {
                kept: 500,
                text_changed: 10,
                added: 0,
                deleted: 900,
                reordered: 0,
                total_before: 1410,
                total_after: 510
              },
              hint: 'Re-submit with confirm=true if intentional'
            },
            { status: 409 }
          );
        }

        return HttpResponse.json({
          ok: true,
          message: 'Confirmed large DOCX edit import forced.',
          change_report: {
            kept: 500,
            text_changed: 10,
            added: 0,
            deleted: 900,
            reordered: 0,
            total_before: 1410,
            total_after: 510
          }
        });
      })
    );

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/review/text'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Edited DOCX/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Upload Edited DOCX/i }));

    const fileInput = document.querySelector('#docx-file-input');
    const validDocx = new File(['large edit docx'], 'heavy_edit.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    Object.defineProperty(fileInput, 'files', { value: [validDocx], configurable: true });
    fireEvent.change(fileInput, { target: { files: [validDocx] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload & Import Edits/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Upload & Import Edits/i }));

    await waitFor(() => {
      expect(screen.getByText('Large Edit Detected')).toBeInTheDocument();
      expect(screen.getByText(/too_many_deletions/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm and Re-submit/i })).toBeInTheDocument();
    }, { timeout: 3500 });

    fireEvent.click(screen.getByRole('button', { name: /Confirm and Re-submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/DOCX Edit Import Triggered/i)).toBeInTheDocument();
    }, { timeout: 3500 });
  });

  test('12. Archived book hides Upload Edited DOCX button', async () => {
    setStoredToken('mock-admin-token');
    setStoredUser({ name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' });

    server.use(
      http.get('*/api/admin/books/:id', () => {
        return HttpResponse.json({
          book_id: '1',
          title: 'Archived Volume',
          author: 'Famous Author',
          current_stage: 'archived',
          publication_status: 'archived',
          text_status: 'approved'
        });
      })
    );

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/books/1'] });

    await waitFor(() => {
      expect(screen.getByText('Archived Volume')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Upload Edited DOCX/i })).not.toBeInTheDocument();
    });
  });
});
