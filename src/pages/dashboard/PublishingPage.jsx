import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAdminBooks,
  publishBook,
  unpublishBook,
  archiveBook,
  unarchiveBook
} from '../../lib/api';

// Components
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PublishModal from '../../components/books/PublishModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { Check, BookOpen, Terminal, Archive, UploadCloud, ShieldAlert, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canPublish, canArchive, canUnarchive } from '../../lib/auth';

const PublishingPage = () => {
  const { user } = useAuth();
  const canPub = canPublish(user);
  const canArc = canArchive(user);
  const canUnarc = canUnarchive(user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ready');

  // Modal Control States
  const [publishingBook, setPublishingBook] = useState(null);
  const [confirmUnpublishId, setConfirmUnpublishId] = useState(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [confirmUnarchiveId, setConfirmUnarchiveId] = useState(null);

  // Fetch catalog books list
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminBooksPublishing'],
    queryFn: () => getAdminBooks(),
  });

  // Action Mutations
  const publishMutation = useMutation({
    mutationFn: ({ bookId, payload }) => publishBook(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooksPublishing'] });
      toast.success('Book published to public site successfully!');
      setPublishingBook(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to publish book.');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (bookId) => unpublishBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooksPublishing'] });
      toast.success('Book unreleased and set back to unpublished draft.');
      setConfirmUnpublishId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unpublish book.');
      setConfirmUnpublishId(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (bookId) => archiveBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooksPublishing'] });
      queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
      toast.success('Book moved to archived catalog successfully.');
      setConfirmArchiveId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to archive book.');
      setConfirmArchiveId(null);
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (bookId) => unarchiveBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooksPublishing'] });
      queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
      toast.success('Book unarchived successfully.');
      setConfirmUnarchiveId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unarchive book.');
      setConfirmUnarchiveId(null);
    },
  });

  // Handlers
  const handlePublishSubmit = (payload) => {
    if (publishingBook) {
      publishMutation.mutate({ bookId: publishingBook.book_id, payload });
    }
  };

  const handleUnpublishConfirm = () => {
    if (confirmUnpublishId) {
      unpublishMutation.mutate(confirmUnpublishId);
    }
  };

  const handleArchiveConfirm = () => {
    if (confirmArchiveId) {
      archiveMutation.mutate(confirmArchiveId);
    }
  };

  const handleUnarchiveConfirm = () => {
    if (confirmUnarchiveId) {
      unarchiveMutation.mutate(confirmUnarchiveId);
    }
  };


  const books = Array.isArray(data) ? data : [];

  // Triage Books Lists
  const readyBooks = useMemo(() => {
    return books.filter((b) => {
      const isPublished = String(b.publication_status).toLowerCase() === 'published';
      const textApproved = String(b.text_status).toLowerCase() === 'approved';
      const coverApproved = String(b.cover_status).toLowerCase() === 'approved';
      const rightsVerified = String(b.rights_status).toLowerCase() === 'verified' || String(b.rights_status).toLowerCase() === 'approved';
      return textApproved && coverApproved && rightsVerified && !isPublished && String(b.publication_status).toLowerCase() !== 'archived';
    });
  }, [books]);

  const publishedBooks = useMemo(() => {
    return books.filter((b) => String(b.publication_status).toLowerCase() === 'published');
  }, [books]);

  const blockedBooks = useMemo(() => {
    return books.filter((b) => {
      const isPublished = String(b.publication_status).toLowerCase() === 'published';
      const textApproved = String(b.text_status).toLowerCase() === 'approved';
      const coverApproved = String(b.cover_status).toLowerCase() === 'approved';
      const rightsVerified = String(b.rights_status).toLowerCase() === 'verified' || String(b.rights_status).toLowerCase() === 'approved';
      const isReady = textApproved && coverApproved && rightsVerified;
      return !isReady && !isPublished && String(b.publication_status).toLowerCase() !== 'archived';
    });
  }, [books]);

  const archivedBooks = useMemo(() => {
    return books.filter((b) => 
      String(b.publication_status).toLowerCase() === 'archived' || 
      String(b.publicationStatus).toLowerCase() === 'archived'
    );
  }, [books]);

  const tabs = [
    { id: 'ready', label: `Ready to Publish (${readyBooks.length})` },
    { id: 'published', label: `Published (${publishedBooks.length})` },
    { id: 'blocked', label: `In Progress / Blocked (${blockedBooks.length})` },
    { id: 'archived', label: `Archived (${archivedBooks.length})` },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Retrieving catalog release lists..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Publishing Board"
        description="Could not synchronize catalog publication data with the server."
        onRetry={refetch}
      />
    );
  }

  const renderBookGrid = (booksList, type) => {
    if (booksList.length === 0) {
      let title = `No ${type} Books`;
      let description = `There are currently no books in the ${type} queue.`;
      if (type === 'ready') {
        title = "No books are ready to publish.";
        description = "Books will appear here after text, cover, and rights approvals are complete.";
      } else if (type === 'published') {
        title = "No books are currently published.";
        description = "";
      } else if (type === 'archived') {
        title = "No archived books.";
        description = "Archived books will appear here after they are removed from active publishing.";
      }
      return (
        <EmptyState
          title={title}
          description={description}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-6 bg-[var(--color-surface)]">
        {booksList.map((book) => (
          <div key={book.book_id} className="flex gap-4 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-archive-green)] transition-all relative text-left shadow-sm">
            {/* Book Cover Thumbnail */}
            <div className="w-20 h-28 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg shrink-0 overflow-hidden flex items-center justify-center relative">
              {book.cover_url ? (
                <img src={book.cover_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-8 h-8 text-[var(--color-subtle-ink)]/20" />
              )}
              {type === 'published' && (
                <div className="absolute top-1.5 right-1.5 bg-[var(--color-success)] text-[var(--color-surface)] p-0.5 rounded-full shadow">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
            </div>

            {/* Book Metadata details */}
            <div className="flex-grow flex flex-col justify-between min-w-0">
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-[var(--color-ink)] truncate">{book.title}</h4>
                <p className="text-[11px] text-[var(--color-muted-ink)] font-bold uppercase tracking-wider font-sans">
                  {book.author}, {book.publication_year || '2024'}
                </p>
                <div className="text-[10px] text-[var(--color-muted-ink)] font-mono space-y-0.5 mt-1 select-all">
                  <div>Slug: {book.slug}</div>
                  <div>Stage: <span className="font-bold uppercase tracking-wider">{book.current_stage || 'Unknown'}</span></div>
                  {type === 'archived' && (
                    <div className="text-[var(--color-danger)] font-bold">
                      Archived: {book.archived_at ? new Date(book.archived_at).toLocaleDateString() : book.updated_at ? new Date(book.updated_at).toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </div>
                
                {/* Visual checkpoints checklist */}
                <div className="pt-2 space-y-1 text-[10px] text-[var(--color-ink)] font-bold font-mono">
                  <div className="flex items-center gap-1.5">
                    <Check className={`w-3.5 h-3.5 ${String(book.text_status).toLowerCase() === 'approved' ? 'text-[var(--color-success)]' : 'text-[var(--color-border)]'}`} />
                    <span>Text: {String(book.text_status).toLowerCase() === 'approved' ? 'Approved' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className={`w-3.5 h-3.5 ${String(book.cover_status).toLowerCase() === 'approved' ? 'text-[var(--color-success)]' : 'text-[var(--color-border)]'}`} />
                    <span>Cover: {String(book.cover_status).toLowerCase() === 'approved' ? 'Approved' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className={`w-3.5 h-3.5 ${['verified', 'approved'].includes(String(book.rights_status).toLowerCase()) ? 'text-[var(--color-success)]' : 'text-[var(--color-border)]'}`} />
                    <span>Rights: {['verified', 'approved'].includes(String(book.rights_status).toLowerCase()) ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer inside card */}
              <div className="pt-3 border-t border-[var(--color-border)]/50 mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block font-sans">
                  STATUS: {type === 'published' ? 'Live on Catalog' : type === 'blocked' ? 'Review Hold' : type === 'archived' ? 'Archived' : 'Ready for Dist.'}
                </span>

                <div className="flex items-center gap-2">
                  {canArc && type !== 'archived' && (
                    <button
                      onClick={() => setConfirmArchiveId(book.book_id)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-[var(--color-border)] text-[9px] font-sans font-bold text-[var(--color-muted-ink)] hover:bg-[var(--color-panel)] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      <Archive className="w-3 h-3" />
                      Archive
                    </button>
                  )}
                  
                  {type === 'ready' && canPub && (
                    <button
                      onClick={() => setPublishingBook(book)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[var(--color-archive-green)] text-[9px] font-sans font-bold text-[var(--color-surface)] hover:bg-[var(--color-archive-green-dark)] border border-transparent uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm animate-pulse"
                    >
                      <UploadCloud className="w-3 h-3" />
                      Publish
                    </button>
                  )}
                  {type === 'published' && canPub && (
                    <button
                      onClick={() => setConfirmUnpublishId(book.book_id)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-[var(--color-danger)] text-[9px] font-sans font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                  {type === 'archived' && canUnarc && (
                    <button
                      onClick={() => setConfirmUnarchiveId(book.book_id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[var(--color-archive-green)] text-[9px] font-sans font-bold text-[var(--color-surface)] hover:bg-[var(--color-archive-green-dark)] border border-transparent uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Unarchive
                    </button>
                  )}
                  {type !== 'archived' && !canPub && !canArc && (
                    <span className="px-2.5 py-1 bg-[var(--color-danger-soft)]/20 border border-[var(--color-danger)]/15 text-[var(--color-danger)] text-[9px] font-sans font-bold uppercase tracking-widest rounded-xl">
                      Read Only
                    </span>
                  )}
                  {type === 'archived' && !canUnarc && (
                    <span className="px-2.5 py-1 bg-[var(--color-danger-soft)]/20 border border-[var(--color-danger)]/15 text-[var(--color-danger)] text-[9px] font-sans font-bold uppercase tracking-widest rounded-xl">
                      Read Only
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full font-sans text-[var(--color-ink)] text-left">
      {/* Header and metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-5 gap-4">
        <div>
          <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block font-sans">Editorial Desk</span>
          <h2 className="text-3xl font-bold text-[var(--color-archive-green)] font-serif mt-0.5">Publishing Command</h2>
          <p className="text-xs text-[var(--color-muted-ink)] mt-1.5 max-w-3xl leading-relaxed">
            Review archival dossiers for final public release. Ensure all metadata compliance and rights verification stages are finalized before ledger entry.
          </p>
        </div>
        <div className="text-right text-[10px] text-[var(--color-muted-ink)] font-mono uppercase tracking-wider space-y-0.5 font-bold shrink-0 self-start sm:self-center">
          <div>ARCHIVAL STAMP #882-PD</div>
          <div className="text-[var(--color-danger)] border border-[var(--color-danger)] px-2 py-0.5 rounded inline-block bg-[var(--color-danger-soft)]">RELEASE PHASE 4</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Grid View Container */}
      <Card className="p-0 border border-[var(--color-border)] overflow-hidden">
        {activeTab === 'ready' && renderBookGrid(readyBooks, 'ready')}
        {activeTab === 'published' && renderBookGrid(publishedBooks, 'published')}
        {activeTab === 'blocked' && renderBookGrid(blockedBooks, 'blocked')}
        {activeTab === 'archived' && renderBookGrid(archivedBooks, 'archived')}
      </Card>

      {/* Live Metadata Trace console logs */}
      <Card className="p-5 border border-[var(--color-border)] bg-[var(--color-code-bg)] text-[var(--color-code-text)]">
        <div className="flex justify-between items-center border-b border-[var(--color-border)]/35 pb-2.5">
          <h3 className="text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[var(--color-archive-green)]" />
            Live Metadata Trace
          </h3>
          <span className="text-[9px] font-mono text-[var(--color-code-muted)]">NODE: LONDON-ARCHIVE-4</span>
        </div>
        <div className="mt-3 space-y-1.5 font-mono text-[9px] text-[var(--color-code-muted)] select-all text-left">
          <div>&gt; [SYSTEM] Synchronizing with OAI-PMH Global Registry...</div>
          <div>&gt; [LEDGER] Pinging block height 19,420,811...</div>
          <div>&gt; [VALIDATOR] Checking digital signatures for catalog index...</div>
          <div>&gt; [READY] All pre-distribution checks passed for release dossiers.</div>
        </div>
      </Card>

      {/* Dialog Modals */}
      <PublishModal
        isOpen={publishingBook !== null}
        onClose={() => setPublishingBook(null)}
        onConfirm={handlePublishSubmit}
        book={publishingBook}
        isPending={publishMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmUnpublishId !== null}
        onClose={() => setConfirmUnpublishId(null)}
        onConfirm={handleUnpublishConfirm}
        title="Revoke Public Release"
        message="Are you sure you want to unpublish this book? It will be removed from the public website catalogs."
        confirmText="Unpublish Release"
        confirmVariant="danger"
        isLoading={unpublishMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmArchiveId !== null}
        onClose={() => setConfirmArchiveId(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Catalog Record"
        message="Are you sure you want to move this book record to archived storage? Publishing releases will be blocked."
        confirmText="Archive Book"
        confirmVariant="danger"
        isLoading={archiveMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmUnarchiveId !== null}
        onClose={() => setConfirmUnarchiveId(null)}
        onConfirm={handleUnarchiveConfirm}
        title="Unarchive Catalog Record"
        message="Unarchive this book? This will move the book back to the unpublished queue so it can be managed again."
        confirmText="Unarchive Book"
        confirmVariant="primary"
        isLoading={unarchiveMutation.isPending}
      />

    </div>
  );
};

export default PublishingPage;
