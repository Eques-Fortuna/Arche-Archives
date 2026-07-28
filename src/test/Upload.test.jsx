import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import UploadBookModal from '../components/books/UploadBookModal';
import BookFilesTable from '../components/books/BookFilesTable';
import { renderWithProviders } from './testUtils';
import { server } from './server';
import { http, HttpResponse } from 'msw';

describe('HTML Source Upload and File Telemetry Tests', () => {
  test('Upload modal displays correct labels and safety notice', () => {
    renderWithProviders(<UploadBookModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    
    // Check accepted formats text
    expect(screen.getByText(/Book File \(.txt, .md, .html, .htm, .pdf, .docx, .epub\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Supports .txt, .md, .html, .htm, .pdf, .docx, or .epub up to 50MB/i)).toBeInTheDocument();
    
    // Check HTML safety notice
    expect(screen.getByText(/HTML files are accepted as source files. Scripts and styling will be treated as untrusted source content during processing./i)).toBeInTheDocument();
  });

  test('Upload modal accepts valid .html file and rejects malicious executable extension', async () => {
    const { container } = renderWithProviders(<UploadBookModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);

    const fileInput = container.querySelector('input[type="file"]');

    // 1. Check a valid html file
    const validHtmlFile = new File(['<h1>Test</h1>'], 'test-book.html', { type: 'text/html' });
    fireEvent.change(fileInput, { target: { files: [validHtmlFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('test-book.html')).toBeInTheDocument();
    });

    // 2. Try an invalid double extension / executable extension file
    const invalidFile = new File(['alert(1)'], 'test.html.exe', { type: 'application/x-msdownload' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    // Should trigger error toast
    await waitFor(() => {
      expect(screen.getByText(/Unsupported file type. Supported source files: TXT, Markdown, HTML, PDF, DOCX, EPUB/i)).toBeInTheDocument();
    });
  });

  test('Upload modal accepts valid .htm file and infers MIME type if empty', async () => {
    let presignedRequestContentType = null;
    let uploadContentTypeHeader = null;
    let registerBookPayload = null;

    server.use(
      http.post('*/api/admin/books/signed-upload-url', async ({ request }) => {
        const body = await request.json();
        presignedRequestContentType = body.content_type;
        return HttpResponse.json({
          url: 'http://mock-storage.com/upload-url',
          key: 'raw/test-book.htm',
          contentType: 'text/html'
        });
      }),
      http.put('http://mock-storage.com/upload-url', ({ request }) => {
        uploadContentTypeHeader = request.headers.get('Content-Type');
        return HttpResponse.json({ ok: true });
      }),
      http.post('*/api/admin/books/register', async ({ request }) => {
        registerBookPayload = await request.json();
        return HttpResponse.json({ ok: true, book: { book_id: 'html-book-1' } });
      })
    );

    const { container } = renderWithProviders(<UploadBookModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);

    // Populate required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g. The Great Gatsby/i), { target: { value: 'My HTML Book' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. F. Scott Fitzgerald/i), { target: { value: 'Author Name' } });
    
    // Provide htm file with empty file.type
    const htmFile = new File(['<html></html>'], 'test-book.htm', { type: '' });
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [htmFile] } });

    await waitFor(() => {
      expect(screen.getByText('test-book.htm')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Start Ingestion/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(presignedRequestContentType).toBe('text/html');
      expect(uploadContentTypeHeader).toBe('text/html');
      expect(registerBookPayload).toEqual({
        title: 'My HTML Book',
        author: 'Author Name',
        slug: 'my-html-book',
        raw_source_path: 'raw/test-book.htm'
      });
      expect(screen.getByText(/Book uploaded & normalization pipeline started!/i)).toBeInTheDocument();
    });
  });

  test('BookFilesTable displays HTML Source type and changes button to Download Source', () => {
    const mockFiles = [
      {
        file_id: 'html-file-id',
        file_type: 'html_source',
        storage_path: 'raw/test-book.html',
        mime_type: 'text/html',
        created_at: '2026-07-28T23:14:00Z'
      },
      {
        file_id: 'pdf-file-id',
        file_type: 'pdf',
        storage_path: 'completed/test-book.pdf',
        mime_type: 'application/pdf',
        created_at: '2026-07-28T23:14:00Z'
      }
    ];

    renderWithProviders(<BookFilesTable bookId="1" files={mockFiles} />);

    // Renders custom label "HTML Source"
    expect(screen.getByText('HTML Source')).toBeInTheDocument();

    // Renders "Download Source" button for HTML file instead of "Preview"
    expect(screen.getByRole('button', { name: /Download Source/i })).toBeInTheDocument();
    
    // Still renders standard "Preview" button for PDF file
    expect(screen.getByRole('button', { name: /Preview/i })).toBeInTheDocument();
  });
});
