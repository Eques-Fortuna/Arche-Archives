import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Play, RotateCcw, Eye, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Upload, HelpCircle, ShieldAlert } from 'lucide-react';
import { getEligibleBooks, runPhase, runPhaseBatch, retryPhase } from '../../lib/api';
import { getPhaseConfig } from '../../lib/phaseConfig';
import { useAuth } from '../../context/AuthContext';
import { canRunAutomation, canRetry, canUploadHumanCover } from '../../lib/auth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import HumanCoverUploadModal from '../../components/review/HumanCoverUploadModal';

const PhaseIngestionPage = () => {
  const { stage } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmRetryId, setConfirmRetryId] = useState(null);
  const [selectedBookForUpload, setSelectedBookForUpload] = useState(null);

  // Batch phase states
  const [batchLimit, setBatchLimit] = useState(10);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [activeLogic, setActiveLogic] = useState('ai'); // 'ai' or 'human' (for cover gen)

  const phaseConfig = getPhaseConfig(stage);
  const canRun = canRunAutomation(user);
  const canRet = canRetry(user);
  const canUpload = canUploadHumanCover(user);

  // Fetch eligible books from the backend using the canonical phase name
  const {
    data: eligibleData,
    isLoading: eligibleLoading,
    error: eligibleError,
    refetch: refetchEligible
  } = useQuery({
    queryKey: ['eligibleBooks', phaseConfig?.canonicalPhase, batchLimit],
    queryFn: () => getEligibleBooks(phaseConfig?.canonicalPhase, batchLimit),
    enabled: !!phaseConfig?.canonicalPhase,
    refetchInterval: (query) => {
      const dataObj = query.state.data;
      const list = dataObj && Array.isArray(dataObj.books) ? dataObj.books : [];
      if (list.some(b => b.stage_status === 'in_progress' || b.stage_status === 'pending')) {
        return 5000;
      }
      return false;
    }
  });

  const eligibleBooks = useMemo(() => {
    return eligibleData && Array.isArray(eligibleData.books) ? eligibleData.books : [];
  }, [eligibleData]);

  // Mutations
  const runNextMutation = useMutation({
    mutationFn: (bookId) => runPhase(bookId, phaseConfig?.canonicalPhase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligibleBooks'] });
      toast.success('Pipeline phase job started!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to dispatch pipeline phase.');
    }
  });

  const runBatchMutation = useMutation({
    mutationFn: (limit) => runPhaseBatch(phaseConfig?.runParam, { limit }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eligibleBooks'] });
      if (data.triggered) {
        toast.success(data.message || 'Pipeline batch trigger successfully processed!');
      } else {
        toast.success(data.message || 'No books were triggered.');
      }
      setShowBatchConfirm(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to dispatch batch phase.');
      setShowBatchConfirm(false);
    }
  });

  const retryMutation = useMutation({
    mutationFn: (bookId) => retryPhase(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligibleBooks'] });
      toast.success('Retry trigger successfully resolved!');
      setConfirmRetryId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resolve retry.');
      setConfirmRetryId(null);
    }
  });

  if (!phaseConfig) {
    return (
      <ErrorState
        title="Invalid Automation Phase"
        description={`The phase "${stage}" is not recognized as a valid automation pipeline phase.`}
      />
    );
  }

  const isBatchButtonDisabled =
    eligibleLoading ||
    runBatchMutation.isPending ||
    !canRun ||
    !phaseConfig ||
    (eligibleData?.ok && eligibleBooks.length === 0);

  const limits = [5, 10, 25, 50];

  return (
    <div className="space-y-8 w-full font-sans text-[#1A1A1A]">
      {/* Back link */}
      <div>
        <Link
          to="/dashboard/books"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5F5A52] hover:text-[#2A473E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Books Catalog
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-[#DED2BE] pb-6">
        <h2 className="text-3xl font-bold text-[#2A473E] font-serif leading-tight">
          Phase {phaseConfig.number}: {phaseConfig.title.replace(`Phase ${phaseConfig.number}:`, '').trim()}
        </h2>
        <p className="text-sm text-[#5F5A52] max-w-3xl mt-2 font-serif leading-relaxed">
          {phaseConfig.description || 'Orchestrating visual synthesis and compiling stages for the active archival volumes.'}
        </p>
      </div>

      {/* Main Grid: Parameters & Sidebar Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Queue Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-[#DED2BE] bg-[#FFFDF8] relative overflow-hidden">
            <h3 className="text-xs font-bold text-[#2A473E] uppercase tracking-widest border-b border-[#DED2BE] pb-2.5 mb-5 font-sans">
              Queue Parameters
            </h3>
            <p className="text-xs text-[#5F5A52] mb-4">Select batch volume limit for this execution cycle:</p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-[#FAF6EE] p-5 rounded border border-[#DED2BE]">
              {/* Custom limit button selector instead of standard select */}
              <div className="flex items-center gap-1.5">
                {limits.map((l) => (
                  <button
                    key={l}
                    onClick={() => setBatchLimit(l)}
                    className={`px-3 py-1.5 border text-xs font-mono font-bold transition-all rounded cursor-pointer ${
                      batchLimit === l
                        ? 'bg-[#C79A3B] border-[#C79A3B] text-[#FAF6EE] shadow-sm'
                        : 'bg-[#FFFDF8] border-[#DED2BE] text-[#1A1A1A] hover:bg-[#F1E7D6]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {canRun ? (
                <Button
                  variant="primary"
                  onClick={() => setShowBatchConfirm(true)}
                  disabled={isBatchButtonDisabled}
                  size="md"
                  className="flex items-center gap-2 text-xs py-2 shadow-sm font-bold uppercase tracking-widest shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Initiate Phase {phaseConfig.number} for Eligible Volumes
                </Button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/25 text-[var(--color-danger)] text-xs font-bold rounded">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Read-Only: Phase Execution Restricted</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Visual Integrity Logic / Phase settings */}
        <div className="space-y-6">
          <Card className="p-6 border border-[#DED2BE] bg-[#FFFDF8] space-y-4">
            <h3 className="text-xs font-bold text-[#2A473E] uppercase tracking-widest border-b border-[#DED2BE] pb-2.5 font-sans">
              {phaseConfig.number === 5 ? 'Visual Integrity Logic' : 'Pipeline Operations Guide'}
            </h3>

            {phaseConfig.number === 5 ? (
              // Phase 5 Cover Generation options matching the design screenshot
              <div className="space-y-4 text-xs font-sans">
                <button
                  onClick={() => setActiveLogic('ai')}
                  className={`w-full text-left p-4 rounded border transition-all cursor-pointer flex items-start gap-3 ${
                    activeLogic === 'ai'
                      ? 'border-[#2A473E] bg-[#2A473E]/5 text-[#1A1A1A]'
                      : 'border-[#DED2BE] bg-[#FAF6EE] text-[#5F5A52]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${activeLogic === 'ai' ? 'border-[#2A473E]' : 'border-[#DED2BE]'}`}>
                    {activeLogic === 'ai' && <div className="w-2 h-2 rounded-full bg-[#2A473E]" />}
                  </div>
                  <div>
                    <span className="font-bold text-[#2A473E] block">Generate AI Cover Variants</span>
                    <span className="text-[10px] text-[#5F5A52] block mt-1 leading-relaxed">
                      The default automation path using generative n8n pipeline nodes.
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload cover designs.');
                      return;
                    }
                    setActiveLogic('human');
                    if (eligibleBooks.length > 0) {
                      setSelectedBookForUpload(eligibleBooks[0]);
                    }
                  }}
                  disabled={!canUpload}
                  className={`w-full text-left p-4 rounded border transition-all flex items-start gap-3 ${
                    !canUpload ? 'opacity-55 cursor-not-allowed border-[#DED2BE] bg-[#FAF6EE]/50 text-[#5F5A52]' : 'cursor-pointer'
                  } ${
                    activeLogic === 'human'
                      ? 'border-[#2A473E] bg-[#2A473E]/5 text-[#1A1A1A]'
                      : 'border-[#DED2BE] bg-[#FAF6EE] text-[#5F5A52]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${activeLogic === 'human' ? 'border-[#2A473E]' : 'border-[#DED2BE]'}`}>
                    {activeLogic === 'human' && <div className="w-2 h-2 rounded-full bg-[#2A473E]" />}
                  </div>
                  <div>
                    <span className="font-bold text-[#2A473E] block">Bypass AI: Upload Archival Cover</span>
                    <span className="text-[10px] text-[#5F5A52] block mt-1 leading-relaxed">
                      Skip generative steps to bind human-curated layouts directly.
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              // Standard operations guide
              <div className="space-y-3 text-xs text-[#5F5A52] font-sans leading-relaxed">
                <div className="flex gap-2.5 items-start">
                  <HelpCircle className="w-4 h-4 text-[#C79A3B] shrink-0 mt-0.5" />
                  <p>Books are automatically scheduled in active queues when preceding reviews pass successfully.</p>
                </div>
                <div className="flex gap-2.5 items-start pt-2 border-t border-[#DED2BE]/50">
                  <ShieldAlert className="w-4 h-4 text-[#8A2D3B] shrink-0 mt-0.5" />
                  <p>Failed phases alert compilers and route books to the Recovery Panel for manual checks.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Main Archival Queue List */}
      <div className="space-y-4 pt-4 border-t border-[#DED2BE]">
        <h3 className="text-lg font-bold text-[#1A1A1A] font-serif leading-tight">
          Archival Queue: {eligibleBooks.length} Books Remaining
        </h3>

        {eligibleError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#FFFDF8] border border-[#DED2BE] rounded">
            <AlertCircle className="w-8 h-8 text-[#8A2D3B] mb-2" />
            <p className="text-sm font-semibold text-[#5F5A52]">Failed to load eligible books</p>
            <Button variant="ghost" size="sm" className="mt-2 text-[#2A473E]" onClick={() => refetchEligible()}>
              Retry Fetching Queue
            </Button>
          </div>
        ) : eligibleLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FFFDF8] border border-[#DED2BE] rounded">
            <Loader2 className="w-8 h-8 text-[#2A473E] animate-spin mb-2" />
            <p className="text-xs font-semibold text-[#5F5A52] uppercase tracking-wider">Synchronizing queue lists...</p>
          </div>
        ) : eligibleBooks.length > 0 ? (
          // Visual custom book list cards matching Phase Ingestion Redesign mockup
          <div className="space-y-4">
            {eligibleBooks.map((book) => {
              const isRunning = book.stage_status === 'in_progress' || book.stage_status === 'pending';
              const isFailed = book.stage_status === 'failed';
              return (
                <div key={book.book_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded border border-[#DED2BE] bg-[#FFFDF8] hover:border-[#2A473E] transition-all">
                  <div className="flex gap-4 min-w-0">
                    {/* Book image placeholder */}
                    <div className="w-12 h-16 bg-[#FAF6EE] border border-[#DED2BE] rounded flex items-center justify-center text-[#5F5A52]/30 shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-[#5F5A52]/20" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/dashboard/books/${book.book_id}`}
                          className="font-serif font-bold text-[#1A1A1A] hover:text-[#2A473E] text-base leading-tight truncate block"
                        >
                          {book.title}
                        </Link>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-widest ${
                          isRunning
                            ? 'bg-[#B86B3E]/10 text-[#B86B3E] border border-[#B86B3E]/20 animate-pulse'
                            : isFailed
                            ? 'bg-[#8A2D3B]/10 text-[#8A2D3B] border border-[#8A2D3B]/20'
                            : 'bg-[#3F6F5A]/10 text-[#3F6F5A] border border-[#3F6F5A]/20'
                        }`}>
                          {isRunning ? 'RUNNING' : isFailed ? 'FAILED' : 'READY FOR SYNTHESIS'}
                        </span>
                      </div>
                      <p className="text-xs text-[#5F5A52] font-medium">by {book.author}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#5F5A52] font-mono uppercase tracking-wider pt-0.5">
                        <span>ISBN-13: {book.isbn || '978-3-16-148410-0'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Ingestion: {new Date(book.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                      {book.last_error && isFailed && (
                        <p className="text-[10px] font-mono text-[#8A2D3B] bg-[#8A2D3B]/5 p-2 rounded border border-[#8A2D3B]/10 mt-2 max-w-2xl leading-relaxed">
                          Error log: {book.last_error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions right side aligned */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {isFailed && canRet && (
                      <button
                        onClick={() => setConfirmRetryId(book.book_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#B86B3E] text-[10px] font-sans font-bold text-[#B86B3E] hover:bg-[#B86B3E]/5 uppercase tracking-widest rounded transition-all cursor-pointer shadow-sm"
                        title="Retry Phase"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                    )}
                    {canRun && !isRunning && (
                      <button
                        onClick={() => runNextMutation.mutate(book.book_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3F6F5A] text-[10px] font-sans font-bold text-[#3F6F5A] hover:bg-[#3F6F5A]/5 uppercase tracking-widest rounded transition-all cursor-pointer shadow-sm"
                        title="Run Phase"
                      >
                        <Play className="w-3 h-3" />
                        Run Phase
                      </button>
                    )}
                    <Link
                      to={`/dashboard/books/${book.book_id}`}
                      className="flex items-center gap-1 text-[10px] font-sans font-bold text-[#5F5A52] hover:text-[#2A473E] uppercase tracking-widest py-1.5"
                    >
                      Manual Review →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Archival queue is clear"
            description="All volumes have progressed successfully through this phase."
          />
        )}
      </div>

      {/* Confirm Retry Dialog */}
      <ConfirmDialog
        isOpen={confirmRetryId !== null}
        onClose={() => setConfirmRetryId(null)}
        onConfirm={() => {
          if (confirmRetryId) retryMutation.mutate(confirmRetryId);
        }}
        title="Retry Ingestion Phase"
        message="Are you sure you want to retry this failed operation? This resets status to pending and immediately triggers the phase run."
        confirmText="Retry Stage"
        confirmVariant="primary"
        isLoading={retryMutation.isPending}
      />

      {/* Confirm Batch Run Dialog */}
      <ConfirmDialog
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        onConfirm={() => runBatchMutation.mutate(batchLimit)}
        title="Trigger Batch Phase Run"
        message={`Are you sure you want to trigger this phase workflow for eligible books? This will run the automation for up to ${batchLimit} books.`}
        confirmText="Trigger Batch"
        confirmVariant="primary"
        isLoading={runBatchMutation.isPending}
      />

      {/* Human Cover Upload Dialog */}
      {selectedBookForUpload && (
        <HumanCoverUploadModal
          isOpen={selectedBookForUpload !== null}
          onClose={() => setSelectedBookForUpload(null)}
          book={{ book_id: selectedBookForUpload.book_id || selectedBookForUpload.id, title: selectedBookForUpload.title }}
          currentUser={user}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['eligibleBooks'] });
          }}
        />
      )}
    </div>
  );
};

export default PhaseIngestionPage;
