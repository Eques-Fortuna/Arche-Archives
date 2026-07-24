import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAdminRecovery,
  markRecoveryReady,
  blockRecovery,
  retryPhase
} from '../../lib/api';

// Components
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RecoveryActionModal from '../../components/recovery/RecoveryActionModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import { Terminal, Clock } from 'lucide-react';

const RecoveryPage = () => {
  const queryClient = useQueryClient();
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');

  // Selected row state for n8n trace display
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [curatorNotes, setCuratorNotes] = useState('');

  // Dialog & Modal Control States
  const [markReadyId, setMarkReadyId] = useState(null);
  const [confirmBlockId, setConfirmBlockId] = useState(null);
  const [confirmRetryId, setConfirmRetryId] = useState(null);

  // Fetch failed books query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminRecovery'],
    queryFn: () => getAdminRecovery(),
  });

  // Action Mutations
  const readyMutation = useMutation({
    mutationFn: ({ bookId, payload }) => markRecoveryReady(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRecovery'] });
      toast.success('Orchestration item marked ready to retry!');
      setMarkReadyId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update recovery state.');
    },
  });

  const blockMutation = useMutation({
    mutationFn: (bookId) => blockRecovery(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRecovery'] });
      toast.success('Operation blocked successfully.');
      setConfirmBlockId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to block operation.');
      setConfirmBlockId(null);
    },
  });

  const retryMutation = useMutation({
    mutationFn: (bookId) => retryPhase(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRecovery'] });
      toast.success('Retry command processed successfully!');
      setConfirmRetryId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch retry.');
      setConfirmRetryId(null);
    },
  });

  // Action Triggers
  const handleMarkReadySubmit = (payload) => {
    if (markReadyId) {
      readyMutation.mutate({ bookId: markReadyId, payload });
    }
  };

  const handleBlockSubmit = () => {
    if (confirmBlockId) {
      blockMutation.mutate(confirmBlockId);
    }
  };

  const handleRetrySubmit = () => {
    if (confirmRetryId) {
      retryMutation.mutate(confirmRetryId);
    }
  };

  // Client-side Filters
  const filteredData = useMemo(() => {
    let list = Array.isArray(data) ? data : [];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.book_id && String(item.book_id).toLowerCase().includes(q))
      );
    }

    // Phase Filter
    if (phaseFilter) {
      list = list.filter((item) => String(item.recovery_phase).toLowerCase() === phaseFilter.toLowerCase());
    }

    return list;
  }, [data, search, phaseFilter]);

  // Active Selected Item n8n JSON Trace resolver
  const activeRecovery = useMemo(() => {
    if (filteredData.length === 0) return null;
    if (!selectedBookId) return filteredData[0];
    return filteredData.find((item) => item.book_id === selectedBookId) || filteredData[0];
  }, [filteredData, selectedBookId]);

  const renderRetryDots = (count = 0) => {
    const max = 5;
    const dots = [];
    for (let i = 0; i < max; i++) {
      dots.push(
        <span
          key={i}
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            i < count ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-border)]'
          }`}
        />
      );
    }
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <div className="flex gap-0.5">{dots}</div>
        <span className="text-[9px] text-[var(--color-muted-ink)] font-mono font-bold ml-1">{count} / {max}</span>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving recovery telemetries..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Sync Recovery Panel"
        description="Could not synchronize failed compilations data feeds with the server."
        onRetry={refetch}
      />
    );
  }

  // Fallback data if DB is currently empty for testing
  const finalRecoveryList = filteredData.length > 0 ? filteredData : [
    { book_id: '8821', title: 'The Golden Bough', recovery_phase: 'Structure Parsing', error_type: 'JSON Mismatch', last_error: 'Unexpected token < in JSON at position 0', recovery_attempts: 3, updated_at: new Date().toISOString() },
    { book_id: '8842', title: 'Moby Dick (Folio Ed.)', recovery_phase: 'Metadata Sync', error_type: 'Auth Timeout', last_error: 'Connection request timed out during DigitalOcean credentials handshake.', recovery_attempts: 1, updated_at: new Date().toISOString() },
    { book_id: '8910', title: 'Ars Magna Lucis', recovery_phase: 'OCR Enrichment', error_type: 'Heap Limit', last_error: 'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory', recovery_attempts: 4, updated_at: new Date().toISOString() }
  ];

  const activeItem = activeRecovery || finalRecoveryList[0];

  return (
    <div className="space-y-6 w-full font-sans text-[var(--color-ink)] text-left">
      {/* Header and title */}
      <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-archive-green)] font-serif leading-tight flex items-center gap-3">
            Arche Portal Recovery
            <span className="px-2.5 py-0.5 rounded bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[9px] font-sans font-bold text-[var(--color-danger)] uppercase tracking-widest">
              Critical Failures
            </span>
          </h2>
          <p className="text-xs text-[var(--color-muted-ink)] mt-1">Automated ingestion failures requiring curator intervention.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[700px]">
        {/* Left main view: List Table exactly matching Mockup Layout */}
        <div className="flex-grow min-w-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between h-[700px] overflow-y-auto shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]/50">
              <span className="text-[10px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest font-sans">
                Ledger List
              </span>
              <input
                type="text"
                placeholder="Search ledger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-2.5 py-1 bg-[var(--color-panel)] border border-[var(--color-border)] rounded text-xs text-[var(--color-ink)] placeholder-[var(--color-muted-ink)]/50 focus:outline-none focus:border-[var(--color-archive-green)] transition-all max-w-[200px]"
              />
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-sm text-[var(--color-ink)]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted-ink)] uppercase tracking-wider">
                    <th className="px-4 py-3 font-sans">Book Title</th>
                    <th className="px-4 py-3 font-sans">Phase</th>
                    <th className="px-4 py-3 font-sans">Error Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/40 text-xs">
                  {finalRecoveryList.map((item) => (
                    <tr
                      key={item.book_id}
                      onClick={() => setSelectedBookId(item.book_id)}
                      className={`hover:bg-[var(--color-panel)]/30 transition-colors cursor-pointer ${
                        activeItem?.book_id === item.book_id ? 'bg-[var(--color-panel)] font-bold' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <span className="font-serif block text-[var(--color-ink)]">{item.title}</span>
                        <span className="text-[9px] text-[var(--color-subtle-ink)] font-mono block mt-0.5">ID: {item.book_id}</span>
                      </td>
                      <td className="px-4 py-3.5 align-middle font-sans text-[var(--color-muted-ink)] font-bold uppercase tracking-wider text-[10px]">
                        {item.recovery_phase || item.current_stage || 'Structure'}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="px-2 py-0.5 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 text-[9px] font-bold text-[var(--color-danger)] uppercase tracking-widest rounded whitespace-nowrap">
                          {item.error_type || 'JSON Mismatch'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right view: Redesigned Incident Report details Panel */}
        <div className="w-full lg:w-[420px] shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between h-[700px] overflow-y-auto shadow-sm">
          {activeItem ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-[var(--color-border)]">
                  <div>
                    <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block font-sans">Incident Report</span>
                    <h3 className="text-lg font-bold text-[var(--color-archive-green)] font-serif mt-0.5">#{activeItem.book_id || '8842'}</h3>
                    <p className="text-xs text-[var(--color-ink)] font-serif italic mt-1 font-bold">{activeItem.title}</p>
                  </div>
                  <div className="text-right text-[9px] text-[var(--color-muted-ink)] font-mono uppercase tracking-wider space-y-0.5 font-bold">
                    <div>Ref: Archive-QX{activeItem.book_id}</div>
                    <div className="text-[var(--color-danger)]">Lvl 3 Escalation</div>
                  </div>
                </div>

                {/* Error Reason Panel */}
                <div className="space-y-1">
                  <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Error Reason</span>
                  <div className="p-3 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 rounded-xl text-[11px] font-mono text-[var(--color-danger)] break-words leading-relaxed select-all font-semibold">
                    {activeItem.last_error || activeItem.error_message || 'Unexpected token < in JSON at position 0'}
                  </div>
                </div>

                {/* Retry Progress circles dots */}
                <div>
                  <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Retry Count</span>
                  {renderRetryDots(activeItem.recovery_attempts || 0)}
                </div>

                {/* n8n Trace terminal logs */}
                <div className="space-y-1 text-left">
                  <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">n8n Execution Trace</span>
                  <div className="p-4 bg-[var(--color-code-bg)] text-[var(--color-code-text)] rounded-xl font-mono text-[9px] h-36 overflow-y-auto space-y-1 leading-normal border border-[var(--color-border)]/35 select-all">
                    <div>[{new Date(activeItem.updated_at).toLocaleDateString()}] INFO Workflow: Ingestion_v4</div>
                    <div className="text-[var(--color-warning)]">&gt;&gt; Initializing HTTP Request to Arche-API...</div>
                    <div className="text-[var(--color-code-muted)]">&gt;&gt; Headers: &#123; "X-API-KEY": "********", "Content-Type": "application/json" &#125;</div>
                    <div className="text-[var(--color-danger-soft)] font-bold">!! CRITICAL_ERROR: Received HTML response instead of JSON.</div>
                    <div className="text-[var(--color-code-muted)]">... execution suspended. Node: {activeItem.node_name || 'n8n_recovery_router'}</div>
                  </div>
                </div>

                {/* Curator observations textarea */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[var(--color-muted-ink)] font-bold uppercase tracking-widest block">Curator Observations</span>
                  <textarea
                    placeholder="Document the remediation steps here..."
                    value={curatorNotes}
                    onChange={(e) => setCuratorNotes(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-ink)] placeholder-[var(--color-muted-ink)]/60 focus:outline-none focus:border-[var(--color-archive-green)] transition-all font-sans"
                  />
                </div>
              </div>

              {/* Actions stacked triggers */}
              <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMarkReadyId(activeItem.book_id)}
                    className="flex items-center justify-center p-2.5 bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-[var(--color-surface)] font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm border border-transparent"
                  >
                    Mark Ready
                  </button>
                  <button
                    onClick={() => setConfirmRetryId(activeItem.book_id)}
                    className="flex items-center justify-center p-2.5 bg-[var(--color-archive-green)] hover:bg-[var(--color-archive-green-dark)] text-[var(--color-surface)] font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm border border-transparent"
                  >
                    Retry Now
                  </button>
                </div>
                <button
                  onClick={() => setConfirmBlockId(activeItem.book_id)}
                  className="w-full flex items-center justify-center p-2.5 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-[var(--color-surface)] font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm border border-transparent"
                >
                  Block Book
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-[var(--color-muted-ink)] text-xs">
              No failed compilation item selected.
            </div>
          )}
        </div>
      </div>

      {/* Action Dialogs */}
      <RecoveryActionModal
        isOpen={markReadyId !== null}
        onClose={() => setMarkReadyId(null)}
        onConfirm={handleMarkReadySubmit}
        isPending={readyMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmBlockId !== null}
        onClose={() => setConfirmBlockId(null)}
        onConfirm={handleBlockSubmit}
        title="Block Pipeline Orchestration"
        message="Are you sure you want to block this book from further automated compilation retry runs?"
        confirmText="Block Book"
        confirmVariant="danger"
        isLoading={blockMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmRetryId !== null}
        onClose={() => setConfirmRetryId(null)}
        onConfirm={handleRetrySubmit}
        title="Retry Compilation Stage"
        message="Are you sure you want to trigger XeLaTeX and structure compilations retries? This will reset the stage status in the pipelines."
        confirmText="Retry Stage"
        confirmVariant="primary"
        isLoading={retryMutation.isPending}
      />
    </div>
  );
};

export default RecoveryPage;
