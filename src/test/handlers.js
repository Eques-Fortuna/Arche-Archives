import { http, HttpResponse } from 'msw';

export const handlers = [
  // Authentication
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({
      ok: true,
      user: { name: 'John Public', email: 'john@example.com', role: 'user' }
    });
  }),

  http.get('*/api/admin/auth/me', () => {
    return HttpResponse.json({
      ok: true,
      user: { name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' }
    });
  }),

  http.post('*/api/auth/login', () => {
    return HttpResponse.json({
      ok: true,
      access_token: 'mock-public-token',
      user: { name: 'John Public', email: 'john@example.com', role: 'user' }
    });
  }),

  http.post('*/api/admin/auth/login', () => {
    return HttpResponse.json({
      ok: true,
      access_token: 'mock-admin-token',
      user: { name: 'Admin Staff', email: 'admin@arche.com', role: 'admin' }
    });
  }),

  http.post('*/api/auth/register', () => {
    return HttpResponse.json({
      ok: true,
      message: 'User registered successfully'
    });
  }),

  http.post('*/api/auth/logout', () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post('*/api/admin/auth/logout', () => {
    return HttpResponse.json({ ok: true });
  }),

  // Public Catalog (Flat Array)
  http.get('*/api/public/books', () => {
    return HttpResponse.json([
      {
        book_id: '1',
        title: 'The Hamlet',
        author: 'William Faulkner',
        slug: 'the-hamlet',
        original_publication_year: 1940
      }
    ]);
  }),

  // Public Book Details (Flat Object)
  http.get('*/api/public/books/:slug', ({ params }) => {
    return HttpResponse.json({
      book_id: '1',
      title: 'The Hamlet',
      author: 'William Faulkner',
      slug: params.slug,
      original_publication_year: 1940,
      text_status: 'approved',
      cover_status: 'approved',
      rights_status: 'verified',
      current_stage: 'published'
    });
  }),

  http.get('*/api/public/books/:slug/downloads', ({ params }) => {
    return HttpResponse.json({
      ok: true,
      download_url: `https://NYC3.digitaloceanspaces.com/completed/${params.slug}/${params.slug}.pdf?token=123`
    });
  }),

  // Admin Catalog & Telemetry (Flat Array)
  http.get('*/api/admin/books', () => {
    return HttpResponse.json([
      {
        book_id: '1',
        title: 'The Hamlet',
        author: 'William Faulkner',
        slug: 'the-hamlet',
        current_stage: 'cover_approved',
        stage_status: 'complete',
        text_status: 'approved',
        cover_status: 'approved',
        rights_status: 'verified',
        publication_status: 'draft'
      }
    ]);
  }),

  // Admin Book Details (Flat Object)
  http.get('*/api/admin/books/:id', ({ params }) => {
    return HttpResponse.json({
      book_id: params.id,
      title: 'The Hamlet',
      author: 'William Faulkner',
      slug: 'the-hamlet',
      current_stage: 'cover_review',
      stage_status: 'pending',
      text_status: 'approved',
      cover_status: 'pending',
      rights_status: 'pending'
    });
  }),

  http.get('*/api/admin/books/:id/files', () => {
    return HttpResponse.json({ ok: true, files: [] });
  }),

  http.get('*/api/admin/books/:id/qc', () => {
    return HttpResponse.json({ ok: true, qc: {} });
  }),

  http.get('*/api/admin/books/:id/render-reports', () => {
    return HttpResponse.json({ ok: true, reports: [] });
  }),

  http.get('*/api/admin/books/:id/approvals', () => {
    return HttpResponse.json({ ok: true, approvals: {} });
  }),

  http.get('*/api/admin/recovery', () => {
    return HttpResponse.json({ ok: true, items: [] });
  }),

  // Review queues
  http.get('*/api/admin/review-queue/text', () => {
    return HttpResponse.json([
      {
        book_id: '1',
        title: 'The Hamlet',
        author: 'William Faulkner',
        slug: 'the-hamlet',
        current_stage: 'text_review',
        text_status: 'pending'
      }
    ]);
  }),

  http.get('*/api/admin/review-queue/covers', () => {
    return HttpResponse.json([
      {
        book_id: '1',
        title: 'The Hamlet',
        author: 'William Faulkner',
        slug: 'the-hamlet',
        current_stage: 'cover_review',
        cover_status: 'pending'
      }
    ]);
  }),

  http.get('*/api/admin/review-queue/rights', () => {
    return HttpResponse.json([
      {
        book_id: '1',
        title: 'The Hamlet',
        author: 'William Faulkner',
        slug: 'the-hamlet',
        current_stage: 'rights_review',
        rights_status: 'pending'
      }
    ]);
  }),

  // Ingest/Pipeline Trigger
  http.get('*/api/admin/pipeline/eligible', () => {
    return HttpResponse.json({
      ok: true,
      books: [
        {
          book_id: '1',
          title: 'The Hamlet',
          author: 'William Faulkner'
        }
      ]
    });
  }),

  http.post('*/api/admin/pipeline/run-phase/:phase', ({ params }) => {
    return HttpResponse.json({
      ok: true,
      triggered: true,
      triggered_phase: parseInt(params.phase, 10),
      message: 'Pipeline batch trigger successfully processed!'
    });
  }),

  http.post('*/api/admin/books/:id/run-next-phase', () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post('*/api/admin/books/:id/retry', () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post('*/api/admin/books/:id/archive', () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post('*/api/admin/books/:id/unarchive', () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post('*/api/admin/books/:id/covers/human-design/upload-url', () => {
    return HttpResponse.json({
      upload_url: 'http://mock-storage.com/upload-url',
      storage_path: 'covers/human/custom_cover.jpg'
    });
  }),

  http.post('*/api/admin/books/:id/covers/reupload/upload-url', () => {
    return HttpResponse.json({
      upload_url: 'http://mock-storage.com/upload-url',
      storage_path: 'covers/reupload/custom_cover.jpg'
    });
  }),

  http.post('*/api/admin/books/:id/covers/human-design', () => {
    return HttpResponse.json({ ok: true, message: 'Cover updated successfully.' });
  }),

  http.post('*/api/admin/books/:id/covers/reupload', () => {
    return HttpResponse.json({ ok: true, message: 'Cover replaced successfully.' });
  }),

  http.delete('*/api/admin/books/:id', () => {
    return HttpResponse.json({ ok: true, message: 'Book deleted permanently.' });
  }),

  http.post('*/api/admin/books/:id/docx-edit/upload-url', ({ params }) => {
    return HttpResponse.json({
      upload_url: `/api/admin/books/${params.id}/docx-edit/upload-target`,
      storage_path: 'docx_edits/edited_volume.docx'
    });
  }),

  http.put('*/api/admin/books/:id/docx-edit/upload-target', () => {
    return new HttpResponse(null, { status: 200 });
  }),


  http.post('*/api/admin/books/:id/docx-edit/import', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    if (body.simulate_409 && !body.confirm) {
      return HttpResponse.json(
        {
          ok: false,
          rejected: 'too_many_deletions (63% removed)',
          change_report: {
            kept: 500,
            text_changed: 100,
            added: 10,
            deleted: 1000,
            reordered: 0,
            total_before: 1600,
            total_after: 610
          },
          hint: 'Re-submit with confirm=true if intentional'
        },
        { status: 409 }
      );
    }

    if (body.confirm) {
      return HttpResponse.json({
        ok: true,
        message: 'Confirmed large DOCX edit import forced.',
        change_report: {
          kept: 500,
          text_changed: 100,
          added: 10,
          deleted: 1000,
          reordered: 0,
          total_before: 1600,
          total_after: 610
        }
      });
    }

    return HttpResponse.json({
      ok: true,
      message: 'DOCX edit import started. The book will return to the render queue shortly.',
      change_report: {
        kept: 1549,
        text_changed: 3,
        added: 2,
        deleted: 1,
        reordered: 0,
        total_before: 1661,
        total_after: 1662
      },
      warnings: []
    });
  }),


  http.put('*', () => {
    return new HttpResponse(null, { status: 200 });
  })
];



