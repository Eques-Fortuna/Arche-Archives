import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  getAdminCoverReviewQueue,
  approveCoverReview,
  rejectCoverReview,
  requestHumanCoverUploadUrl,
  submitHumanCover,
  getFileSignedUrl
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { canReviewCovers, canUploadHumanCover } from '../../lib/auth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import Card from '../../components/ui/Card';
import { Check, RefreshCw, Upload, Loader2, BookOpen, Clock, Terminal, ShieldAlert } from 'lucide-react';

const CoverReviewPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(1); // '1' | '2' | '3'
  const [notes, setNotes] = useState('');
  
  // Custom cover upload states
  const [isUploadingHuman, setIsUploadingHuman] = useState(false);
  const [humanUploadedPath, setHumanUploadedPath] = useState('');
  const [humanUploadedUrl, setHumanUploadedUrl] = useState('');

  // Confirmation state
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'

  // Query Queue
  const { data: queue, isLoading, error, refetch } = useQuery({
    queryKey: ['coverReviewQueue'],
    queryFn: () => getAdminCoverReviewQueue(),
  });

  const books = Array.isArray(queue) ? queue : [];
  const selectedBook = books[selectedBookIndex];

  // Option candidates images states
  const [optionUrls, setOptionUrls] = useState({});

  // Reset states on book change
  useEffect(() => {
    setSelectedOption(1);
    setHumanUploadedPath('');
    setHumanUploadedUrl('');
    setNotes('');
    setOptionUrls({});

    if (!selectedBook) return;

    // Prefetch signed URLs for cover options
    const fetchCoverUrls = async () => {
      const urls = {};
      const optionsList = [1, 2, 3];
      for (const optNum of optionsList) {
        try {
          const optObj = selectedBook.cover_options?.find(o => o.option_number === optNum);
          const fileId = optObj?.file_id || optObj?.id || `option_${optNum}`;
          
          // Request file signed URL
          const res = await getFileSignedUrl(selectedBook.book_id, fileId);
          if (res?.url) {
            urls[optNum] = res.url;
          }
        } catch (e) {
          // If signed URL fetch fails, set null so neutral cover placeholder is rendered
          urls[optNum] = null;
        }
      }
      setOptionUrls(urls);
    };

    fetchCoverUrls();
  }, [selectedBook]);

  // Action Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ bookId, type, payload }) => {
      if (type === 'approve') {
        return approveCoverReview(bookId, payload);
      } else {
        return rejectCoverReview(bookId, payload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coverReviewQueue'] });
      toast.success(`Cover review decision [${variables.type}] recorded successfully!`);
      setSelectedBookIndex(0);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit cover review.');
    },
  });

  const handleHumanCoverUpload = async (file) => {
    if (!file) return;
    setIsUploadingHuman(true);
    const toastId = toast.loading('Uploading custom human designed cover...');
    try {
      // 1. Fetch S3 signed upload URL
      const { upload_url, storage_path } = await requestHumanCoverUploadUrl(selectedBook.book_id || selectedBook.id, {
        file_name: file.name,
        content_type: file.type || 'image/png'
      });

      // 2. Upload directly to S3 / DigitalOcean Spaces
      await axios.put(upload_url, file, {
        headers: {
          'Content-Type': file.type || 'image/png'
        }
      });

      // 3. Override Cover Design on pipeline
      await submitHumanCover(selectedBook.book_id || selectedBook.id, {
        approved_cover_path: storage_path,
        reviewer_name: currentUser?.name || 'Art Director',
        reviewer_email: currentUser?.email || '',
        notes: notes || 'Custom direct human cover design upload'
      });

      // Resolve a preview URL to render in selection grid immediately
      const previewRes = await getFileSignedUrl(selectedBook.book_id, 'approved_cover');
      if (previewRes?.url) {
        setHumanUploadedUrl(previewRes.url);
      } else {
        setHumanUploadedUrl(URL.createObjectURL(file));
      }
      setHumanUploadedPath(storage_path);
      setSelectedOption(3); // Auto select human override column

      toast.success('Human-designed cover uploaded successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to complete human cover override upload.', { id: toastId });
    } finally {
      setIsUploadingHuman(false);
    }
  };

  const handleTriggerAction = (type) => {
    if (type === 'reject' && !notes.trim()) {
      toast.error('Feedback comments are required when rejecting candidates.');
      return;
    }
    setConfirmAction(type);
  };

  const handleConfirm = () => {
    if (!selectedBook) return;

    const payload = {
      reviewer_name: currentUser?.name || 'Art Director',
      reviewer_email: currentUser?.email || '',
      notes: notes || `Approved cover option #${selectedOption}`,
    };

    if (confirmAction === 'approve') {
      payload.approved_option = selectedOption;
      // Approved cover path
      const optObj = selectedBook.cover_options?.find(o => o.option_number === selectedOption);
      payload.approved_cover_path = optObj?.storage_path || `covers/approved/${selectedBook.slug}/option_${selectedOption}.jpg`;
      
      if (selectedOption === 3 && humanUploadedPath) {
        payload.approved_cover_path = humanUploadedPath;
      }
    } else {
      payload.recovery_action = 'Regenerate cover options using n8n AI engine.';
    }

    actionMutation.mutate({
      bookId: selectedBook.book_id,
      type: confirmAction,
      payload
    });
    setConfirmAction(null);
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving pending cover review catalog queue..." />;
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
        title="No books waiting for cover review."
        description="All generated cover options have been reviewed or approved."
      />
    );
  }

  return (
    <div className="space-y-6 w-full font-sans text-[var(--color-ink)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] pb-4 flex justify-between items-center text-left">
        <div>
          <span className="text-[10px] text-[var(--color-warning)] font-bold uppercase tracking-widest block font-sans">
            Curatorial Review
          </span>
          <h2 className="text-3xl font-bold text-[var(--color-archive-green)] font-serif mt-1">The Alchemy of Cover Design</h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[720px]">
        {/* Left Sidebar Book Selector */}
        <div className="w-full lg:w-60 shrink-0 flex flex-col justify-between bg-[var(--color-panel)] p-3 rounded-2xl border border-[var(--color-border)] h-[720px] text-left">
          <div className="space-y-4 overflow-y-auto">
            <span className="text-[9px] font-bold text-[var(--color-muted-ink)] uppercase tracking-widest px-2 block">Pending Queue ({books.length})</span>
            <div className="space-y-1.5">
              {books.map((b, idx) => (
                <div
                  key={b.book_id || b.id}
                  onClick={() => {
                    setSelectedBookIndex(idx);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedBookIndex === idx
                      ? 'border-[var(--color-archive-green)] bg-[var(--color-surface)] text-[var(--color-archive-green)] font-bold shadow-sm'
                      : 'border-[var(--color-border)]/40 bg-[var(--color-surface)]/45 hover:bg-[var(--color-surface)] text-[var(--color-muted-ink)]'
                  }`}
                >
                  <span className="font-serif font-bold text-xs block truncate">{b.title}</span>
                  <span className="text-[9px] text-[var(--color-muted-ink)] uppercase font-bold tracking-wider block mt-1">By {b.author}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drag & Drop Override Box */}
          <div className="border-t border-[var(--color-border)] pt-4 mt-4 space-y-2">
            <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block px-2">Human Design Override</span>
            {!canUploadHumanCover(currentUser) ? (
              <div className="border border-dashed border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] flex flex-col items-center justify-center text-center gap-2 h-36">
                <ShieldAlert className="w-5 h-5 text-[var(--color-danger)] animate-pulse" />
                <span className="text-[10px] font-bold text-[var(--color-danger)] block">Upload Disabled</span>
                <span className="text-[9px] text-[var(--color-muted-ink)] block leading-normal">Cover reviewers only</span>
              </div>
            ) : (
              <div className="relative border border-dashed border-[var(--color-border)] hover:border-[var(--color-archive-green)] rounded-xl p-4 transition-all bg-[var(--color-surface)] flex flex-col items-center justify-center text-center gap-2 cursor-pointer group shadow-sm h-36">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHumanCoverUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploadingHuman}
                />
                {isUploadingHuman ? (
                  <div className="space-y-1">
                    <Loader2 className="w-5 h-5 text-[var(--color-archive-green)] animate-spin mx-auto" />
                    <span className="text-[9px] text-[var(--color-muted-ink)]">Uploading design...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[var(--color-muted-ink)] group-hover:text-[var(--color-archive-green)] transition-colors" />
                    <span className="text-[10px] font-bold text-[var(--color-ink)] block">Upload human cover</span>
                    <span className="text-[9px] text-[var(--color-subtle-ink)] block leading-normal">Bypasses generative pipeline stages</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Candidate Selection Room */}
        <div className="flex-1 flex flex-col justify-between space-y-6 text-left">
          <Card className="p-6 flex-grow flex flex-col justify-between">
            {/* Curatorial Header */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-ink)] font-serif leading-tight">{selectedBook.title}</h3>
                  <p className="text-[10px] text-[var(--color-muted-ink)] font-mono mt-1 uppercase tracking-wider font-semibold">
                    Manuscript ID: {selectedBook.book_id} • AUTHOR: {selectedBook.author}
                  </p>
                </div>

                {/* Confirm actions top right */}
                <div className="flex items-center gap-2 shrink-0">
                  {canReviewCovers(currentUser) ? (
                    <>
                      <button
                        onClick={() => handleTriggerAction('reject')}
                        disabled={actionMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-danger)] text-[10px] font-sans font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reject & Regenerate
                      </button>
                      <button
                        onClick={() => handleTriggerAction('approve')}
                        disabled={actionMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-archive-green)] text-[10px] font-sans font-bold text-[var(--color-surface)] hover:bg-[var(--color-archive-green-dark)] border border-transparent uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Check className="w-3 h-3" />
                        Approve Selected
                      </button>
                    </>
                  ) : (
                    <span className="px-2.5 py-1 bg-[var(--color-danger-soft)]/20 border border-[var(--color-danger)]/15 text-[var(--color-danger)] text-[9px] font-sans font-bold uppercase tracking-widest rounded-xl">
                      Read Only
                    </span>
                  )}
                </div>
              </div>

              {/* Selection Room Grid */}
              <div className="mt-6 space-y-4">
                <span className="text-[10px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block font-sans">
                  Variant Selection Room
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Variant A */}
                  <div
                    onClick={() => setSelectedOption(1)}
                    className={`border rounded-2xl p-3 bg-[var(--color-panel)] flex flex-col justify-between cursor-pointer transition-all ${
                      selectedOption === 1 ? 'border-[var(--color-warning)] ring-2 ring-[var(--color-warning)]/20 shadow' : 'border-[var(--color-border)] hover:border-[var(--color-archive-green)]'
                    }`}
                  >
                    <div className="aspect-[2/3] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex items-center justify-center relative shadow-sm">
                      {optionUrls[1] ? (
                        <img src={optionUrls[1]} alt="Variant A" className="w-full h-full object-cover select-none" />
                      ) : (
                        <BookOpen className="w-8 h-8 text-[var(--color-subtle-ink)]/20" />
                      )}
                      {selectedOption === 1 && (
                        <div className="absolute top-2 right-2 bg-[var(--color-warning)] text-[var(--color-surface)] p-1 rounded-full shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-xs font-bold text-[var(--color-ink)] block">Variant A</span>
                      <span className="text-[9px] text-[var(--color-muted-ink)] uppercase tracking-wider font-semibold">The Classicist Spine</span>
                    </div>
                  </div>

                  {/* Variant B */}
                  <div
                    onClick={() => setSelectedOption(2)}
                    className={`border rounded-2xl p-3 bg-[var(--color-panel)] flex flex-col justify-between cursor-pointer transition-all ${
                      selectedOption === 2 ? 'border-[var(--color-warning)] ring-2 ring-[var(--color-warning)]/20 shadow' : 'border-[var(--color-border)] hover:border-[var(--color-archive-green)]'
                    }`}
                  >
                    <div className="aspect-[2/3] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex items-center justify-center relative shadow-sm">
                      {optionUrls[2] ? (
                        <img src={optionUrls[2]} alt="Variant B" className="w-full h-full object-cover select-none" />
                      ) : (
                        <BookOpen className="w-8 h-8 text-[var(--color-subtle-ink)]/20" />
                      )}
                      {selectedOption === 2 && (
                        <div className="absolute top-2 right-2 bg-[var(--color-warning)] text-[var(--color-surface)] p-1 rounded-full shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-xs font-bold text-[var(--color-ink)] block">Variant B</span>
                      <span className="text-[9px] text-[var(--color-muted-ink)] uppercase tracking-wider font-semibold">Monolith Minimal</span>
                    </div>
                  </div>

                  {/* Variant C / Human Override Uploaded Cover */}
                  <div
                    onClick={() => setSelectedOption(3)}
                    className={`border rounded-2xl p-3 bg-[var(--color-panel)] flex flex-col justify-between cursor-pointer transition-all ${
                      selectedOption === 3 ? 'border-[var(--color-warning)] ring-2 ring-[var(--color-warning)]/20 shadow' : 'border-[var(--color-border)] hover:border-[var(--color-archive-green)]'
                    }`}
                  >
                    <div className="aspect-[2/3] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex items-center justify-center relative shadow-sm">
                      {humanUploadedUrl ? (
                        <img src={humanUploadedUrl} alt="Human Override" className="w-full h-full object-cover select-none" />
                      ) : optionUrls[3] ? (
                        <img src={optionUrls[3]} alt="Variant C" className="w-full h-full object-cover select-none" />
                      ) : (
                        <BookOpen className="w-8 h-8 text-[var(--color-subtle-ink)]/20" />
                      )}
                      {selectedOption === 3 && (
                        <div className="absolute top-2 right-2 bg-[var(--color-warning)] text-[var(--color-surface)] p-1 rounded-full shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-xs font-bold text-[var(--color-ink)] block">
                        {humanUploadedUrl ? 'Human Override' : 'Variant C'}
                      </span>
                      <span className="text-[9px] text-[var(--color-muted-ink)] uppercase tracking-wider font-semibold">
                        {humanUploadedUrl ? 'Direct Design Apply' : 'Contemporary Bold'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Form */}
            <div className="mt-6 pt-4 border-t border-[var(--color-border)] space-y-2">
              <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block font-sans">
                Curatorial Audit Notes
              </span>
              <textarea
                placeholder="Enter feedback comments for rejections or approvals..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-3 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-ink)] placeholder-[var(--color-muted-ink)]/60 focus:outline-none focus:border-[var(--color-archive-green)] transition-all font-sans"
              />
            </div>
          </Card>

          {/* Automation Trace logs card */}
          <Card className="p-5 border border-[var(--color-border)] bg-[var(--color-code-bg)] text-[var(--color-code-text)]">
            <div className="flex justify-between items-center border-b border-[var(--color-border)]/35 pb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest font-sans flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[var(--color-archive-green-soft)]" />
                Automation Trace
              </span>
              <span className="text-[9px] text-[var(--color-success)] font-mono font-bold uppercase tracking-widest">
                STREAM: ARCH-COVER-05
              </span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-[9px] text-[var(--color-code-muted)] select-all text-left">
              <div>[14:02:11] GENERATIVE ENGINE INITIALIZED <span className="text-[var(--color-success)] font-bold">SUCCESS</span></div>
              <div>[14:02:45] APPLIED SEED: ARCHIVAL_GOLD_8829 <span className="text-[var(--color-success)] font-bold">VERIFIED</span></div>
              {humanUploadedPath && (
                <div>[14:03:12] HUMAN OVERRIDE DETECTED (M. VASQUEZ) <span className="text-[var(--color-warning)] font-bold">BYPASS ACTIVE</span></div>
              )}
              <div>[14:03:15] READY FOR FINAL CURATORIAL SEAL <span className="text-[var(--color-code-text)] font-bold">AWAITING INPUT...</span></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={`${confirmAction ? confirmAction.toUpperCase() : ''} Cover Decision`}
        message={`Are you sure you want to execute this cover review ${confirmAction} action?`}
        confirmText="Confirm Decision"
        confirmVariant={confirmAction === 'reject' ? 'danger' : 'primary'}
        isLoading={actionMutation.isPending}
      />
    </div>
  );
};

export default CoverReviewPage;
