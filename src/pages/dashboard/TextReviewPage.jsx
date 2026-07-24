import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAdminTextReviewQueue,
  approveTextReview,
  rejectTextReview,
  needsChangesTextReview,
  getFileSignedUrl
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import { Clock, FileDown, AlertTriangle } from 'lucide-react';

const TextReviewPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | 'needs_changes'

  // PDF Preview State
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Query Queue
  const { data: queue, isLoading, error, refetch } = useQuery({
    queryKey: ['textReviewQueue'],
    queryFn: () => getAdminTextReviewQueue(),
  });

  const books = Array.isArray(queue) ? queue : [];
  const selectedBook = books[selectedBookIndex];

  // Fetch PDF Signed URL on selection change
  useEffect(() => {
    if (!selectedBook) {
      setPdfUrl('');
      return;
    }

    const pdfFile = selectedBook.files?.find(f => String(f.file_type).toLowerCase() === 'pdf');
    if (!pdfFile) {
      setPdfUrl('');
      return;
    }

    let isMounted = true;
    setPdfLoading(true);
    setPdfUrl('');

    getFileSignedUrl(selectedBook.book_id, pdfFile.file_id || pdfFile.id)
      .then(data => {
        if (isMounted && data?.url) {
          setPdfUrl(data.url);
        }
      })
      .catch(err => {
        console.error('Failed to resolve signed PDF URL:', err);
      })
      .finally(() => {
        if (isMounted) setPdfLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBook]);

  // Action Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ bookId, type, payload }) => {
      switch (type) {
        case 'approve':
          return approveTextReview(bookId, payload);
        case 'reject':
          return rejectTextReview(bookId, payload);
        case 'needs_changes':
          return needsChangesTextReview(bookId, payload);
        default:
          throw new Error('Unsupported action type');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['textReviewQueue'] });
      toast.success(`Text review decision [${variables.type.replace('_', ' ')}] recorded!`);
      setNotes('');
      setSelectedBookIndex(0);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit review action.');
    },
  });

  const handleDownloadFile = async (fileType) => {
    if (!selectedBook) return;
    const file = selectedBook.files?.find(f => String(f.file_type).toLowerCase() === fileType.toLowerCase());
    if (!file) {
      toast.error(`No ${fileType.toUpperCase()} file registered for this book.`);
      return;
    }
    const toastId = toast.loading(`Generating secure link for ${fileType.toUpperCase()}...`);
    try {
      const data = await getFileSignedUrl(selectedBook.book_id, file.file_id || file.id);
      toast.dismiss(toastId);
      if (data && data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to resolve download URL.');
      }
    } catch (e) {
      toast.dismiss(toastId);
      toast.error('Error generating secure link.');
    }
  };

  const handleTriggerAction = (type) => {
    if (type !== 'approve' && !notes.trim()) {
      toast.error(`Feedback notes are required when requesting changes or rejecting.`);
      return;
    }
    setConfirmAction(type);
  };

  const handleConfirm = () => {
    if (!selectedBook) return;

    const payload = {
      reviewer_name: currentUser?.name || 'Chief Editor',
      reviewer_email: currentUser?.email || 'admin@arche.com',
      notes: notes,
    };

    if (confirmAction === 'reject') {
      payload.recovery_action = 'Fix compilation issues and rebuild structure parsing stage.';
    }

    actionMutation.mutate({
      bookId: selectedBook.book_id,
      type: confirmAction,
      payload
    });
    setConfirmAction(null);
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving pending text review queue..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Review Queue"
        description="Could not synchronize queue telemetry datasets with the server."
        onRetry={refetch}
      />
    );
  }

  if (books.length === 0) {
    return (
      <EmptyState
        title="Review Queue Clear"
        description="There are no books currently awaiting text composition review."
      />
    );
  }

  return (
    <div className="space-y-6 w-full font-sans text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-[var(--color-archive-green)] font-serif">Text Layout Review</h2>
          <p className="text-xs text-[var(--color-muted-ink)] mt-0.5">Review layout compilations, OCR text layers, and typesetting parameters side-by-side.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Download shortcuts */}
          <button
            onClick={() => handleDownloadFile('pdf')}
            className="flex items-center gap-1.5 px-3 py-1 border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted-ink)] hover:text-[var(--color-archive-green)] uppercase tracking-wider rounded bg-[var(--color-surface)] cursor-pointer transition-colors"
          >
            <FileDown className="w-3 h-3" />
            PDF
          </button>
          <button
            onClick={() => handleDownloadFile('docx')}
            className="flex items-center gap-1.5 px-3 py-1 border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted-ink)] hover:text-[var(--color-archive-green)] uppercase tracking-wider rounded bg-[var(--color-surface)] cursor-pointer transition-colors"
          >
            <FileDown className="w-3 h-3" />
            DOCX
          </button>
          <button
            onClick={() => handleDownloadFile('epub')}
            className="flex items-center gap-1.5 px-3 py-1 border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted-ink)] hover:text-[var(--color-archive-green)] uppercase tracking-wider rounded bg-[var(--color-surface)] cursor-pointer transition-colors"
          >
            <FileDown className="w-3 h-3" />
            EPUB
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[680px]">
        {/* Left Sidebar Book Selector */}
        <div className="w-full lg:w-60 shrink-0 flex flex-col gap-2 bg-[var(--color-panel)] p-3 rounded-2xl border border-[var(--color-border)] h-[680px] overflow-y-auto text-left">
          <span className="text-[9px] font-bold text-[var(--color-muted-ink)] uppercase tracking-widest px-2 py-1 block">Pending Queue ({books.length})</span>
          <div className="space-y-1.5">
            {books.map((b, idx) => (
              <div
                key={b.book_id || b.id}
                onClick={() => {
                  setSelectedBookIndex(idx);
                  setNotes('');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedBookIndex === idx
                    ? 'border-[var(--color-archive-green)] bg-[var(--color-surface)] text-[var(--color-archive-green)] font-bold shadow-sm'
                    : 'border-[var(--color-border)]/40 bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)] text-[var(--color-ink-soft)]'
                }`}
              >
                <span className="font-serif font-bold text-xs block truncate">{b.title}</span>
                <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-wider block mt-1">By {b.author}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Book Page Mockup Simulator */}
        <div className="flex-1 bg-[var(--color-panel)] rounded-2xl border border-[var(--color-border)] p-6 sm:p-10 flex flex-col justify-center overflow-y-auto h-[680px]">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded shadow-md p-10 max-w-xl mx-auto w-full min-h-[540px] flex flex-col justify-between select-text leading-relaxed relative">
            <div>
              {/* Mock page header */}
              <div className="flex justify-between items-center border-b border-[var(--color-border)]/50 pb-2 mb-6">
                <span className="px-2 py-0.5 bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/20 text-[8px] font-sans font-bold text-[var(--color-warning)] uppercase tracking-widest rounded">
                  Draft Revision 4.2
                </span>
                <span className="text-[10px] text-[var(--color-muted-ink)] font-mono font-bold">Sheet 1 of 42</span>
              </div>

              {/* Book content layout */}
              <div className="text-[var(--color-ink)] text-left">
                <h3 className="text-xl font-bold font-serif text-center mb-1">Chapter One</h3>
                <p className="text-xs text-[var(--color-muted-ink)] font-serif italic text-center mb-8">The Inversion of Light</p>
                
                {/* Paragraph with large drop cap */}
                <p className="font-serif text-xs leading-relaxed text-justify first-letter:float-left first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:mr-2 first-letter:mt-1 first-letter:text-[var(--color-archive-green)]">
                  I t began not with a sound, but with the absence of one. The archives of Arche had always breathed—a soft respiration of turning pages and the low hum of atmospheric regulators. But that morning, the silence was absolute, a physical weight pressing against the eardrums of those who walked the halls of the Deep Stack.
                </p>
                <p className="font-serif text-xs leading-relaxed text-justify mt-4">
                  Elara Vance traced the spine of a leather-bound folio, her fingers lingering on the embossed sigil of the Three Suns. The leather felt cold, unnaturally so. Behind her, the automation trace panels flickered with a rhythmic, pulsing green light, casting long shadows that seemed to stretch further than the laws of optics allowed. The metadata was screaming, though the room remained still.
                </p>
                <p className="font-serif text-xs leading-relaxed text-justify mt-4">
                  “The rendering is failing in sector seven,” she whispered to the empty aisle. Her voice didn't echo. It was swallowed immediately by the thick, dust-mote-heavy air. She pulled her wool coat tighter. The transition from digital to physical was never supposed to be this abrasive. The ink on the page seemed to shimmer.
                </p>
              </div>
            </div>

            {/* Mock page footer */}
            <div className="border-t border-[var(--color-border)]/50 pt-4 mt-8 flex justify-between items-center text-[9px] text-[var(--color-muted-ink)] uppercase font-mono tracking-widest font-bold">
              <span>Arche Archives Platform</span>
              <span>typesetting verification</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Editorial Action Controls */}
        <div className="w-full lg:w-80 shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between h-[680px] overflow-y-auto text-left">
          <div className="space-y-5">
            <div>
              <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Editorial Action</span>
              <h3 className="text-lg font-bold text-[var(--color-archive-green)] font-serif mt-1">Finalize Archival Status</h3>
            </div>

            <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl space-y-3.5 text-xs">
              <div>
                <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Status</span>
                <span className="inline-block mt-1"><StatusBadge status={selectedBook.text_status} /></span>
              </div>
              <div className="h-px bg-[var(--color-border)]/65" />
              <div>
                <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Word Count</span>
                <span className="font-serif font-bold text-sm text-[var(--color-ink)] mt-0.5 block">12,482 Words</span>
              </div>
            </div>

            {/* Warnings Alert */}
            <div className="p-3.5 rounded-xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[10px] text-[var(--color-danger)] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-danger)]" />
              <div>
                <span className="font-bold block uppercase tracking-widest text-[8px]">Parser Warning Node</span>
                <p className="mt-0.5 leading-normal font-serif">
                  {selectedBook.last_error || '3 formatting inconsistencies found in Chapter One.'}
                </p>
              </div>
            </div>

            {/* Review Notes Form */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Reviewer Notes</span>
              <textarea
                placeholder="Draft your editorial feedback here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full p-3 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-ink)] placeholder-[var(--color-muted-ink)]/60 focus:outline-none focus:border-[var(--color-archive-green)] transition-all font-sans"
              />
            </div>
          </div>

          {/* Action triggers matching Google Stitch mockup */}
          <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
            <button
              onClick={() => handleTriggerAction('approve')}
              disabled={actionMutation.isPending}
              className="w-full flex flex-col items-center justify-center p-3 border border-[var(--color-success)] hover:bg-[var(--color-success-soft)] text-[var(--color-success)] rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-widest font-sans">Approve Text</span>
              <span className="text-[8px] text-[var(--color-muted-ink)] uppercase tracking-wider font-semibold mt-0.5">Commit to Archive</span>
            </button>
            
            <button
              onClick={() => handleTriggerAction('needs_changes')}
              disabled={actionMutation.isPending}
              className="w-full flex flex-col items-center justify-center p-3 border border-[var(--color-warning)] hover:bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-widest font-sans">Request Changes</span>
              <span className="text-[8px] text-[var(--color-muted-ink)] uppercase tracking-wider font-semibold mt-0.5">Revert to Scholar</span>
            </button>

            <button
              onClick={() => handleTriggerAction('reject')}
              disabled={actionMutation.isPending}
              className="w-full flex flex-col items-center justify-center p-3 border border-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-widest font-sans">Reject Text</span>
              <span className="text-[8px] text-[var(--color-muted-ink)] uppercase tracking-wider font-semibold mt-0.5">Permanent Expunge</span>
            </button>

            <div className="text-[9px] text-[var(--color-muted-ink)] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 pt-2">
              <Clock className="w-3 h-3 text-[var(--color-success)]" />
              <span className="font-bold">SLA: 4h 22m remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={`${confirmAction ? confirmAction.replace('_', ' ').toUpperCase() : ''} Review Decision`}
        message={`Are you sure you want to execute this ${confirmAction === 'needs_changes' ? 'Request Changes' : confirmAction} audit decision?`}
        confirmText="Confirm Action"
        confirmVariant={confirmAction === 'reject' ? 'danger' : 'primary'}
        isLoading={actionMutation.isPending}
      />
    </div>
  );
};

export default TextReviewPage;
